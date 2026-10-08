# Repository boundary

Franklin is the developer service; Frankie is the user-facing application.

This repository was extracted on 8 October 2026 from SonghaiFan/frankie-tarot at commit 1fc90cd plus the reviewed, uncommitted API migration work. That repository retains the application history and existing plugin worktrees. The authoritative dataset was moved without changing its JSON contents, preserving dataset versions and saved reading compatibility.

Public consumer: https://github.com/SonghaiFan/frankie-tarot

No source imports or local path dependencies connect the repositories. The app uses REST for user-triggered draws and Agent MCP for plugin context. Core service deployment is independent of the docs build and contains no UI runtime dependencies.
