/* Badge abbreviations, colors, and rendering for Folkedex song cards. */
(function () {
    "use strict";

    // Supported badge fields and developer-customizable colors live here.
    // Badge text is the compact metadata value; the full value appears on hover.
    const BADGES = [
        { field: "Grade Level", abbr: "GL", color: "#f2c14e", valueMap: {} },
        { field: "Type", abbr: "T", color: "#ee8a72", valueMap: {
            "call and response": "C&R",
            "call-and-response": "C&R",
            "movement": "MVT",
            "folksong": "Folk"
        } },
        { field: "Origin", abbr: "OR", color: "#8ecae6", valueMap: {} },
        { field: "Hardest Melodic", abbr: "HM", color: "#b8c0ff", valueMap: {} },
        { field: "Hardest Rhythmic", abbr: "HR", color: "#ffadad", valueMap: {
            "ti-ti": "tt",
            "ta": "t",
            "rest": "z",
            "to-o": "to",
            "to-o-o": "too",
            "to-o-o-o": "tooo",
            "syn-co-pa": "scp",
            "single ti": "ti",
            "tam-ti": "tmt",
            "tim-ka": "tmk",
            "ka-tim": "ktm",
            "ti-rest": "tiz",
            "tika-tika": "tktk",
            "tika-ti": "tkt",
            "ti-tika": "ttk",
            "ti-tam": "ttm",
            "ti-ti-ti": "ttt",
            "tum": "tum",
            "tika-ka": "tkk"
        } }
    ];

    // Map country names and common song-origin demonyms to ISO-style alpha-3 badges.
    const ORIGIN_COUNTRIES = [
        ["USA", ["united states of america", "united states", "u s a", "usa", "american"]],
        ["GBR", ["united kingdom", "great britain", "british", "english", "england", "scottish", "scotland", "welsh", "wales"]],
        ["IRL", ["ireland", "irish"]],
        ["MEX", ["mexico", "mexican"]],
        ["ESP", ["spain", "spanish"]],
        ["ISR", ["israel", "israeli"]],
        ["DEU", ["germany", "german"]],
        ["FRA", ["france", "french"]],
        ["ARM", ["armenia", "armenian"]],
        ["ITA", ["italy", "italian"]],
        ["KOR", ["south korea", "north korea", "korea", "korean"]],
        ["JPN", ["japan", "japanese"]],
        ["CHN", ["china", "chinese"]],
        ["BRA", ["brazil", "brazilian"]],
        ["GHA", ["ghana", "ghanaian"]],
        ["COD", ["democratic republic of the congo", "dr congo", "congo kinshasa"]],
        ["NGA", ["nigeria", "nigerian"]],
        ["ZAF", ["south africa", "south african"]],
        ["SWE", ["sweden", "swedish"]],
        ["FIN", ["finland", "finnish"]],
        ["NOR", ["norway", "norwegian"]],
        ["DNK", ["denmark", "danish"]],
        ["NLD", ["netherlands", "dutch"]],
        ["CAN", ["canada", "canadian"]],
        ["AUS", ["australia", "australian"]],
        ["NZL", ["new zealand", "new zealander"]],
        ["ARG", ["argentina", "argentinian", "argentine"]],
        ["CHL", ["chile", "chilean"]],
        ["PER", ["peru", "peruvian"]],
        ["COL", ["colombia", "colombian"]],
        ["CUB", ["cuba", "cuban"]],
        ["JAM", ["jamaica", "jamaican"]],
        ["RUS", ["russia", "russian"]],
        ["UKR", ["ukraine", "ukrainian"]],
        ["POL", ["poland", "polish"]],
        ["CZE", ["czech republic", "czechia", "czech"]],
        ["HUN", ["hungary", "hungarian"]],
        ["GRC", ["greece", "greek"]],
        ["TUR", ["turkey", "turkish", "turkiye"]],
        ["IRN", ["iran", "iranian", "persian"]],
        ["LBR", ["liberia", "liberian"]],
        ["IND", ["india", "indian"]],
        ["PAK", ["pakistan", "pakistani"]],
        ["IDN", ["indonesia", "indonesian"]],
        ["PHL", ["philippines", "filipino"]],
        ["THA", ["thailand", "thai"]],
        ["VNM", ["vietnam", "vietnamese"]],
        ["MAR", ["morocco", "moroccan"]],
        ["NIC", ["nicaragua", "nicaraguan"]],
        ["TWN", ["taiwan", "taiwanese"]],
        ["MNG", ["mongolia", "mongolian"]],
        ["ETH", ["ethiopia", "ethiopian"]],
        ["SEN", ["senegal", "senegalese"]],
        ["SLE", ["sierra leone", "sierra leonean"]],
        ["KEN", ["kenya", "kenyan"]],
        ["TZA", ["tanzania", "tanzanian"]],
        ["UGA", ["uganda", "ugandan"]],
        ["ZWE", ["zimbabwe", "zimbabwean"]]
    ];

    // Abbreviations for listed origins that are regions, U.S. states,
    // Indigenous/cultural origins, or source traditions rather than countries.
    const ORIGIN_LABELS = {
        "african american": "AA",
        "appalachia": "APP",
        "bible": "BIB",
        "caribbean": "CAR",
        "connecticut": "CT",
        "georgia sea islands": "GSI",
        "hopi tribe": "HOPI",
        "kentucky": "KY",
        "latin america": "LATAM",
        "louisiana": "LA",
        "mississippi": "MS",
        "missouri": "MO",
        "native american": "NA",
        "navajo": "NAV",
        "new mexico": "NM",
        "orff": "ORFF",
        "puerto rico": "PRI",
        "samish tribe": "SAM",
        "unknown": "UNK",
        "usa": "USA",
        "west indies": "WI"
    };

    function addStyles() {
        const style = document.createElement("style");
        style.textContent = `
            .song-row .song-badges {
                position: absolute;
                top: 8px;
                right: 8px;
                z-index: 6;
                display: flex;
                flex-wrap: wrap;
                justify-content: flex-end;
                gap: 4px;
                max-width: calc(100% - 16px);
                pointer-events: none;
            }
            .song-row .song-badge {
                box-sizing: border-box;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                flex: 0 0 36px;
                width: 36px;
                height: 36px;
                padding: 2px;
                border: 1px solid rgba(91, 67, 34, .52);
                border-radius: 50%;
                color: #342b1d;
                box-shadow: inset 0 1px 2px rgba(255, 255, 255, .8), 0 1px 2px rgba(70, 50, 25, .18);
                font: 700 10px/1 Arial, sans-serif;
                text-align: center;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                pointer-events: auto;
                cursor: help;
            }
            .song-badge-tooltip {
                position: fixed;
                z-index: 10000;
                max-width: min(320px, calc(100vw - 24px));
                padding: 7px 10px;
                border: 1px solid #8a6b3f;
                border-radius: 6px;
                background: #fffdf3;
                color: #342b1d;
                box-shadow: 0 3px 12px rgba(45, 34, 18, .24);
                font: 13px/1.4 Arial, sans-serif;
                overflow-wrap: anywhere;
                pointer-events: none;
            }
            .song-badge-tooltip[hidden] { display: none; }
            .song-row.has-badges .song-card-title {
                justify-content: flex-start;
                padding-right: 46px;
                text-align: left;
            }
            #songs .song-card-title .title-link.long-song-title {
                font-size: calc(clamp(17px, 1.5vw, 22px) - 2px);
            }
            #songs .song-card-title .title-link.extra-long-song-title {
                font-size: calc(clamp(17px, 1.5vw, 22px) - 4px);
            }
            #songs .song-card-title .title-link.ultra-long-song-title {
                font-size: calc(clamp(17px, 1.5vw, 22px) - 6px);
            }
            #songs.list-view .song-card-title .title-link.long-song-title {
                font-size: 22px;
            }
            #songs.list-view .song-card-title .title-link.extra-long-song-title {
                font-size: 20px;
            }
            #songs.list-view .song-card-title .title-link.ultra-long-song-title {
                font-size: 18px;
            }
            .song-row.has-badges .song-card-title .title-link.long-song-title,
            .song-row.has-badges .song-card-title .title-link.extra-long-song-title,
            .song-row.has-badges .song-card-title .title-link.ultra-long-song-title {
                position: relative;
                z-index: 7;
                white-space: nowrap;
            }
            @media (max-width: 520px) {
                .song-row .song-badge { flex-basis: 32px; width: 32px; height: 32px; }
            }
        `;
        document.head.appendChild(style);
    }

    let badgeTooltip;
    function getBadgeTooltip() {
        if (!badgeTooltip) {
            badgeTooltip = document.createElement("div");
            badgeTooltip.className = "song-badge-tooltip";
            badgeTooltip.id = "song-badge-tooltip";
            badgeTooltip.hidden = true;
            badgeTooltip.setAttribute("role", "tooltip");
            document.body.appendChild(badgeTooltip);
        }
        return badgeTooltip;
    }

    function attachBadgeTooltip(badge, text) {
        let timer;
        badge.removeAttribute("title");
        badge.addEventListener("mouseenter", function () {
            clearTimeout(timer);
            timer = setTimeout(function () {
                const tooltip = getBadgeTooltip();
                tooltip.textContent = text;
                tooltip.hidden = false;
                const rect = badge.getBoundingClientRect();
                const tipRect = tooltip.getBoundingClientRect();
                const left = Math.max(12, Math.min(rect.left + rect.width / 2 - tipRect.width / 2, window.innerWidth - tipRect.width - 12));
                let top = rect.bottom + 8;
                if (top + tipRect.height > window.innerHeight - 8) top = rect.top - tipRect.height - 8;
                tooltip.style.left = left + "px";
                tooltip.style.top = Math.max(8, top) + "px";
            }, 1000);
        });
        badge.addEventListener("mouseleave", function () {
            clearTimeout(timer);
            if (badgeTooltip) badgeTooltip.hidden = true;
        });
    }

    function compactValue(badge, rawValue) {
        const value = String(rawValue).trim();
        if (badge.field === "Type") {
            const firstType = value.split(",")[0].trim();
            const mappedType = badge.valueMap[firstType.toLowerCase()];
            if (mappedType) return mappedType;
            if (firstType.length <= 5) return firstType;
            const typeWords = firstType.match(/[A-Za-z0-9#]+/g) || [];
            if (typeWords.length > 1) return typeWords.slice(0, 4).map(word => word[0]).join("").toUpperCase();
            return firstType.slice(0, 4).toUpperCase();
        }
        if (badge.field === "Grade Level") {
            const grades = Array.from(new Set((value.match(/\bK\b|\b\d+\b/gi) || []).map(function (grade) {
                return grade.toUpperCase();
            }))).sort(function (a, b) {
                const rank = grade => grade === "K" ? 0 : Number(grade);
                return rank(a) - rank(b);
            });

            if (grades.length) {
                const groups = [];
                let start = grades[0];
                let previous = grades[0];
                const rank = grade => grade === "K" ? 0 : Number(grade);

                grades.slice(1).forEach(function (grade) {
                    if (rank(grade) === rank(previous) + 1) {
                        previous = grade;
                        return;
                    }
                    groups.push(start === previous ? start : start + "-" + previous);
                    start = previous = grade;
                });
                groups.push(start === previous ? start : start + "-" + previous);
                return groups.join(", ");
            }
        }
        if (badge.field === "Origin") {
            const normalized = value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
            if (ORIGIN_LABELS[normalized]) return ORIGIN_LABELS[normalized];
            const country = ORIGIN_COUNTRIES.find(function ([, aliases]) {
                return aliases.some(alias => normalized.includes(alias));
            });
            if (country) return country[0];
            if (/^[A-Z]{2,3}$/i.test(value)) return value.toUpperCase();
            return value.replace(/[^a-z]/gi, "").slice(0, 3).toUpperCase() || "UNK";
        }
        const mapped = badge.valueMap[value.toLowerCase()];
        if (mapped) return mapped;
        if (value.length <= 5) return value;

        // Preserve compact music notation; shorten longer prose to initials.
        if (/^[A-Za-z0-9#b/+-]+$/.test(value)) return value.slice(0, 5);
        const words = value.match(/[A-Za-z0-9#]+/g) || [];
        if (words.length > 1) return words.slice(0, 4).map(word => word[0]).join("").toUpperCase();
        return value.slice(0, 4).toUpperCase();
    }

    function findSongForCard(card) {
        const titleElement = card.querySelector(".song-card-title .title-link, .title-link");
        if (!titleElement || !Array.isArray(window.ALL_SONGS)) return null;
        const title = (titleElement.dataset.title || titleElement.textContent || "").trim();
        return window.ALL_SONGS.find(song => String(song.Title || "").trim() === title) || null;
    }

    function renderCard(card, enabled) {
        const song = enabled ? findSongForCard(card) : null;
        const values = song ? BADGES.map(function (definition) {
            const raw = song[definition.field];
            if (raw == null || String(raw).trim() === "") return null;
            return {
                definition,
                text: compactValue(definition, raw),
                fullValue: String(raw).trim()
            };
        }).filter(Boolean) : [];

        const signature = JSON.stringify(values.map(item => [item.definition.field, item.text, item.fullValue, item.definition.color]));
        const existing = card.querySelector(":scope > .song-badges");
        card.classList.toggle("has-badges", values.length > 0);

        if (!values.length) {
            if (existing) existing.remove();
            return;
        }
        if (existing && existing.dataset.signature === signature) return;

        const badgeBar = existing || document.createElement("div");
        badgeBar.className = "song-badges";
        badgeBar.setAttribute("aria-label", "Song metadata badges");
        badgeBar.dataset.signature = signature;
        badgeBar.replaceChildren();

        values.forEach(function (item) {
            const badge = document.createElement("span");
            badge.className = "song-badge";
            badge.textContent = item.text;
            badge.style.backgroundColor = item.definition.color;
            const tooltipText = item.definition.field + ": " + item.fullValue;
            badge.setAttribute("aria-label", tooltipText);
            badge.setAttribute("aria-describedby", "song-badge-tooltip");
            attachBadgeTooltip(badge, tooltipText);
            badge.dataset.fieldAbbreviation = item.definition.abbr;
            badgeBar.appendChild(badge);
        });

        if (!existing) card.appendChild(badgeBar);
    }

    function init() {
        const toggle = document.querySelector('.preview-meta[value="Badges"]');
        const table = document.getElementById("songs");
        if (!toggle || !table) return;

        addStyles();
        const renderAllCards = function () {
            document.querySelectorAll("#songs tbody .song-row").forEach(function (card) {
                renderCard(card, toggle.checked);
                const title = card.querySelector(".song-card-title .title-link, .title-link");
                if (title) {
                    const titleText = (title.dataset.title || title.textContent || "").trim();
                    const titleLength = titleText.length;
                    title.classList.toggle("long-song-title", titleLength >= 22 && titleLength <= 25);
                    title.classList.toggle("extra-long-song-title", titleLength >= 26 && titleLength <= 28);
                    title.classList.toggle("ultra-long-song-title", titleLength >= 29);
                }
            });
        };

        toggle.addEventListener("change", renderAllCards);
        renderAllCards();
        // DataTables creates/replaces tbody after initialization, so observe the
        // stable table element instead of relying on tbody existing at startup.
        new MutationObserver(renderAllCards).observe(table, { childList: true, subtree: true });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})();
