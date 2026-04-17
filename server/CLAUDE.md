# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Runtime / Commands

- ESM Node (`"type": "module"`). Entry is `index.js`; it starts Express on `PORT` (defaults to `4002` in code, though `.env.example` lists `3000` — the rename pipeline hardcodes `http://localhost:4002`, so run on **4002** unless you also change `schedule-controller.js`).
- The `package.json` `start` script is broken (`"index.js"` with no runner). Use one of:
  - `node index.js`
  - `npx nodemon index.js` (nodemon is a dep but no script wires it up)
- No test, lint, or build tooling is configured.
- Requires `ffmpeg.exe` at the hardcoded path `C:/ffmpeg/ffmpeg.exe` and writes recordings to `C:\recordings\` — both paths are baked into `utils/args.js`, `utils/processHandler.js`, and `controllers/records-controller.js`. Changing the location means editing all three.
- Needs a running Supabase stack. The parent directory (`../supabase`) contains the self-hosted `docker-compose.yml`; `.env` points `DB_HOST`/`SUPABASE_URL` at `http://127.0.0.1:8000` (the Kong gateway). Bring Supabase up before starting this server.

## Architecture

Node/Express service that wraps ffmpeg to record two Blackmagic DeckLink Duo inputs ("capturer1" → DeckLink 1, "capturer2" → DeckLink 2), persists state in Supabase, and runs cron-based scheduled recordings.

Request flow: `index.js` → `router/api/index.js` → `router/api/{record,schedule}/index.js` → controller. Only two route groups exist:
- `/api/recordings` — `POST /record`, `POST /stop`, `POST /rename-video` (manual control, handled by `controllers/records-controller.js`).
- `/api/schedules` — `GET /`, `POST /stop`, `POST /create`, `POST /update`, `POST /delete` (cron registry, handled by `controllers/schedule-controller.js`).

Key cross-cutting pieces:
- **`utils/processHandler.js`** — singleton `runningProcessesSpawn` map keyed by capturer name; `startProcess` / `stopProcess` spawn/kill the ffmpeg child via `cross-spawn` with `detached: true`. Only one ffmpeg per capturer at a time; `is_automatic: true` forces a stop-before-start.
- **`utils/args.js`** — builds the ffmpeg argv for MXF/MPEG-2 422p 35 Mbit interlaced output. Two shapes: one-shot (`chunkTimeInSeconds` null) and `-f segment` chunked. Output filename pattern: `${currentDate()}_${Date.now()}_${nameOfVideo}.mxf`.
- **`controllers/schedule-controller.js`** — in-memory `taskRegistry` (`Map<taskId, CronJob[]>`) built from the Supabase `records` table joined to `capturers`. `GET /api/schedules` rebuilds the whole registry from scratch; create/update/delete mutate one task via `scheduleTask` / `unregisterTask`. When `records.chunk_time > 0`, each task becomes N start/end cron pairs via `calculateChunks` (segments the window into `chunk_time`-minute slices). All cron patterns are fired in timezone **`America/Vancouver`** (hardcoded in `TIMEZONE`) — note winston logs use `America/Tegucigalpa`; these are intentionally different.
- **`db.js`** — single shared Supabase client built from `DB_HOST` + `SUPABASE_ANON_KEY`. Expected tables:
  - `capturers` — `name`, `is_active`, `is_automatic`, `record_active_id` (FK to `records.id`).
  - `records` — scheduled task rows with `day` (weekday name: Sunday..Saturday), `start_at`, `end_at` (HH:mm:ss), `chunk_time` (minutes, 0 = single clip), `name`, plus a relation to `capturers`.
- **`utils/winston.js`** — rotating file logger (`logs/recordtvc-%DATE%.log`, 14d retention) plus console. Import `logger` from here for anything that should land in the log files.
- **`utils/taskManager.js`** is a dead/legacy alternative to the schedule registry; `schedule-controller.js` re-implements registration inline. Prefer the controller's registry.

## Scheduled-recording quirks worth knowing

- `controlCapture('start', ...)` always calls `stopProcess` first with a 1s + 3s delay before respawning ffmpeg. This is deliberate — Windows holds the MXF file handle briefly after kill.
- `renameFile` in `schedule-controller.js` posts back to **its own HTTP API** (`http://localhost:4002/api/recordings/rename-video`) after a 3s flush wait, rather than calling the rename function directly. Keep this behavior if refactoring: the sleep-then-rename sidesteps Windows file locks.
- `renameVideo` in `records-controller.js` tolerates missing exact filenames by scanning `C:\recordings` for a suffix match on the original name, then prefixes `currentDate()_` to the new name if missing.
- `startSchedules` stops and rebuilds every job on each call — it is safe to hit repeatedly, but it will drop in-flight schedules mid-execution.
- Capturer → decklink mapping (`capturer1` → `1`, `capturer2` → `2`) is hardcoded in both controllers; extending to more inputs requires changes in both places plus `const/index.js`.

## Repo layout notes

- `controllers/` contains several stale backup variants (`schedule-controller copy.js`, `schedule-controller ok.js`, `schedule-controller-funciona-bien-creo.js`, `New folder/`). Only `records-controller.js` and `schedule-controller.js` are wired into the router — leave the others unless asked to clean them up.
- `AGENTS.md` and `README.md` are effectively empty / Spanish feature notes; do not treat them as specs.
- `.env` and `node_modules` are gitignored; `.env.example` shows the required keys (`PORT`, `SUPABASE_ANON_KEY`, `SUPABASE_URL`, `DB_HOST`, `PATH_TO_SAVE_VIDEO`). `PATH_TO_SAVE_VIDEO` is referenced in commented-out code only — the live code hardcodes `C:\recordings`.
- Sibling directories (`../client`, `../supabase`, `../docker-compose.yml`) are part of the larger product but are not this server's working tree.
