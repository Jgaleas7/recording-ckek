# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Vite dev server on `0.0.0.0:5173` (strict port)
- `npm run build` — production build
- `npm run preview` — preview the built bundle

No linter, test runner, or type checker is configured. `AGENTS.md` exists but is empty.

## Required env

`.env` must define:
- `VITE_SUPABASE_URL` (defaults to `http://127.0.0.1:8000` — self-hosted Supabase via `../docker-compose.yml`)
- `VITE_SUPABASE_ANON_KEY`

The backend REST API this client calls is hard-coded to `http://localhost:4002/api` in `src/api/recordApi.js` and `src/api/renameApi.js` — change both if the server moves. HTTPS and self-signed cert setups are commented-out alternatives in `vite.config.js` (the `.pem` files in the repo are for that path).

## Architecture

This is one piece of a three-part system: the React client (here), a Node server at `../server/` exposing `/api/recordings` and `/api/schedules` on port 4002, and a Supabase instance at `../supabase/`. The client never records video itself — it is a control panel that tells the server to start/stop recordings and reads status/history from Supabase.

### The two-capturer model

Everything is parameterized by a `capturer` string — one of `'capturer1'` or `'capturer2'` (see `src/const/index.js`). These correspond to two independent recording pipelines on the server. The UI switches which capturer is "selected" via `useRecordStore.capturer`; most actions (REC, STOP, schedule) send `capturer` in the POST body so the server knows which pipeline to act on. Timers in `RecordingControls.jsx` are duplicated per-capturer rather than keyed by the active one.

### State, realtime, and the `activeRecordRowId` split

- **Global app state** lives in Zustand (`src/store/recorderStore.js`): `records`, `filteredRecords`, `capturer`, `activeTabIndex`, `nameOfVideoToSave`. The store owns the two filter modes — `filterRecordsByCapturerAndDay` (Today tab) and `filterRecordsByCapturer` (Periodic tab).
- **Per-capturer "currently-recording row highlight"** is intentionally *not* in Zustand. `App.jsx` holds `activeRecordRowId = { capturer1, capturer2 }` in `useState`, mirrors it to `localStorage` under `activeRecordRows`, and passes it down. It is (re)hydrated from Supabase's `capturers.record_active_id` on mount and on every realtime `UPDATE` of the `capturers` table. When touching this, keep the three sources in sync: local state, `localStorage`, and the DB column.
- A single Supabase realtime channel (`table-capturers`) is subscribed in `App.jsx`. On any update, the handler refetches *both* rows from `capturers` rather than diffing the payload — this is deliberate; don't "optimize" it to trust `payload.new`.
- `useRefreshAtMidnight` schedules a single `setTimeout` to midnight, refetches all records, and reapplies the current capturer's day filter so the Today tab rolls over.

### Supabase schema assumptions

The client assumes two tables:
- `records` — selected via `select('*, capturers(name)')`, so there is an FK from `records` to `capturers`. Rows have `day` (English day name, see `utils/index.js` `days` map), `start_at`, `end_at`, `name`.
- `capturers` — rows keyed by `name` (`'capturer1' | 'capturer2'`) with columns `is_active`, `is_automatic`, `record_active_id`. `is_active || is_automatic` is the guard that prevents starting a new recording.

Day filtering uses the host's local `new Date().getDay()` mapped through the `days` object — records are stored with English weekday strings, *not* dates, so the same row reappears weekly.

### Server contract (consumed, not defined here)

- `POST /api/recordings/record` `{ capturer, nameOfVideo }` — start
- `POST /api/recordings/stop` `{ capturer, nameOfVideo }` — stop; client then opens `DialogToSaveRecord` to let the user rename the `Autorec-<timestamp>` placeholder
- `POST /api/schedules/stop` `{ capturerName }` — cancel an auto-scheduled recording (used by the header's STOP-automatic button)
- `POST /api/recordings/rename-video` (via `renameApi`)

### UI conventions

- MUI v5 with a custom dark theme in `src/theme/index.js`; wrapped by `LocalizationProvider` (`dayjs`, `es-mx` locale) in `main.jsx`.
- User-facing strings and most comments are in Spanish; component/variable names are English. Preserve this split when editing.
- Toasts go through the `Toast` helper in `src/utils/Toast.js` — use it rather than calling `react-toastify` directly.
