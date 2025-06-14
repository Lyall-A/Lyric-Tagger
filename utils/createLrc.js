function createLrc(lyrics, metadata) {
    // return lyrics;
    return lyrics.split("\n").map(line => {
        const [timeMatch, minutes, seconds, centisecond] = line.match(/^\[(\d+):([\d]+)(?:\.(\d+))?\]/) || [];
        if (!timeMatch) return line;
        return line.replace(timeMatch, `[${minutes.padStart(2, "0")}:${seconds.padStart(2, "0")}.${centisecond?.padStart(2, "0") || "00"}]`);
    }).join("\n");
}

module.exports = createLrc;