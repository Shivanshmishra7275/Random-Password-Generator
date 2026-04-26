const byId = (id) => document.getElementById(id);

const elements = {
    length: byId("length"),
    lengthValue: byId("lengthValue"),
    passwordForm: byId("passwordForm"),
    passwordOutput: byId("passwordOutput"),
    strengthMeter: byId("strengthMeter"),
    strengthLabel: byId("strengthLabel"),
    passwordWarnings: byId("passwordWarnings"),
    copyPassword: byId("copyPassword"),
    copyBatch: byId("copyBatch"),
    copyCredit: byId("copyCredit"),
    quickGenerate: byId("quickGenerate"),
    batchCount: byId("batchCount"),
    generateBatch: byId("generateBatch"),
    batchOutput: byId("batchOutput"),
    passphraseForm: byId("passphraseForm"),
    passphraseOutput: byId("passphraseOutput"),
    passphraseStrength: byId("passphraseStrength"),
    copyPassphrase: byId("copyPassphrase"),
    hashForm: byId("hashForm"),
    hashVerifyForm: byId("hashVerifyForm"),
    hashOutput: byId("hashOutput"),
    copyHash: byId("copyHash"),
    verifyText: byId("verifyText"),
    verifyDigest: byId("verifyDigest"),
    verifyResult: byId("verifyResult"),
    clearVault: byId("clearVault"),
    exportVault: byId("exportVault"),
    importVault: byId("importVault"),
    vaultList: byId("vaultList"),
    rotatingTip: byId("rotatingTip"),
    heroScoreRing: byId("heroScoreRing"),
    heroScoreValue: byId("heroScoreValue"),
    entropyValue: byId("entropyValue"),
    uniqueValue: byId("uniqueValue"),
    vaultCountValue: byId("vaultCountValue"),
};

const vaultKey = "shivansh-security-vault";
let securityTips = [];
let tipCursor = 0;
const ringCircumference = 326.73;
const on = (element, eventName, handler) => {
    if (element) {
        element.addEventListener(eventName, handler);
    }
};

const colorForScore = (score) => {
    if (score >= 85) return "#5df3b2";
    if (score >= 65) return "#63e6d4";
    if (score >= 45) return "#ffd166";
    return "#ff7a7a";
};

const analyzeSecret = (value) => {
    const text = String(value || "");
    const total = text.length;
    if (!total) {
        return {
            entropy: 0,
            unique: 0,
            lowerPct: 0,
            upperPct: 0,
            digitsPct: 0,
            symbolsPct: 0,
        };
    }

    let lower = 0;
    let upper = 0;
    let digits = 0;
    let symbols = 0;

    for (const char of text) {
        if (/[a-z]/.test(char)) {
            lower += 1;
        } else if (/[A-Z]/.test(char)) {
            upper += 1;
        } else if (/[0-9]/.test(char)) {
            digits += 1;
        } else {
            symbols += 1;
        }
    }

    const unique = new Set(text).size;
    const pool = unique > 1 ? unique : 2;
    const entropy = Math.round(total * Math.log2(pool));

    return {
        entropy,
        unique,
        lowerPct: Math.round((lower / total) * 100),
        upperPct: Math.round((upper / total) * 100),
        digitsPct: Math.round((digits / total) * 100),
        symbolsPct: Math.round((symbols / total) * 100),
    };
};

const updateTelemetry = (secretValue, scoreValue) => {
    const score = Math.max(0, Math.min(100, Number(scoreValue) || 0));
    const ringOffset = ringCircumference * (1 - score / 100);

    if (elements.heroScoreRing) {
        elements.heroScoreRing.style.strokeDasharray = `${ringCircumference}`;
        elements.heroScoreRing.style.strokeDashoffset = `${ringOffset}`;
        elements.heroScoreRing.style.stroke = colorForScore(score);
    }

    if (elements.heroScoreValue) {
        elements.heroScoreValue.textContent = String(Math.round(score));
    }

    const stats = analyzeSecret(secretValue);
    if (elements.entropyValue) {
        elements.entropyValue.textContent = `${stats.entropy} bits`;
    }
    if (elements.uniqueValue) {
        elements.uniqueValue.textContent = String(stats.unique);
    }
};

