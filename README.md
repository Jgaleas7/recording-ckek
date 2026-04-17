# Chek Recorder

Control panel and backend for managing two parallel video-recording pipelines
("capturer1" and "capturer2"), with schedule/periodic recording and a realtime
dashboard.

The system has three moving parts:

| Part       | Path         | What it does                                                     |
| ---------- | ------------ | ---------------------------------------------------------------- |
| **DB**     | `supabase/`  | Postgres + Supabase (auth, REST, realtime) running locally       |
| **Server** | `server/`    | Node/Express API on port `4002`; spawns the actual recorders     |
| **Client** | `client/`    | React + Vite UI on port `5173`; talks to Server and Supabase     |

---

## Prerequisites

- **Node.js** ≥ 18 and **npm**
- **Docker Desktop** (required by the Supabase CLI)
- **Supabase CLI** — https://supabase.com/docs/guides/local-development/cli/getting-started
- **Git**

---

## 1. DB — Supabase (local)

From the repo root:

```bash
supabase start
```

This boots the full local stack and applies `supabase/migrations/` + `supabase/seed.sql`
(which inserts the two required `capturers` rows).

When it finishes, it prints a block like:

```
         API URL: http://127.0.0.1:54321
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
        anon key: eyJhbGciOi...
service_role key: eyJhbGciOi...
```

**Copy `API URL` and `anon key` — you need them for the client and server `.env`.**

Useful commands:

```bash
supabase status              # print URLs/keys again
supabase db reset            # wipe DB, re-run migrations + seed
supabase stop                # stop all containers
```

> There is also a `docker-compose.yml` at the repo root — that is the self-hosted
> Supabase stack (Kong on port `8000`) and is an **alternative** to the CLI.
> Pick one; the rest of this README assumes the CLI (`54321`).

---

## 2. Server

```bash
cd server
cp .env.example .env
npm install
```

Edit `server/.env`:

```
PORT=4002
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=<anon key from `supabase start`>
DB_HOST=http://127.0.0.1:54321
PATH_TO_SAVE_VIDEO=C:/path/where/recordings/go
```

> `PORT` must be `4002` — the client hardcodes this in
> `client/src/api/recordApi.js` and `renameApi.js`. Change both places if you
> move it.
>
> `PATH_TO_SAVE_VIDEO` must be an absolute path on disk where the server can
> write video files.

Run it:

```bash
node index.js
# or, for auto-reload during development:
npx nodemon index.js
```

You should see `Listening on port 4002`.

---

## 3. Client

```bash
cd client
cp .env.example .env
npm install
```

Edit `client/.env`:

```
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<same anon key>
```

Run it:

```bash
npm run dev
```

Open http://localhost:5173.

Production build:

```bash
npm run build
npm run preview
```

---

## Startup order

1. `supabase start` (DB must be up before the server connects)
2. `node server/index.js`
3. `npm run dev` in `client/`

## Troubleshooting

- **Client loads but shows no records / "Error al cargar registros"**
  Supabase isn't running, or `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are
  stale. Re-run `supabase status` and update `client/.env`.
- **REC button returns a network error**
  The server isn't running on `4002`, or CORS is blocking — check
  `server/index.js` is up and the client is pointing at the same port.
- **"No se puede grabar porque ya hay una grabación en curso"**
  `capturers.is_active` or `is_automatic` is `true` in the DB. If a previous
  run crashed, reset the flag from Supabase Studio (`http://127.0.0.1:54323`)
  or `supabase db reset`.
- **Keys rotated after `supabase db reset`**
  The anon key changes on full reset — update both `.env` files.
