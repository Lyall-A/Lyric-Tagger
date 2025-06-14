# Lyrics-Tagger
Lyric tagger made for [Navidrome](https://www.navidrome.org)

It gets lyrics using [LRCLIB](https://lrclib.net) and applies it as a .lrc file or by embedding it into the track itself

This doesn't really embed the lyrics properly (as in uses the correct tag depending on the file format), it just hopes that whatever attempts to read lyrics from a track sees it, which Navidrome does