const showToast = (text) => {
    elements.strengthLabel.textContent = text;
};

const updateStrength = (score, label) => {
    elements.strengthMeter.style.width = `${Math.max(4, score)}%`;
    elements.strengthMeter.style.background = colorForScore(score);
    elements.strengthLabel.textContent = `Strength: ${label} (${score}/100)`;
};

const renderWarnings = (warnings) => {
    if (!elements.passwordWarnings) {
        return;
    }
    const list = Array.isArray(warnings) ? warnings : [];
    elements.passwordWarnings.innerHTML = "";
    if (!list.length) {
        return;
    }

    list.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        elements.passwordWarnings.appendChild(li);
    });
};

const readVault = () => {
    try {
        return JSON.parse(localStorage.getItem(vaultKey) || "[]");
    } catch {
        return [];
    }
};

const writeVault = (items) => {
    localStorage.setItem(vaultKey, JSON.stringify(items.slice(0, 15)));
};

const normalizeVault = (items) => {
    if (!Array.isArray(items)) {
        return [];
    }
    return items
        .filter((item) => item && typeof item === "object")
        .slice(0, 15)
        .map((item) => ({
            type: String(item.type || "Entry"),
            value: String(item.value || ""),
            stamp: String(item.stamp || new Date().toLocaleString()),
        }));
};

const addVaultItem = (type, value) => {
    const current = readVault();
    const item = {
        type,
        value,
        stamp: new Date().toLocaleString(),
    };
    current.unshift(item);
    writeVault(current);
    renderVault();
};

const renderVault = () => {
    const items = readVault();
    elements.vaultList.innerHTML = "";
    if (elements.vaultCountValue) {
        elements.vaultCountValue.textContent = String(items.length);
    }

    if (!items.length) {
        const empty = document.createElement("li");
        empty.className = "vault-item";
        empty.textContent = "Vault is empty. Generated values will appear here.";
        elements.vaultList.appendChild(empty);
        return;
    }

    items.forEach((item) => {
        const li = document.createElement("li");
        li.className = "vault-item";

        const type = document.createElement("strong");
        type.textContent = item.type;

        const value = document.createElement("p");
        value.className = "output-box";
        value.textContent = item.value;

        const meta = document.createElement("span");
        meta.className = "vault-meta";
        meta.textContent = item.stamp;

        li.append(type, value, meta);
        elements.vaultList.appendChild(li);
    });
};

const copyText = async (text) => {
    if (!text || text.includes("No ")) {
        showToast("⚠️ Generate a value first.");
        return;
    }
    try {
        await navigator.clipboard.writeText(text);
        showToast("✅ Copied to clipboard.");
    } catch {
        showToast("❌ Clipboard access failed.");
    }
};

const postJson = async (url, payload) => {
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || "Request failed.");
    }
    return data;
};

const passwordPayloadFromForm = () => ({
    length: Number(elements.length.value),
    lowercase: byId("lowercase").checked,
    uppercase: byId("uppercase").checked,
    digits: byId("digits").checked,
    symbols: byId("symbols").checked,
    excludeAmbiguous: byId("excludeAmbiguous").checked,
    avoidRepeats: byId("avoidRepeats").checked,
    customSymbols: byId("customSymbols").value,
    excludeChars: byId("excludeChars").value,
});

const generatePassword = async (payload) => {
    const data = await postJson("/api/password", payload);
    elements.passwordOutput.textContent = data.password;
    updateStrength(data.score, data.label);
    updateTelemetry(data.password, data.score);
    renderWarnings(data.warnings);
    addVaultItem("Password", data.password);
};

