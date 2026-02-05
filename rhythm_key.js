// Folkedex rhythm shorthand → canonical form
window.RHYTHM_KEY = {
    "tt": "ti-ti",
    "t": "ta",
    "z": "rest",
    "to": "to-o",
    "too": "to-o-o",
    "tooo": "whole note",
    "scp": "syn-co-pa",
    "ti": "single ti",
    "tmt": "tam-ti",
    "tmk": "tim-ka",
    "ktm": "ka-tim",
    "tiz": "ti-rest",
    "tktk": "tika-tika",
    "tkt": "tika-ti",
    "ttk": "ti-tika",
    "ttm": "ti-tam",
    "ttt": "ti-ti-ti",
    "tum": "tum"
};

// Normalize rhythm strings (metadata or user input)
window.normalizeRhythm = function(str){
    if(!str) return [];

    str = String(str).toLowerCase().trim();

    // If exact shorthand exists, replace whole string
    if(window.RHYTHM_KEY[str]){
        str = window.RHYTHM_KEY[str];
    }

    // Tokenize
    let tokens = str
        .replace(/[-_]/g," ")   // tika-tika → tika tika
        .split(/\s+/)
        .filter(Boolean);

    // Expand any shorthand tokens inside longer strings
    tokens = tokens.map(t => window.RHYTHM_KEY[t] || t);

    // Final normalization (tika-tika → tika tika)
    return tokens
        .join(" ")
        .replace(/[-_]/g," ")
        .split(/\s+/)
        .filter(Boolean);
};
