window.initSearchAndTable = function () {
    const data = window.ALL_SONGS;

    function safeStr(v) {
        return v == null ? "" : String(v);
    }

    function stripArticle(title) {
        return safeStr(title)
            .toLowerCase()
            .replace(/^(the|an|a|el)\s+/i, "")
            .trim();
    }

    // --------------------
    // ADD FILTER BUTTON
    // --------------------
    $(document).on("click", "#add-filter", addFilterRow);

    function addFilterRow() {
        const template = $("#filter-template");
        if (!template.length) return;

        const newFilter = template.clone().removeAttr("id");
        newFilter.find("input").val("");
        newFilter.find("select").prop("selectedIndex", 0);
        newFilter.show();

        $("#extra-filters").append(newFilter);

        const input = newFilter.find("input")[0];
        if (input) {
            window.ACTIVE_SEARCH_BOX = input;
            input.focus();
        }

        attachAutocomplete(input, newFilter.find("select")[0]);
    }

    // --------------------
    // REMOVE FILTER BUTTON
    // --------------------
    $(document).on("click", ".remove-filter", function () {
        $(this).closest(".multi-filter").remove();
        performSearch();
    });

    // --------------------
    // AUTOCOMPLETE DISABLED FIELDS
    // --------------------
    const AUTOCOMPLETE_DISABLED_FIELDS = new Set([
        "Full Melody",
        "Full Rhythm",
        "Grade Level"
    ]);

    // --------------------
    // THUMBNAIL LOADER
    // --------------------
    async function loadThumbnail(pdfPath, canvas, w) {
        if (!pdfPath || !canvas) return;
        const pdf = await pdfjsLib.getDocument(pdfPath).promise;
        const page = await pdf.getPage(1);
        const vp = page.getViewport({ scale: 1 });
        const scale = (w * 2.5) / vp.width;
        const svp = page.getViewport({ scale });
        canvas.width = svp.width;
        canvas.height = svp.height;
        await page.render({
            canvasContext: canvas.getContext("2d"),
            viewport: svp
        }).promise;
        canvas.style.width = w + "px";
    }

    // --------------------
    // PREPROCESS SEARCH BLOBS
    // --------------------
  data.forEach(song => {
        song._searchBlob = {};

        for (const key in song) {
            song._searchBlob[key] = safeStr(song[key]).toLowerCase();
        }

        // 🔴 EXCLUDE "Game" FROM GLOBAL SEARCH
        song._searchBlob.all = Object.entries(song._searchBlob)
            .filter(([k]) => k !== "Game")
            .map(([, v]) => v)
            .join(" ");
    });

    // --------------------
    // DATATABLE
    // --------------------
    const table = $('#songs').DataTable({
        data,
        pageLength: 50,
        dom: 't<"bottom"ip>',
        order: [[0, "asc"]],
        columns: [{
            data: "Title",
            render: function (title, type, song) {
                title = safeStr(title);
                if (type === "sort") return stripArticle(title);
                if (type === "filter") return title;

                let thumb = "";
                if (song && song.PDFs) {
                    const id = "thumb-" + Math.random().toString(36).slice(2);
                    thumb = `
                        <div class="thumbnail-container" data-title="${title}">
                            <canvas id="${id}" class="thumbnail"></canvas>
                        </div>`;
                }

                return `
                    <div class="song-row">
                        ${thumb}
                        <div>
                            <span class="title-link" data-title="${title}">
                                ${title}
                            </span>
                            <div class="song-meta-preview"></div>
                        </div>
                    </div>`;
            }
        }],
        createdRow: function(row, song) {
            renderMetadataPreview(row, song);
        }
    });

    // --------------------
    // LAZY LOAD THUMBNAILS + METADATA
    // --------------------
    function lazyLoadVisibleRows() {
        table.rows({ page: 'current' }).every(function () {
            const row = this.node();
            const song = this.data();
            const canvas = row.querySelector('canvas');

            if (canvas && !canvas._loaded && song?.PDFs) {
                const pdf = "pdfs/" + (song.PDFs.split(',')[0] || "").trim();
                loadThumbnail(pdf, canvas, 400);
                canvas._loaded = true;
            }

            renderMetadataPreview(row, song);
        });
    }

    lazyLoadVisibleRows();
    table.on('draw', lazyLoadVisibleRows);

    // --------------------
    // METADATA PREVIEW
    // --------------------
    function getSelectedPreviewFields() {
        return $('.preview-meta:checked').map(function () {
            return this.value;
        }).get();
    }

    function renderMetadataPreview(row, song) {
        const container = row.querySelector('.song-meta-preview');
        if (!container) return;

        const fields = getSelectedPreviewFields();
        container.innerHTML = "";

        const canvas = row.querySelector("canvas");
        if (canvas) {
            canvas.style.display = fields.includes("Hide Thumbnails") ? "none" : "block";
        }

        fields.forEach(key => {
            if (key !== "Hide Thumbnails" && song[key]) {
                const div = document.createElement("div");
                div.textContent = `${key}: ${song[key]}`;
                container.appendChild(div);
            }
        });
    }

    $(document).on('change', '.preview-meta', lazyLoadVisibleRows);

    // --------------------
    // EXPORT STATE (GLOBAL)
    // --------------------
    window.saveFilteredStateForExport = function () {
        const filteredSongs = [];
        const activeFilters = [];

        table.rows().every(function () {
            if ($(this.node()).is(":visible")) {
                filteredSongs.push(this.data());
            }
        });

        const mainQuery = $('#search-box').val().trim();
        const mainField = $('#search-field').val() || "all";
        if (mainQuery) activeFilters.push({ field: mainField, query: mainQuery });

        $('#extra-filters .multi-filter').each(function () {
            const query = $(this).find('input').val().trim();
            const field = $(this).find('select').val();
            if (query) activeFilters.push({ field, query });
        });

        localStorage.setItem("FOLKEDEX_FILTERED_SONGS", JSON.stringify(filteredSongs));
        localStorage.setItem("FOLKEDEX_ACTIVE_FILTERS", JSON.stringify(activeFilters));
    };

    // --------------------
    // SEARCH LOGIC (FIXED)
    // --------------------
    function performSearch() {
        const filters = [];

        const mainQuery = $('#search-box').val().trim();
        const mainField = $('#search-field').val() || "all";
        if (mainQuery) filters.push({ field: mainField, query: mainQuery });

        $('#extra-filters .multi-filter').each(function () {
            const query = $(this).find('input').val().trim();
            const field = $(this).find('select').val();
            if (query) filters.push({ field, query });
        });

        window.ACTIVE_FILTERS = filters;

        // use DataTables ext.search
        $.fn.dataTable.ext.search = [];
        $.fn.dataTable.ext.search.push(function (settings, data, dataIndex) {
            const song = window.ALL_SONGS[dataIndex];
            if (!filters.length) return true;

            for (const f of filters) {
                if (f.field === "Full Rhythm" || f.field === "Hardest Rhythmic") {
                    const q = normalizeRhythm(f.query);
                    const s = normalizeRhythm(song[f.field]);
                    if (!s.some((_, i) => q.every((t, j) => t === s[i + j]))) return false;
                } else if (f.field === "Tone Set") {
                    if (
                        safeStr(song["Tone Set"]).toLowerCase().replace(/\s+/g, "") !==
                        f.query.toLowerCase().replace(/\s+/g, "")
                    ) return false;
                } else if (f.field === "Tonal Center" || f.field === "Hardest Melodic") {
                    const q = normalizeMelody(f.query);
                    const s = normalizeMelody(song[f.field]);
                    if (!s.some((_, i) => q.every((t, j) => t === s[i + j]))) return false;
                } else if (f.field === "all") {
                    if (!song._searchBlob.all.includes(f.query.toLowerCase())) return false;
                } else {
                    if (!(song._searchBlob[f.field] || "").includes(f.query.toLowerCase())) return false;
                }
            }
            return true;
        });

        table.draw(false);

        // dynamically adjust page length
        const filteredCount = table.rows({ filter: 'applied' }).count();
        if (filteredCount <= 50) table.page.len(filteredCount || 1);
        else table.page.len(50);
        table.page(0).draw(false);

        window.saveFilteredStateForExport?.();
        lazyLoadVisibleRows();
    }

    $('#search-box, #search-field').on('input change', performSearch);
    $('#extra-filters').on('input change', 'input, select', performSearch);

    $(document).on('click', '.title-link,.thumbnail-container', function () {
        const title = $(this).data('title');
        if (title) location.href = 'song.html?title=' + encodeURIComponent(title);
    });

    // --------------------
    // AUTOCOMPLETE DATA
    // --------------------
    const fieldValues = {};
    window.ALL_SONGS.forEach(song => {
        for (const k in song) {
            fieldValues[k] ??= new Set();
            const value = safeStr(song[k]);

// 🔴 Tone Set: keep entire string (commas are octave markers)
if (k === "Tone Set") {
    if (value) fieldValues[k].add(value.trim());
} else {
    value
        .split(",")
        .map(v => v.trim())
        .filter(Boolean)
        .forEach(v => fieldValues[k].add(v));
}
        }
    });
    Object.keys(fieldValues).forEach(k => {
        fieldValues[k] = Array.from(fieldValues[k]);
    });

    // --------------------
    // AUTOCOMPLETE ENGINE
    // --------------------
    function attachAutocomplete(input, select) {
    const box = document.createElement("div");
    Object.assign(box.style, {
        position: "absolute",
        background: "#fff",
        border: "1px solid #999",
        zIndex: 9999,
        maxHeight: "250px",
        overflowY: "auto",
        fontSize: "14px",
        display: "none"
    });
    document.body.appendChild(box);

    let index = -1;

    function update() {
        const field = select.value;
        const q = input.value.toLowerCase().trim();

        if (!q || AUTOCOMPLETE_DISABLED_FIELDS.has(field)) {
            box.style.display = "none";
            return;
        }

        let list = field === "all"
            ? window.ALL_SONGS.map(s => s.Title)
            : fieldValues[field] || [];

        // 🔹 Limit list length: 3 for Tone Set, 10 for others
        const maxItems = field === "Tone Set" ? 3 : 10;

       if (field === "Tone Set") {
    const normalize = str =>
        str
            .toLowerCase()
            .replace(/\u00a0/g, " ")   // normalize non-breaking spaces
            .replace(/\s+/g, "");     // remove ALL spaces but keep commas

    const qNorm = normalize(q);

    list = list
        .filter(v => normalize(v).includes(qNorm))
        .slice(0, maxItems);
} else {
    list = list
        .filter(v => v.toLowerCase().startsWith(q))
        .slice(0, maxItems);
}
        box.innerHTML = "";
        index = -1;

        if (!list.length) {
            box.style.display = "none";
            return;
        }

        list.forEach(v => {
            const d = document.createElement("div");
            d.textContent = v;
            d.style.padding = "4px 8px";
            d.style.cursor = "pointer";
            d.onclick = () => {
                if (field === "all") {
                    location.href = "song.html?title=" + encodeURIComponent(v);
                } else {
                    input.value = v;
                    box.style.display = "none";
                    input.dispatchEvent(new Event("input"));
                }
            };
            box.appendChild(d);
        });

        const r = input.getBoundingClientRect();
        box.style.left = r.left + "px";
        box.style.top = r.bottom + window.scrollY + "px";
        box.style.width = r.width + "px";
        box.style.display = "block";
    }

    input.addEventListener("input", update);

    input.addEventListener("keydown", e => {
        const items = box.children;
        if (!items.length) return;

        if (e.key === "ArrowDown") index = (index + 1) % items.length;
        else if (e.key === "ArrowUp") index = (index - 1 + items.length) % items.length;
        else if (e.key === "Enter" && index >= 0) items[index].click();

        [...items].forEach((el, i) => {
            el.style.background = i === index ? "#ddd" : "#fff";
        });
    });

    document.addEventListener("click", e => {
        if (e.target !== input && !box.contains(e.target)) {
            box.style.display = "none";
        }
    });

    input.addEventListener("blur", () => {
        setTimeout(() => { box.style.display = "none"; }, 150);
    });
}




    attachAutocomplete(
        document.getElementById("search-box"),
        document.getElementById("search-field")
    );

    const observer = new MutationObserver(() => {
        document.querySelectorAll('#extra-filters .multi-filter').forEach(mf => {
            if (!mf._auto) {
                attachAutocomplete(
                    mf.querySelector('input'),
                    mf.querySelector('select')
                );
                mf._auto = true;
            }
        });
    });

    observer.observe(
        document.getElementById("extra-filters"),
        { childList: true }
    );
};
