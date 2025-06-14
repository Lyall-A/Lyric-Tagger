const fs = require("fs");
const path = require("path");
const child_process = require("child_process");

const config = require("../config.json");

function addMetadata(input, metadata, output) {
    return new Promise((resolve, reject) => {
        const metadataArgs = [];
        for (const [key, value] of Object.entries(metadata)) metadataArgs.push("-metadata", `${key}=${value}`);
        const tempOutput = (!output || output === input) ? `${path.join(path.dirname(input), `${path.basename(input, path.extname(input))}.tmp${path.extname(input)}`)}` : null;

        const ffmpegProcess = child_process.spawn(config.ffmpegPath, [
            "-i", input,
            ...metadataArgs,
            "-codec", "copy",
            "-y",
            tempOutput || output
        ]);

        const verboseOutputArray = [];

        ffmpegProcess.stderr.on("data", chunk => verboseOutputArray.push(chunk));

        ffmpegProcess.on("exit", code => {
            const verboseOutput = Buffer.concat(verboseOutputArray).toString();
            if (code) return reject(`FFmpeg returned code ${code}: ${verboseOutput}`);
            if (tempOutput) {
                fs.rmSync(input);
                fs.renameSync(tempOutput, input);
            }
            resolve();
        });

        ffmpegProcess.on("error", err => {
            reject(`Failed to spawn FFmpeg: ${err}`);
        });
    });
}

module.exports = addMetadata;