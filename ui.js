// ============================================================
// UI.JS - Arayüz güncellemeleri (skor, can, buton)
// ============================================================
window.dosyaYuklendi('ui');

// Can barını güncelle
function updateHealthBar() {
    document.getElementById('healthBar').textContent =
        '❤️️'.repeat(Math.max(0, player.hp)) +
        '🖤'.repeat(Math.max(0, player.maxHp - player.hp)) +
        (gameState.extraHeart > 0 ? ' 💛' : '');
}

// Skor güncelle
const updateScoreDisplay = () => {
    document.getElementById('scoreDisplay').textContent = 'SKOR: ' + gameState.score;
};

// Dalga göstergesi güncelle
const updateWaveDisplay = () => {
    const w = document.getElementById('waveDisplay');
    if (gameState.state === 'bossSavasi') w.textContent = 'BOSS';
    else if (gameState.state === 'gecis') w.textContent = '...';
    else if (gameState.state === 'soru') w.textContent = 'SORU';
    else w.textContent = `DALGA: ${gameState.botWaveIndex}/3`;
};

// Ulti butonu güncelle
function updateUltiButton() {
    const btn = document.getElementById('ultiButton');
    const txt = document.getElementById('ultiText');
    const percent = Math.floor(Math.min(1, gameState.gauge / 12000) * 100);
    txt.textContent = gameState.extraHeart > 0 ? '🔒' : percent + '%';
    btn.className = '';
    if (gameState.extraHeart > 0) btn.className = 'locked';
    else if (gameState.ultiReady) btn.className = 'ready';
}

// ============================================================
// SORU SİSTEMİ
// ============================================================
let aktifSoru = { soru: null, tenseLabel: '', dogruIndex: 0, cevaplandi: false };

function soruGoster(dalgaNumarasi) {
    gameState.state = 'soru';
    const tenseIndex = (dalgaNumarasi - 1) % tenseSirasi.length;
    const tense = tenseSirasi[tenseIndex];
    const soruHavuzu = sorular[tense.key];
    const soru = soruHavuzu[Math.floor(Math.random() * soruHavuzu.length)];

    aktifSoru.soru = soru;
    aktifSoru.tenseLabel = tense.label;
    aktifSoru.dogruIndex = soru.correct;
    aktifSoru.cevaplandi = false;

    document.getElementById('questionTense').textContent = tense.label;
    document.getElementById('questionText').textContent = soru.text;
    document.getElementById('feedbackText').textContent = '';

    const btns = document.querySelectorAll('.answerBtn');
    btns.forEach((btn, i) => {
        btn.textContent = soru.options[i];
        btn.classList.remove('correct', 'wrong');
        btn.style.pointerEvents = 'auto';
    });

    document.getElementById('questionScreen').style.display = 'flex';
    setBotFace(colors.blue, '🤔');
    setDialogMessage('Answer the question!');
    playSound(700, 0.2, 'sine');
}

function cevapVer(secilenIndex) {
    if (aktifSoru.cevaplandi) return;
    aktifSoru.cevaplandi = true;

    const btns = document.querySelectorAll('.answerBtn');
    const dogruMu = (secilenIndex === aktifSoru.dogruIndex);
    btns.forEach(btn => btn.style.pointerEvents = 'none');
    btns[aktifSoru.dogruIndex].classList.add('correct');
    if (!dogruMu) btns[secilenIndex].classList.add('wrong');

    if (dogruMu) {
        gameState.dogruCevap++;
        gameState.score += 100;
        document.getElementById('feedbackText').textContent = '✓ Correct! +100';
        document.getElementById('feedbackText').style.color = '#2ecc71';
        setBotFace(colors.green, '😌');
        playSound(900, 0.3, 'sine');
    } else {
        gameState.yanlisCevap++;
        document.getElementById('feedbackText').textContent = '✗ Wrong!';
        document.getElementById('feedbackText').style.color = '#e74c3c';
        setBotFace('#e67e22', '😵');
        playSound(200, 0.4, 'sawtooth');
    }
    updateScoreDisplay();

    setTimeout(() => {
        document.getElementById('questionScreen').style.display = 'none';
        if (gameState.state === 'soru') {
            if (gameState.transitionTarget === 'bossSavasi') startBossBattle();
            else startBotWave();
        }
    }, 2000);
}

// Cevap butonlarına tıklama ekle
document.querySelectorAll('.answerBtn').forEach(btn => {
    addClickEvent(btn, () => {
        const idx = parseInt(btn.dataset.index);
        cevapVer(idx);
    });
});