const fs = require("fs");
const path = require("path");
const child_process = require("child_process");

const config = require("../config.json");

function embedLyrics(file, lyrics) {
    return new Promise((resolve, reject) => {
        const sanatizedLyrics = lyrics.replace(/"/g, i => `\\${i}`);

        if (config.method === "kid3") {
            const kid3CliProcess = child_process.spawn(config.kid3CliPath, [
                "-c", `set "${config.lyricsTags[0]}" "${sanatizedLyrics}"`,
                file
            ]);

            const verboseOutputArray = [];

            kid3CliProcess.stdout.on("data", chunk => verboseOutputArray.push(chunk));

            kid3CliProcess.on("exit", code => {
                const verboseOutput = Buffer.concat(verboseOutputArray).toString();
                if (code) return reject(`kid3-cli returned code ${code}: ${verboseOutput}`);
                resolve();
            });

            kid3CliProcess.on("error", err => {
                reject(`Failed to spawn kid3-cli: ${err}`);
            });
        } else {
            const tempOutput = `${path.join(path.dirname(file), `${path.basename(file, path.extname(file))}.tmp${path.extname(file)}`)}`;

            const ffmpegProcess = child_process.spawn(config.ffmpegPath, [
                "-i", file,
                "-metadata", `${config.lyricsTags[0]}:=${sanatizedLyrics}`, // A semi-colon at the end stop's FFmpeg from replacing "lyrics" to the format's standard
                "-codec", "copy",
                "-y",
                tempOutput
            ]);

            const verboseOutputArray = [];

            ffmpegProcess.stderr.on("data", chunk => verboseOutputArray.push(chunk));

            ffmpegProcess.on("exit", code => {
                const verboseOutput = Buffer.concat(verboseOutputArray).toString();
                if (code) return reject(`FFmpeg returned code ${code}: ${verboseOutput}`);
                if (tempOutput) {
                    fs.rmSync(file);
                    fs.renameSync(tempOutput, file);
                }
                resolve();
            });

            ffmpegProcess.on("error", err => {
                reject(`Failed to spawn FFmpeg: ${err}`);
            });
        }
    });
}

module.exports = embedLyrics;
