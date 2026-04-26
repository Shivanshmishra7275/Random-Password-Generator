# Multipurpose Security WebStack

A polished Flask app for generating passwords, passphrases, and hashes with a modern UI.

## Team

- Leader: Shivansh Mishra
- Team Members: Ravi Gupta, Harshvardhan Sisodiya, Vishal Patel, Dhuru Madhuwal

## Highlights

- Password Forge with strength telemetry and batch generation
- Passphrase Studio for memorable passphrases
- Hash Lab with digest verification
- Session Vault with export and import
- Render and Vercel deployment support

## Run Locally

```bash
pip install -r requirements.txt
python Random_Password_Generator.py
```

Open: http://127.0.0.1:5000

## Deploy

### Render

- Use `gunicorn wsgi:app` as the start command.
- Keep `requirements.txt` and `Procfile` in the repo.

### Vercel

- Import the GitHub repo in Vercel.
- Vercel will use `vercel.json` and the `api/index.py` entrypoint.
- Open `/healthz` after deploy to confirm the app is live.

## Notes

- Passwords use `secrets` for cryptographically secure randomness.
- Vault data stays in the browser unless exported.
- Hashing uses Python's built-in `hashlib`.
