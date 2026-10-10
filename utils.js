// ============================================================
// UTILS.JS - Yardımcı fonksiyonlar + efekt sistemi + çizim
// ============================================================
window.dosyaYuklendi('utils');

// ============================================================
// KISA YARDIMCILAR
// ============================================================
const U = {
    d: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
    a: (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1),
    r: (min, max) => min + Math.random() * (max - min),
    P: Math.PI,
    P2: Math.PI * 2
};

// ============================================================
// ÇİZİM YARDIMCILARI
// ============================================================
function daire(x, y, r, renk, glow) {
    ctx.fillStyle = renk;
    if (glow) { ctx.shadowColor = renk; ctx.shadowBlur = glow; }
    ctx.beginPath();
    ctx.arc(x, y, r, 0, U.P2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

// ============================================================
// PARÇACIK SİSTEMİ
// ============================================================
function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * U.P2;
        const speed = Math.random() * 3 + 1;
        particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: Math.random() * 3 + 2,
            life: 300, maxLife: 300,
            color
        });
    }
}

// ============================================================
// SES SİSTEMİ
// ============================================================
function playSound(freq, duration, type = 'sine') {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
}

// ============================================================
// UI YARDIMCILARI
// ============================================================
const setDialogMessage = (msg) => {
    const el = document.getElementById('speechBubble');
    if (el) el.textContent = msg;
};

const setBotFace = (bgColor, text) => {
    const el = document.getElementById('botFace');
    if (el) {
        el.style.background = bgColor;
        el.textContent = text;
    }
};

// ============================================================
// EFEKT OLUŞTURMA
// ============================================================
function efektSokDalgasi(x, y, renk) {
    effects.push({ tip: 'sok', x, y, yas: 0, omur: 400, renk, maxR: 80 });
}

function efektYildizPatlamasi(x, y) {
    effects.push({ tip: 'yildiz', x, y, yas: 0, omur: 300, aci: Math.random() * U.P2 });
}

function efektCarpmaKivilcimi(x, y, renk) {
    for (let i = 0; i < 5; i++) {
        effects.push({
            tip: 'carpma', x, y, yas: 0, omur: 200, renk,
            aci: (U.P2 / 5) * i + Math.random() * 0.5
        });
    }
}

function efektDogusDalgasi(x, y, renk) {
    effects.push({ tip: 'dogus', x, y, yas: 0, omur: 350, renk, maxR: 50 });
}

function efektNamluAtesi(x, y, aci, renk) {
    effects.push({ tip: 'namlu', x, y, yas: 0, omur: 150, renk, aci: aci + U.P });
}

// ============================================================
// EFEKT GÜNCELLEME
// ============================================================
function updateEffects(dt) {
    for (let i = effects.length - 1; i >= 0; i--) {
        effects[i].yas += dt * 16.67;
        if (effects[i].yas >= effects[i].omur) effects.splice(i, 1);
    }
}

// ============================================================
// EFEKT ÇİZİM (game.js tarafından çağrılır)
// ============================================================
function renderEffects(timestamp) {
    for (const e of effects) {
        const oran = e.yas / e.omur;

        if (e.tip === 'sok') {
            ctx.strokeStyle = e.renk;
            ctx.globalAlpha = 1 - oran;
            ctx.lineWidth = 6 * (1 - oran);
            ctx.beginPath();
            ctx.arc(e.x, e.y, e.maxR * oran, 0, U.P2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
        else if (e.tip === 'yildiz') {
            const uz = 40 * (1 - oran);
            ctx.strokeStyle = '#fff';
            ctx.globalAlpha = 1 - oran;
            ctx.lineWidth = 3;
            for (let i = 0; i < 8; i++) {
                const a = e.aci + (U.P / 4) * i;
                ctx.beginPath();
                ctx.moveTo(e.x + Math.cos(a) * 5, e.y + Math.sin(a) * 5);
                ctx.lineTo(e.x + Math.cos(a) * (5 + uz), e.y + Math.sin(a) * (5 + uz));
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
        }
        else if (e.tip === 'carpma') {
            const uz = 15 * (1 - oran);
            ctx.strokeStyle = e.renk;
            ctx.globalAlpha = 1 - oran;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(e.x, e.y);
            ctx.lineTo(e.x + Math.cos(e.aci) * uz, e.y + Math.sin(e.aci) * uz);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
        else if (e.tip === 'dogus') {
            ctx.strokeStyle = e.renk;
            ctx.globalAlpha = 1 - oran;
            ctx.lineWidth = 4 * (1 - oran);
            ctx.beginPath();
            ctx.arc(e.x, e.y, e.maxR * oran, 0, U.P2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
        else if (e.tip === 'namlu') {
            const uz = 12 * (1 - oran);
            ctx.fillStyle = e.renk;
            ctx.globalAlpha = 1 - oran;
            ctx.beginPath();
            ctx.arc(e.x + Math.cos(e.aci) * uz, e.y + Math.sin(e.aci) * uz, 5 * (1 - oran), 0, U.P2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    // Kırılgan boss üstünde dönen yıldızlar
    if (typeof gameState !== 'undefined' && gameState.state === 'bossSavasi' &&
        typeof boss !== 'undefined' && boss.isActive && boss.state === 'kirilgan') {
        const bx = screenWidth / 2;
        const by = screenHeight * 0.14;
        for (let i = 0; i < 3; i++) {
            const a = (timestamp / 400) + (U.P2 / 3) * i;
            const sx = bx + Math.cos(a) * 75;
            const sy = by + Math.sin(a) * 55;
            ctx.fillStyle = '#ffcc00';
            ctx.shadowColor = '#ffcc00';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            for (let k = 0; k < 8; k++) {
                const ang = (U.P / 4) * k;
                const r = k % 2 === 0 ? 10 : 4;
                const px = sx + Math.cos(ang) * r;
                const py = sy + Math.sin(ang) * r;
                if (k === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }
}

// ============================================================
// TIKLAMA (mobil + PC, çift tetikleme koruması)
// ============================================================
function addClickEvent(el, handler) {
    let locked = false;
    const run = () => {
        if (locked) return;
        locked = true;
        setTimeout(() => locked = false, 250);
        handler();
    };
    el.addEventListener('click', run);
    el.addEventListener('touchstart', (e) => {
        e.preventDefault();
        run();
    }, { passive: false });
}