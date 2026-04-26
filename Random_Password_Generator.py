import hashlib
import math
import os
import secrets
import string
import time
from collections import defaultdict, deque
from dataclasses import dataclass

from flask import Flask, jsonify, render_template, request

DEFAULT_SYMBOLS = "!@#$%^&*()-_=+[]{};:,.?/"
AMBIGUOUS_CHARACTERS = set("Il1O0|`'\"")
HASH_ALGORITHMS = {"sha256", "sha512", "sha1", "md5", "blake2b"}
RATE_LIMIT_WINDOW_SECONDS = 60
RATE_LIMIT_MAX_REQUESTS = 120
MAX_BATCH_SIZE = 20

WORD_BANK = [
    "ember",
    "atlas",
    "cobalt",
    "summit",
    "vector",
    "aurora",
    "saffron",
    "nova",
    "quartz",
    "echo",
    "raven",
    "tidal",
    "pixel",
    "meteor",
    "shield",
    "circuit",
    "breeze",
    "harbor",
    "signal",
    "cipher",
    "rocket",
    "zenith",
    "fusion",
    "matrix",
    "orbit",
    "glacier",
    "fluent",
    "anchor",
    "vortex",
    "horizon",
]

SECURITY_TIPS = [
    "Use a unique password for every account.",
    "Turn on multi-factor authentication wherever possible.",
    "Rotate critical account passwords every few months.",
    "Never share OTP codes, recovery links, or backup codes.",
    "Store passwords in a trusted password manager.",
]

# Lightweight in-memory request tracker for per-IP throttling.
REQUEST_WINDOW = defaultdict(deque)


@dataclass(frozen=True)
class PasswordOptions:
    length: int
    lowercase: bool
    uppercase: bool
    digits: bool
    symbols: bool
    exclude_ambiguous: bool
    avoid_repeats: bool


def parse_bool(value, default=False):
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "on"}
    if isinstance(value, (int, float)):
        return bool(value)
    return default


def parse_int(value, default, minimum, maximum):
    try:
        number = int(value)
    except (TypeError, ValueError):
        number = default
    return max(minimum, min(number, maximum))


def parse_str(value, default=""):
    if value is None:
        return default
    return str(value)


def unique_string(value):
    return "".join(dict.fromkeys(value))


def estimate_entropy(password):
    unique_count = len(set(password))
    pool_size = unique_count if unique_count > 1 else 2
    return round(len(password) * math.log2(pool_size), 2)


def build_charset(options, custom_symbols="", exclude_chars=""):
    groups = []
    if options.lowercase:
        groups.append(string.ascii_lowercase)
    if options.uppercase:
        groups.append(string.ascii_uppercase)
    if options.digits:
        groups.append(string.digits)
    if options.symbols:
        symbols = custom_symbols.strip() or DEFAULT_SYMBOLS
        groups.append(symbols)

    if not groups:
        raise ValueError("Choose at least one character set.")

    if options.exclude_ambiguous:
        groups = ["".join(ch for ch in group if ch not in AMBIGUOUS_CHARACTERS) for group in groups]

    blocked = set(exclude_chars or "")
    if blocked:
        groups = ["".join(ch for ch in group if ch not in blocked) for group in groups]

    groups = [unique_string(group) for group in groups if group]
    if not groups:
        raise ValueError("No characters left after exclusions. Adjust your settings.")

    pool = unique_string("".join(groups))
    return groups, pool


def generate_password(options, custom_symbols="", exclude_chars=""):
    groups, pool = build_charset(options, custom_symbols=custom_symbols, exclude_chars=exclude_chars)

    required = []
    used = set()
    for group in groups:
        if options.avoid_repeats:
            group_chars = [char for char in group if char not in used]
            if not group_chars:
                raise ValueError("Avoid repeats cannot be satisfied with overlapping character groups.")
            choice = secrets.choice(group_chars)
            used.add(choice)
        else:
            choice = secrets.choice(group)
        required.append(choice)

    if options.length < len(required):
        raise ValueError(f"Length must be at least {len(required)} for your selected sets.")

    if options.avoid_repeats and options.length > len(pool):
        raise ValueError("Avoid repeats is enabled, but the character pool is too small.")

    password_chars = required[:]
    if options.avoid_repeats:
        available = [char for char in pool if char not in used]
        while len(password_chars) < options.length:
            choice = secrets.choice(available)
            password_chars.append(choice)
            available.remove(choice)
    else:
        while len(password_chars) < options.length:
            password_chars.append(secrets.choice(pool))

    secrets.SystemRandom().shuffle(password_chars)
    return "".join(password_chars)


