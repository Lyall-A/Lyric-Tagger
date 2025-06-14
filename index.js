const fs = require("fs");
const path = require("path");

const createLrc = require("./utils/createLrc");
// const embedLyrics = require("./utils/embedLyrics");
const getMetadata = require("./utils/getMetadata");
const addMetadata = require("./utils/addMetadata");
const hasLyrics = require("./utils/hasLyrics");
const findLyrics = require("./utils/findLyrics");

const config = require("./config.json");

let directories;

updateDirectories();
fs.watch(config.directoriesPath, (event, filename) => {
    if (event === "change") updateDirectories();
});

function updateDirectories() {
    console.log("Updating directories");

    if (directories) for (const directory of directories) {
        // Close watcher
        if (directory.watcher) directory.watcher.close();
        // Clear scan timeout
        if (directory.scanTimeout) clearTimeout(directory.scanTimeout);
    }

    // Load directories
    directories = JSON.parse(fs.readFileSync(config.directoriesPath, "utf-8"));

    for (const directory of directories) {
        // directory.recentlyChecked = [];

        // Add watcher
        if (directory.watch) directory.watcher = fs.watch(directory.path, { recursive: true }, async (event, filename) => {
            console.log("DO NOT USE WATCH AT THE MOMENT");
            if (event === "rename") {
                // TODO: make sure file is not currently being written to
                const fullPath = path.resolve(directory.path, filename);
                const depth = filename.split(path.sep).length;
                if (directory.maxDepth && depth > directory.maxDepth) return;
                if (!fs.existsSync(fullPath)) return;
                
                if (directory.formats && !directory.formats.includes(path.extname(fullPath))) return;
                if (await hasLyrics(fullPath).catch(err => true)) return;
                console.log(`Attempting to add lyrics to '${path.basename(fullPath)}'`);
                await addLyrics(fullPath, directory).catch(err => {
                    console.log(`Failed to add lyrics to '${path.relative(directory.path, fullPath)}': ${err}`);
                });
            }
        });

        // Add scan interval
        if (directory.scanOnStart) scanDirectory(directory);
        if (directory.scanInterval) {
            directory.intervalCallback = () => scanDirectory(directory).then(() => setTimeout(intervalCallback, directory.scanInterval));
            directory.scanTimeout = setTimeout(directory.intervalCallback, directory.scanInterval);
        }
    }
}

async function scanDirectory(directory) {
    console.log(`Scanning directory '${directory.path}'`);

    let depth = 0;
    await (async function readDirectory(directoryPath) {
        const files = fs.readdirSync(directoryPath);
        depth++;

        for (const file of files) {
            const fullPath = path.join(directoryPath, file);
            if (fs.statSync(fullPath).isDirectory()) {
                if (!directory.maxDepth || directory.maxDepth > depth) await readDirectory(fullPath);
            } else {
                if (directory.formats && !directory.formats.includes(path.extname(fullPath))) continue;
                if (await hasLyrics(fullPath).catch(err => true)) continue;
                console.log(`Attempting to add lyrics to '${path.basename(fullPath)}'`);
                await addLyrics(fullPath, directory).catch(err => {
                    console.log(`Failed to add lyrics to '${path.relative(directory.path, fullPath)}': ${err}`);
                });
            }
        }
    })(directory.path);

    console.log(`Finished scanning directory '${directory.path}'`);
}

async function addLyrics(file, directory) {
    const metadata = await getMetadata(file);

    let lrcLyrics = null;
    await findLyrics(metadata, true).then(exactLyrics => {
        if (!exactLyrics.syncedLyrics && directory.requireSyncedLyrics) throw new Error("Synced lyrics not available");
        lrcLyrics = createLrc(exactLyrics.syncedLyrics || exactLyrics.unsyncedLyrics);
    }).catch(async err => {
        if (directory.exactMatchOnly) throw new Error(err);
        await findLyrics(metadata, false).then(foundLyrics => {
            if (!foundLyrics.syncedLyrics && directory.requireSyncedLyrics) throw new Error("Synced lyrics not available");
            lrcLyrics = createLrc(foundLyrics.syncedLyrics || foundLyrics.unsyncedLyrics);
        }).catch(err => {
            throw new Error(err);
        });
    });

    if (!directory.types) throw new Error("No types set to add lyrics");
    if (directory.types.includes("embedded")) {
        await addMetadata(file, { [config.lyricsTags[0]]: lrcLyrics }); // in config.json, 'lyrics:' is used because FFmpeg will change 'lyrics' to what it sees fit for that specific format
        // embedLyrics(file, lyrics.syncedLyrics);
    }
    if (directory.types.includes("lrc")) {
        fs.writeFileSync(`${file.slice(0, -path.extname(file).length)}.lrc`, lrcLyrics);
    }
}