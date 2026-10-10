// ============================================================
// UTILS.JS - Yardımcı fonksiyonlar
// ============================================================
window.yuklenenDosyalar.push('utils');
console.log("[✓] utils.js yüklendi");

// Kısa yardımcılar
const U = {
    d: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
    a: (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1),
    r: (min, max) => min + Math.random() * (max - min),
    P: Math.PI,
    P2: Math.PI * 2
};

// Daire çizim
function daire(x, y, r, renk, glow) {
    ctx.fillStyle = renk;
    if (glow) { ctx.shadowColor = renk; ctx.shadowBlur = glow; }
    ctx.beginPath();
    ctx.arc(x, y, r, 0, U.P2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

// Parçacık oluştur
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

// Ses çal
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

// Diyalog mesajı
const setDialogMessage = (msg) => document.getElementById('speechBubble').textContent = msg;

// Bot yüzü güncelle
const setBotFace = (bgColor, text) => {
    botFaceEl.style.background = bgColor;
    botFaceEl.textContent = text;
};

// ===== EFEKT SİSTEMİ =====
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

function updateEffects(dt) {
    for (let i = effects.length - 1; i >= 0; i--) {
        effects[i].yas += dt * 16.67;
        if (effects[i].yas >= effects[i].omur) effects.splice(i, 1);
    }
}

// Tıklama (mobil + PC, çift tetikleme koruması)
function addClickEvent(el, handler) {
    let locked = false;
    const run = () => {
        if (locked) return;
        locked = true;
        setTimeout(() => locked = false, 250);
        handler();
    };
    el.addEventListener('click', run);
    el.addEventListener('touchstart', (e) => { e.preventDefault(); run(); }, { passive: false });
}