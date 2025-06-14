const fs = require("fs");
const path = require("path");

const getMetadata = require("./getMetadata");

const config = require("../config.json");

function hasLyrics(file) {
    return new Promise(async (resolve, reject) => {
        // Has .lrc file?
        if (fs.existsSync(`${path.basename(file, path.extname(file))}.lrc`)) return resolve(true);

        // Has embedded lyrics?
        await getMetadata(file).then(metadata => {
            const lyricsTag = Object.entries(metadata.tags).find(([key, value]) => config.lyricsTags.includes(key.toLowerCase()))?.[1];
            if (lyricsTag) return resolve(true);
        });

        // Nope
        resolve(false);
    });
}

module.exports = hasLyrics;