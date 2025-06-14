const child_process = require("child_process");

const config = require("../config.json");

function getMetadata(file) {
    return new Promise((resolve, reject) => {
        const ffprobeProcess = child_process.spawn(config.ffprobePath, [
            file,
            "-print_format", "json",
            "-show_format"
        ]);

        const verboseOutputArray = [];
        const outputArray = [];

        ffprobeProcess.stderr.on("data", chunk => verboseOutputArray.push(chunk));
        ffprobeProcess.stdout.on("data", chunk => outputArray.push(chunk));

        ffprobeProcess.on("exit", code => {
            const output = Buffer.concat(outputArray).toString();
            const verboseOutput = Buffer.concat(verboseOutputArray).toString();
            if (code) return reject(`FFprobe returned code ${code}: ${verboseOutput}`);
            try {
                const outputJson = JSON.parse(output);
                resolve(outputJson.format);
            } catch (err) {
                reject(`Failed to parse FFprobe output: ${err}`);
            }
        });

        ffprobeProcess.on("error", err => {
            reject(`Failed to spawn FFprobe: ${err}`);
        });
    });
}

module.exports = getMetadata;