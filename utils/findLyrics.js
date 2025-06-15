const config = require("../config.json");

function findLyrics(metadata, exactMatch = true) {
    return new Promise((resolve, reject) => {
        const tagsArray = Object.entries(metadata.tags);

        const title = tagsArray.find(([key, value]) => config.titleTags.includes(key.toLowerCase()))?.[1];
        const album = tagsArray.find(([key, value]) => config.albumTags.includes(key.toLowerCase()))?.[1];
        const artist = tagsArray.find(([key, value]) => config.artistTags.includes(key.toLowerCase()))?.[1];
        const duration = parseFloat(metadata.duration);

        if (!title) return reject("Track name not found in metadata");
        if (exactMatch && !album) return reject("Album name not found in metadata");
        if (exactMatch && !artist) return reject("Artist name not found in metadata");
        if (exactMatch && !duration) return reject("Duration not found in metadata");

        fetch(`https://lrclib.net/api/${exactMatch ? `get` : "search"}?track_name=${encodeURIComponent(title)}&album_name=${encodeURIComponent(album)}&artist_name=${encodeURIComponent(artist)}${exactMatch ? `&duration=${duration}` : ""}`, {
            headers: {
                "User-Agent": `Lyric-Tagger (https://github.com/Lyall-A/Lyric-Tagger)`
            }
        }).then(async res => {
            if (res.status !== 200) return reject(res.status === 404 ? "No lyrics for track found" : `Got status ${res.status}`);
            try {
                const resJson = await res.json();
                const lyrics = exactMatch ? resJson : resJson?.[0];

                if (!lyrics?.plainLyrics && !lyrics?.syncedLyrics) return reject("No lyrics for track found");

                resolve({
                    plain: lyrics.plainLyrics,
                    synced: lyrics.syncedLyrics
                });
            } catch (err) {
                reject(`Failed to parse API response: ${err}`);
            }
        }).catch(err => {
            reject(`Failed to get lyrics: ${err}`);
        });
    });
}

module.exports = findLyrics;