const generateBatch = async () => {
    const payload = {
        ...passwordPayloadFromForm(),
        count: Number(elements.batchCount.value || 5),
    };
    const data = await postJson("/api/password/batch", payload);
    elements.batchOutput.innerHTML = "";

    data.items.forEach((item) => {
        const li = document.createElement("li");
        li.className = "batch-item";
        li.textContent = `${item.password}  [${item.label} ${item.score}/100 | ${item.entropy} bits]`;
        elements.batchOutput.appendChild(li);
    });

    if (data.items.length) {
        const best = data.items.reduce((current, next) => (next.score > current.score ? next : current), data.items[0]);
        updateTelemetry(best.password, best.score);
        addVaultItem("Password Batch", `${data.items.length} generated`);
    }
};

const generatePassphrase = async () => {
    const payload = {
        wordCount: Number(byId("wordCount").value),
        separator: byId("separator").value,
        includeNumber: byId("includeNumber").checked,
        titleCase: byId("titleCase").checked,
    };

    const data = await postJson("/api/passphrase", payload);
    elements.passphraseOutput.textContent = data.passphrase;
    elements.passphraseStrength.textContent = `Strength: ${data.label} (${data.score}/100)`;
    updateTelemetry(data.passphrase, data.score);
    addVaultItem("Passphrase", data.passphrase);
};

const generateHash = async () => {
    const payload = {
        text: byId("hashInput").value,
        algorithm: byId("hashAlgorithm").value,
    };
    const data = await postJson("/api/hash", payload);
    elements.hashOutput.textContent = data.digest;
    addVaultItem(`Hash (${data.algorithm})`, data.digest);
};

const verifyHash = async () => {
    const payload = {
        text: elements.verifyText.value,
        digest: elements.verifyDigest.value,
        algorithm: byId("hashAlgorithm").value,
    };
    const data = await postJson("/api/hash/verify", payload);
    elements.verifyResult.textContent = data.match
        ? "Verification: Match confirmed."
        : "Verification: Digest does not match.";
};

const exportVault = () => {
    const items = readVault();
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `security-vault-${Date.now()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    showToast("Vault exported.");
};

const importVault = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
        return;
    }

    try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        writeVault(normalizeVault(parsed));
        renderVault();
        showToast("Vault imported.");
    } catch {
        showToast("Invalid vault file.");
    } finally {
        event.target.value = "";
    }
};

const setupObserver = () => {
    const revealTargets = document.querySelectorAll(".reveal");

    if (!("IntersectionObserver" in window)) {
        revealTargets.forEach((el) => el.classList.add("in"));
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("in");
                }
            });
        },
        { threshold: 0.12 }
    );

    revealTargets.forEach((el) => observer.observe(el));
};

const setupTeamInteractions = () => {
    const teamCards = document.querySelectorAll(".team-card");
    teamCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 90}ms`;
        card.addEventListener("mouseenter", () => {
            card.style.transform = "translateY(-4px) scale(1.01)";
        });
        card.addEventListener("mouseleave", () => {
            card.style.transform = "";
        });
    });
};

const setupTips = async () => {
    try {
        const response = await fetch("/api/tips");
        const data = await response.json();
        securityTips = data.tips || [];
    } catch {
        securityTips = ["Keep your accounts protected with strong and unique credentials."];
    }

    if (!securityTips.length) {
        return;
    }

    elements.rotatingTip.textContent = securityTips[0];
    setInterval(() => {
        tipCursor = (tipCursor + 1) % securityTips.length;
        elements.rotatingTip.textContent = securityTips[tipCursor];
    }, 4800);
};

