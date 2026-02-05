// Folkedex melody shorthand → canonical solfège (with octave)
window.MELODY_KEY = {
    "d": "do",
    "r": "re",
    "m": "mi",
    "f": "fa",
    "s": "so",
    "l": "la",
    "t": "ti",
    "d,": "do,",
    "r,": "re,",
    "m,": "mi,",
    "f,": "fa,",
    "s,": "so,",
    "l,": "la,",
    "t,": "ti,",
    "d'": "do'",
    "r'": "re'",
    "m'": "mi'",
    "f'": "fa'",
    "s'": "so'",
    "l'": "la'",
    "t'": "ti'"
};

// Normalize melody strings (metadata or user input)
window.normalizeMelody = function(str){
    if(!str) return [];

    str = String(str).toLowerCase().trim();

    // Tokenize by spaces
    let tokens = str.split(/\s+/).filter(Boolean);

    // Replace each token with canonical solfège if exists
    tokens = tokens.map(t => window.MELODY_KEY[t] || t);

    return tokens;
};
