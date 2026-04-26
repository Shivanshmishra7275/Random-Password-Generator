# Multipurpose Security WebStack

Production-ready, interactive security toolkit with a Flask API and animated frontend.

## Highlights

- Password Forge
  - Advanced generation controls and live strength telemetry
  - Security warning hints for weak pattern detection
  - Single and batch password generation
- Passphrase Studio
  - Multi-word passphrase generation with formatting controls
- Hash Lab
  - SHA-256, SHA-512, SHA-1, MD5, BLAKE2b
  - Digest verification workflow
- Session Vault
  - Local browser vault with export/import JSON support
- Platform Readiness
  - Production entrypoint with Gunicorn
  - Render-compatible `Procfile`
  - Vercel-compatible `vercel.json`
  - Health endpoint: `/healthz`

## Architecture

- Backend: Flask API (`Random_Password_Generator.py`)
- Frontend: Server-rendered HTML + static JS/CSS
- Security primitives: `secrets`, `hashlib`
- Runtime: Python 3.12

## Local Development

1. Create and activate virtual environment.
2. Install dependencies.
3. Run app.

```bash
pip install -r requirements.txt
python Random_Password_Generator.py
```

Open: http://127.0.0.1:5000

## API Endpoints

- `GET /healthz`
- `GET /api/tips`
- `POST /api/password`
- `POST /api/password/batch`
- `POST /api/passphrase`
- `POST /api/hash`
- `POST /api/hash/verify`

## Deploy on Render

1. Create a new Web Service from your GitHub repo.
2. Render will detect:
   - `requirements.txt`
   - `Procfile` (`web: gunicorn wsgi:app`)
3. Set build command:

```bash
pip install -r requirements.txt
```

4. Set start command (if needed):

```bash
gunicorn wsgi:app
```

## Deploy on Vercel

1. Import repository in Vercel.
2. Vercel uses `vercel.json` and routes all requests to `api/index.py`.
3. Deploy directly.

## Security Notes

- Password generation uses cryptographically secure randomness.
- Hashing is one-way and non-reversible.
- Vault data remains in browser local storage unless manually exported.
