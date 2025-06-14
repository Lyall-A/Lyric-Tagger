const child_process = require("child_process");

const createLrc = require("./createLrc");

const config = require("../config.json");

function embedLyrics(file, lyrics) {
        return new Promise((resolve, reject) => {
        const kid3CliProcess = child_process.spawn(config.kid3CliPath, [
            "-c", `set LYRICS "${createLrc(lyrics)}"`,
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
    });
}

module.exports = embedLyrics;
