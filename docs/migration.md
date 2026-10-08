# Project boundaries

`frankie-tarot` owns the user interface at `https://tarot.songhai.site`. `franklin-tarot-api` owns data, deterministic draws, reading context, developer docs and CLI at `https://tarot-api.songhai.site`.

This is a greenfield API: no legacy prediction routes, numeric card-ID aliases, historical response envelopes, or old hostname redirects. The browser keeps its current reading snapshot. Dataset and algorithm version checks prevent silently changing a reading; they are correctness checks, not support for old versions.

The source dataset was extracted from the app repository. Card-data content remains unchanged by deployment cleanup.