def score_password(password):
    unique_count = len(set(password))
    categories = 0
    categories += any(ch.islower() for ch in password)
    categories += any(ch.isupper() for ch in password)
    categories += any(ch.isdigit() for ch in password)
    categories += any(ch in DEFAULT_SYMBOLS or ch in string.punctuation for ch in password)

    length_score = min(40, len(password) * 2.4)
    variety_score = categories * 14
    uniqueness_score = min(20, unique_count * 1.5)

    pool_size = unique_count if unique_count > 1 else 2
    entropy_bits = len(password) * math.log2(pool_size)
    entropy_score = min(24, entropy_bits / 3)

    score = int(min(100, length_score + variety_score + uniqueness_score + entropy_score))
    if score >= 85:
        label = "Elite"
    elif score >= 65:
        label = "Strong"
    elif score >= 45:
        label = "Moderate"
    else:
        label = "Weak"
    return score, label


def detect_password_warnings(password):
    warnings = []
    lowered = password.lower()
    weak_patterns = ["password", "admin", "qwerty", "letmein", "welcome", "1234", "abcd"]

    if len(password) < 12:
        warnings.append("Use at least 12 characters for stronger protection.")
    if any(pattern in lowered for pattern in weak_patterns):
        warnings.append("Avoid predictable words or common keyboard patterns.")

    unique_ratio = len(set(password)) / len(password) if password else 0
    if unique_ratio < 0.55:
        warnings.append("Increase character uniqueness to reduce predictability.")

    if password == password[::-1] and len(password) > 3:
        warnings.append("Avoid mirrored or symmetric patterns.")

    return warnings


def generate_passphrase(word_count, separator, include_number, title_case):
    if word_count < 2 or word_count > 8:
        raise ValueError("Word count must be between 2 and 8.")

    words = [secrets.choice(WORD_BANK) for _ in range(word_count)]
    if title_case:
        words = [word.title() for word in words]

    phrase = separator.join(words)
    if include_number:
        phrase = f"{phrase}{separator}{secrets.randbelow(9000) + 1000}"
    return phrase


def hash_text(text, algorithm):
    return hashlib.new(algorithm, text.encode("utf-8")).hexdigest()


def request_ip():
    xff = request.headers.get("X-Forwarded-For", "")
    if xff:
        return xff.split(",")[0].strip()
    return request.remote_addr or "unknown"


def allow_request(ip):
    now = time.time()
    window = REQUEST_WINDOW[ip]
    while window and window[0] < now - RATE_LIMIT_WINDOW_SECONDS:
        window.popleft()

    if len(window) >= RATE_LIMIT_MAX_REQUESTS:
        retry_after = max(1, int(RATE_LIMIT_WINDOW_SECONDS - (now - window[0])))
        return False, retry_after

    window.append(now)
    return True, 0


