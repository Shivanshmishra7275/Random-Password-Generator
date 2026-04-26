# Multipurpose Security WebStack

A modern Flask web app for secure password generation, passphrase creation, hashing, and live strength telemetry.

![Security WebStack Banner](https://capsule-render.vercel.app/api?type=waving&height=220&text=Security%20WebStack&fontAlign=50&fontAlignY=38&color=0:0b132b,45:1c2541,100:5bc0be&fontColor=f5f7ff&desc=By%20Shivansh%20Mishra&descAlignY=58)

![Python](https://img.shields.io/badge/Python-3.12+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.x-000000?style=for-the-badge&logo=flask&logoColor=white)
![Status](https://img.shields.io/badge/Status-Production%20Ready-1f9d55?style=for-the-badge)

## Live Demo

**Try it here:** [https://random-password-generator-by-shivansh-mishra.vercel.app/](https://random-password-generator-by-shivansh-mishra.vercel.app/)

### Visual Snapshot

| Security Modules | What You Get |
|---|---|
| 🔐 Password Forge | Live score + strength feedback |
| 🧠 Passphrase Studio | Quick memorable secure phrases |
| 🧪 Hash Lab | Digest generation + verification |
| 🗂 Session Vault | Local save, import, and export |

## Overview

This project is built for practical, day-to-day security workflows with a clean and simple interface.

## Core Features

- Password Forge with live strength score and telemetry
- Batch password generation for quick options
- Passphrase Studio for memorable high-strength phrases
- Hash Lab with digest generation and verification
- Session Vault with JSON export and import

## Team

- Leader: Shivansh Mishra
- Team Members: Ravi Gupta, Harshvardhan Sisodiya, Vishal Patel, Dhuru Madhuwal

## Quick Start

```bash
pip install -r requirements.txt
python Random_Password_Generator.py
```

Open http://127.0.0.1:5000

## Security Notes

- Password randomness uses Python `secrets`
- Hashing uses Python `hashlib`
- Vault data remains browser-local unless exported

## Health Check

- Endpoint: `/healthz`
- Expected response: `{"status":"ok","service":"security-webstack"}`