const setupCanvas = () => {
    const canvas = byId("nebulaCanvas");
    if (!canvas || typeof canvas.getContext !== "function") {
        return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
        return;
    }

    let width = 0;
    let height = 0;
    let particles = [];
    const mouse = { x: 0, y: 0 };
    const palette = [
        "rgba(111, 168, 255, 0.52)",
        "rgba(87, 229, 200, 0.48)",
        "rgba(255, 186, 106, 0.45)",
    ];

    const resize = () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        mouse.x = width * 0.5;
        mouse.y = height * 0.5;
        particles = Array.from({ length: Math.max(34, Math.floor(width / 44)) }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.28,
            vy: (Math.random() - 0.5) * 0.28,
            size: Math.random() * 2.3 + 0.65,
            color: palette[Math.floor(Math.random() * palette.length)],
        }));
    };

    const tick = () => {
        ctx.clearRect(0, 0, width, height);

        for (const p of particles) {
            // Slight cursor magnetism gives a premium interactive feel without explicit controls.
            p.vx += (mouse.x - p.x) * 0.000002;
            p.vy += (mouse.y - p.y) * 0.000002;
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < -20) p.x = width + 20;
            if (p.x > width + 20) p.x = -20;
            if (p.y < -20) p.y = height + 20;
            if (p.y > height + 20) p.y = -20;

            ctx.beginPath();
            ctx.fillStyle = p.color;
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();

            p.vx *= 0.999;
            p.vy *= 0.999;
        }

        for (let i = 0; i < particles.length; i += 1) {
            const a = particles[i];
            for (let j = i + 1; j < particles.length; j += 1) {
                const b = particles[j];
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const dist = Math.hypot(dx, dy);
                if (dist < 120) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(146, 189, 255, ${0.16 - dist / 900})`;
                    ctx.lineWidth = 0.8;
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(tick);
    };

    resize();
    tick();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", (event) => {
        mouse.x = event.clientX;
        mouse.y = event.clientY;
    });
};

on(elements.length, "input", () => {
    elements.lengthValue.textContent = elements.length.value;
});

on(elements.passwordForm, "submit", async (event) => {
    event.preventDefault();
    try {
        await generatePassword(passwordPayloadFromForm());
    } catch (error) {
        showToast(error.message);
    }
});

on(elements.quickGenerate, "click", async () => {
    try {
        await generatePassword({
            length: 20,
            lowercase: true,
            uppercase: true,
            digits: true,
            symbols: true,
            excludeAmbiguous: true,
            avoidRepeats: false,
        });
        window.location.hash = "generator";
    } catch (error) {
        showToast(error.message);
    }
});

on(elements.generateBatch, "click", async () => {
    try {
        await generateBatch();
    } catch (error) {
        showToast(error.message);
    }
});

on(elements.passphraseForm, "submit", async (event) => {
    event.preventDefault();
    try {
        await generatePassphrase();
    } catch (error) {
        elements.passphraseStrength.textContent = error.message;
    }
});

on(elements.hashForm, "submit", async (event) => {
    event.preventDefault();
    try {
        await generateHash();
    } catch (error) {
        elements.hashOutput.textContent = error.message;
    }
});

on(elements.hashVerifyForm, "submit", async (event) => {
    event.preventDefault();
    try {
        await verifyHash();
    } catch (error) {
        elements.verifyResult.textContent = `Verification: ${error.message}`;
    }
});

on(elements.copyPassword, "click", () => copyText(elements.passwordOutput.textContent));
on(elements.copyCredit, "click", () => copyText("Made by Shivansh Mishra | Lead Architect, Multipurpose Security WebStack"));
on(elements.copyBatch, "click", () => {
    const values = Array.from(elements.batchOutput.querySelectorAll("li"))
        .map((li) => li.textContent)
        .join("\n");
    copyText(values);
});
on(elements.copyPassphrase, "click", () => copyText(elements.passphraseOutput.textContent));
on(elements.copyHash, "click", () => copyText(elements.hashOutput.textContent));
on(elements.exportVault, "click", exportVault);
on(elements.importVault, "change", importVault);

on(elements.clearVault, "click", () => {
    writeVault([]);
    renderVault();
    showToast("🧹 Vault cleared.");
});

setupObserver();
setupTeamInteractions();
setupTips();
setupCanvas();
renderVault();
updateTelemetry("", 0);
renderWarnings([]);