def create_app():
    app = Flask(__name__)

    @app.before_request
    def basic_rate_limit():
        if request.path.startswith("/static"):
            return None

        allowed, retry_after = allow_request(request_ip())
        if allowed:
            return None

        return jsonify({"error": "Too many requests. Please slow down."}), 429, {
            "Retry-After": str(retry_after)
        }

    @app.after_request
    def set_security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        response.headers["Cache-Control"] = "no-store"
        return response

    @app.get("/")
    def home():
        return render_template("index.html")

    @app.get("/healthz")
    def health_check():
        return jsonify({"status": "ok", "service": "security-webstack"})

    @app.get("/api/tips")
    def tips():
        return jsonify({"tips": SECURITY_TIPS})

    @app.post("/api/password")
    def api_password():
        payload = request.get_json(silent=True) or {}
        options = PasswordOptions(
            length=parse_int(payload.get("length"), default=16, minimum=4, maximum=128),
            lowercase=parse_bool(payload.get("lowercase"), default=True),
            uppercase=parse_bool(payload.get("uppercase"), default=True),
            digits=parse_bool(payload.get("digits"), default=True),
            symbols=parse_bool(payload.get("symbols"), default=True),
            exclude_ambiguous=parse_bool(payload.get("excludeAmbiguous"), default=False),
            avoid_repeats=parse_bool(payload.get("avoidRepeats"), default=False),
        )

        try:
            password = generate_password(
                options,
                custom_symbols=parse_str(payload.get("customSymbols")),
                exclude_chars=parse_str(payload.get("excludeChars")),
            )
        except ValueError as exc:
            return jsonify({"error": str(exc)}), 400

        score, label = score_password(password)
        return jsonify({
            "password": password,
            "score": score,
            "label": label,
            "length": len(password),
            "entropy": estimate_entropy(password),
            "warnings": detect_password_warnings(password),
        })

    @app.post("/api/password/batch")
    def api_password_batch():
        payload = request.get_json(silent=True) or {}
        count = parse_int(payload.get("count"), default=5, minimum=1, maximum=MAX_BATCH_SIZE)

        options = PasswordOptions(
            length=parse_int(payload.get("length"), default=16, minimum=4, maximum=128),
            lowercase=parse_bool(payload.get("lowercase"), default=True),
            uppercase=parse_bool(payload.get("uppercase"), default=True),
            digits=parse_bool(payload.get("digits"), default=True),
            symbols=parse_bool(payload.get("symbols"), default=True),
            exclude_ambiguous=parse_bool(payload.get("excludeAmbiguous"), default=False),
            avoid_repeats=parse_bool(payload.get("avoidRepeats"), default=False),
        )

        custom_symbols = parse_str(payload.get("customSymbols"))
        exclude_chars = parse_str(payload.get("excludeChars"))

        items = []
        try:
            for _ in range(count):
                value = generate_password(options, custom_symbols=custom_symbols, exclude_chars=exclude_chars)
                score, label = score_password(value)
                items.append(
                    {
                        "password": value,
                        "score": score,
                        "label": label,
                        "entropy": estimate_entropy(value),
                    }
                )
        except ValueError as exc:
            return jsonify({"error": str(exc)}), 400

        return jsonify({"count": count, "items": items})

    @app.post("/api/passphrase")
    def api_passphrase():
        payload = request.get_json(silent=True) or {}
        word_count = parse_int(payload.get("wordCount"), default=4, minimum=2, maximum=8)
        separator = parse_str(payload.get("separator", "-") or "-")[:3]
        include_number = parse_bool(payload.get("includeNumber"), default=False)
        title_case = parse_bool(payload.get("titleCase"), default=False)

        try:
            phrase = generate_passphrase(word_count, separator, include_number, title_case)
        except ValueError as exc:
            return jsonify({"error": str(exc)}), 400

        score, label = score_password(phrase)
        return jsonify({
            "passphrase": phrase,
            "score": score,
            "label": label,
            "entropy": estimate_entropy(phrase),
        })

    @app.post("/api/hash")
    def api_hash():
        payload = request.get_json(silent=True) or {}
        text = parse_str(payload.get("text"))
        algorithm = parse_str(payload.get("algorithm", "sha256")).lower()

        if algorithm not in HASH_ALGORITHMS:
            return jsonify({"error": "Unsupported hash algorithm."}), 400
        if not text.strip():
            return jsonify({"error": "Enter text to hash."}), 400

        digest = hash_text(text, algorithm)
        return jsonify({"algorithm": algorithm, "digest": digest})

    @app.post("/api/hash/verify")
    def api_hash_verify():
        payload = request.get_json(silent=True) or {}
        text = parse_str(payload.get("text"))
        algorithm = parse_str(payload.get("algorithm", "sha256")).lower()
        target_digest = parse_str(payload.get("digest")).strip().lower()

        if algorithm not in HASH_ALGORITHMS:
            return jsonify({"error": "Unsupported hash algorithm."}), 400
        if not text.strip() or not target_digest:
            return jsonify({"error": "Text and digest are required for verification."}), 400

        computed = hash_text(text, algorithm)
        return jsonify(
            {
                "algorithm": algorithm,
                "computed": computed,
                "provided": target_digest,
                "match": secrets.compare_digest(computed, target_digest),
            }
        )

    return app


app = create_app()


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", "5000")),
        debug=parse_bool(os.environ.get("FLASK_DEBUG"), default=False),
    )