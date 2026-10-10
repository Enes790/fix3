// ============================================================
// GAME.JS - Ana oyun döngüsü + durum makinesi + render
// ============================================================
window.dosyaYuklendi('game');

// ============================================================
// GLOBAL DEĞİŞKENLER
// ============================================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let screenWidth, screenHeight;
let arena = { x: 0, y: 0, w: 0, h: 0 };
let audioCtx = null;
const botFaceEl = document.getElementById('botFace');

let enemyBullets = [], playerBullets = [], particles = [], effects = [], botEnemies = [], lasers = [];
let screenShake = 0, lastTime = 0;

let joystickState = { active: false, x: 0, y: 0, id: null, centerX: 0, centerY: 0 };

let gameState = {
    state: 'botDalga', isRunning: false, score: 0, gauge: 0, ultiReady: false,
    extraHeart: 0, lastAutoFire: 0,
    botWaveIndex: 1, toplamDalga: 0,
    transitionTimer: 0, transitionTarget: '',
    waveClearDelay: 0, waveClearPending: false,
    dogruCevap: 0, yanlisCevap: 0
};

let boss = {
    hp: 40, maxHp: 40, state: 'saldiri', attackCount: 0, maxAttacks: 4,
    attackTimer: 0, breakWaitTimer: 0, breakTimer: 0, phaseIndex: 0,
    isActive: false, renkFlash: 0
};
let bossIntroTimer = null;

// ============================================================
// CANVAS BOYUTLANDIRMA
// ============================================================
function resizeCanvas() {
    screenWidth = canvas.width = window.innerWidth;
    screenHeight = canvas.height = window.innerHeight;
    arena.x = 20;
    arena.y = screenHeight * 0.28 + 20;
    arena.w = screenWidth - 40;
    arena.h = screenHeight - arena.y - 20;

    if (player && player.radius) {
        player.x = Math.max(arena.x + player.radius, Math.min(arena.x + arena.w - player.radius, player.x || arena.x + player.radius));
        player.y = Math.max(arena.y + player.radius, Math.min(arena.y + arena.h - player.radius, player.y || arena.y + player.radius));
    }
}
resizeCanvas();

// ============================================================
// ULTİ BUTONU
// ============================================================
addClickEvent(document.getElementById('ultiButton'), () => {
    if (!gameState.isRunning || gameState.extraHeart > 0 || !gameState.ultiReady) return;
    gameState.ultiReady = false;
    gameState.gauge = 0;
    gameState.extraHeart = 1;
    enemyBullets.forEach(m => createParticles(m.x, m.y, colors.gold, 3));
    enemyBullets = [];
    lasers = lasers.filter(l => l.state === 'active');
    botEnemies.forEach(b => { createParticles(b.x, b.y, colors.gold, 8); gameState.score += 15; });
    botEnemies = [];
    if (gameState.state === 'bossSavasi' && boss.isActive && boss.state === 'kirilgan') {
        boss.hp -= 3;
        if (boss.hp <= 0) triggerBossDeath();
        else setDialogMessage(rastgeleReplik('ultiYedi'));
    }
    screenShake = 25;
    playSound(120, 0.5, 'sawtooth');
    updateScoreDisplay(); updateHealthBar(); updateUltiButton();
    setDialogMessage('+1 CAN!');
});

// ============================================================
// ANA GÜNCELLEME
// ============================================================
function updateGameLogic(deltaTime, timestamp) {
    if (gameState.state === 'soru') return;

    oyuncuGuncelle(deltaTime);

    for (const enemy of botEnemies) botGuncelle(enemy, deltaTime, timestamp);

    mermiGuncelle(deltaTime);
    updateBoss(deltaTime, timestamp);

    // Parçacıklar
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * deltaTime;
        p.y += p.vy * deltaTime;
        p.vx *= 0.95; p.vy *= 0.95;
        p.life -= deltaTime * 16.67;
        if (p.life <= 0) particles.splice(i, 1);
    }
    updateEffects(deltaTime);

    // Ulti dolum (grazing)
    if (gameState.extraHeart === 0 && !gameState.ultiReady) {
        let nearBullets = 0;
        for (const bullet of enemyBullets) {
            const dist = U.d(bullet.x, bullet.y, player.x, player.y);
            if (dist < player.radius + 40 + bullet.radius && dist > bullet.radius + player.radius) nearBullets++;
        }
        if (nearBullets > 0) {
            gameState.gauge += deltaTime * 16.67 * nearBullets * 1.8;
            if (gameState.gauge >= 12000) {
                gameState.gauge = 12000;
                gameState.ultiReady = true;
                setDialogMessage('ULTIMATE READY!');
                playSound(900, 0.4, 'sine');
            }
            updateUltiButton();
        }
    }

    // Dalga geçişi
    if (gameState.state === 'botDalga' && botEnemies.length === 0) {
        if (!gameState.waveClearPending) {
            gameState.waveClearPending = true;
            gameState.waveClearDelay = 1200;
        } else {
            gameState.waveClearDelay -= deltaTime * 16.67;
            if (gameState.waveClearDelay <= 0) {
                gameState.waveClearPending = false;
                gameState.waveClearDelay = 0;
                if (gameState.botWaveIndex < 3) {
                    gameState.botWaveIndex++;
                    gameState.transitionTarget = 'botDalga';
                    soruGoster(gameState.toplamDalga + gameState.botWaveIndex);
                } else {
                    gameState.transitionTarget = 'bossSavasi';
                    soruGoster(gameState.toplamDalga + 4);
                }
            }
        }
    } else if (gameState.state === 'gecis') {
        gameState.transitionTimer -= deltaTime * 16.67;
        if (gameState.transitionTimer <= 0 && gameState.transitionTarget === 'bossSavasi') startBossBattle();
    }

    // Otomatik ateş
    if (timestamp - gameState.lastAutoFire > 220) {
        gameState.lastAutoFire = timestamp;
        firePlayerBullet();
    }
}

// ============================================================
// ÇİZİM
// ============================================================
function renderGame(timestamp) {
    ctx.clearRect(0, 0, screenWidth, screenHeight);
    ctx.save();

    if (screenShake > 0) {
        ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
        screenShake *= 0.9;
        if (screenShake < 0.5) screenShake = 0;
    }

    // Arena kenar
    const borderColor = gameState.ultiReady ? colors.yellow :
                        gameState.extraHeart > 0 ? colors.gold :
                        (gameState.state === 'bossSavasi' && boss.state === 'kirilgan') ? colors.green : colors.red;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 3;
    ctx.shadowColor = borderColor;
    ctx.shadowBlur = 10;
    ctx.strokeRect(arena.x, arena.y, arena.w, arena.h);
    ctx.shadowBlur = 0;

    // Parçacıklar
    for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * (p.life / p.maxLife), 0, U.P2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Lazerlər
    for (const laser of lasers) {
        if (laser.state === 'warning') {
            ctx.strokeStyle = 'rgba(231,76,60,0.8)';
            ctx.lineWidth = Math.floor(timestamp / 70) % 2 ? 4 : 1.5;
            ctx.beginPath();
            ctx.moveTo(laser.x1, laser.y1);
            ctx.lineTo(laser.x2, laser.y2);
            ctx.stroke();
        } else if (laser.state === 'active') {
            ctx.strokeStyle = "#00ffff";
            ctx.lineWidth = 8;
            ctx.shadowColor = "#00ffff";
            ctx.shadowBlur = 18;
            ctx.beginPath();
            ctx.moveTo(laser.x1, laser.y1);
            ctx.lineTo(laser.x2, laser.y2);
            ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.font = "22px serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("⚡", laser.x1, laser.y1);
            ctx.fillText("⚡", laser.x2, laser.y2);
        }
    }

    // Düşman mermileri
    for (const bullet of enemyBullets) {
        if (bullet.type === 'buyuk') {
            // Dönen mouse
            ctx.save();
            ctx.translate(bullet.x, bullet.y);
            ctx.rotate(timestamp / 300);
            ctx.font = "42px serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("🖱️", 0, 0);
            ctx.restore();
            // Sekme halkası
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, bullet.radius * 0.95, -U.P / 2, -U.P / 2 + U.P2 * ((5 - bullet.bounces) / 5));
            ctx.stroke();
        } else if (bullet.type === 'yelpaze') {
            daire(bullet.x, bullet.y, bullet.radius, colors.cyan, 12);
        } else {
            daire(bullet.x, bullet.y, bullet.radius, bullet.type === 'kucuk' ? colors.yellow : colors.orange, 10);
        }
    }

    // Botlar
    for (const enemy of botEnemies) {
        if (enemy.tip === 'yelpaze') {
            if (enemy.charging && Math.floor(timestamp / 100) % 2) {
                daire(enemy.x, enemy.y, enemy.radius + 4, colors.red, 15);
            }
            ctx.font = "36px serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("👾", enemy.x, enemy.y);
            if (enemy.charging) {
                const kalan = enemy.shootInterval - (timestamp - enemy.lastShot);
                const oran = 1 - kalan / 500;
                ctx.strokeStyle = colors.red;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(enemy.x, enemy.y, enemy.radius + 8 + oran * 10, 0, U.P2 * oran);
                ctx.stroke();
            }
        } else {
            ctx.font = "36px serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("⚠️", enemy.x, enemy.y);
        }
        if (!enemy.icerde) {
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.radius + 6, 0, U.P2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    for (const bullet of playerBullets) daire(bullet.x, bullet.y, bullet.radius, colors.gold, 10);

    // Boss - bilgisayar görünümü
    if (gameState.state === 'bossSavasi' && boss.isActive && boss.hp > 0) {
        const bx = screenWidth / 2, by = screenHeight * 0.14;
        const renk = boss.renkFlash > 0 ? colors.yellow : (boss.state === 'kirilgan' ? colors.green : colors.red);

        // Monitör çerçevesi
        ctx.fillStyle = '#1a1a2e';
        ctx.strokeStyle = renk;
        ctx.lineWidth = 4;
        ctx.shadowColor = renk;
        ctx.shadowBlur = 25;
        ctx.beginPath();
        ctx.roundRect(bx - 60, by - 45, 120, 80, 8);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Ekran
        ctx.fillStyle = boss.state === 'kirilgan' ? '#0a3a1e' : (boss.renkFlash > 0 ? '#3a3a0a' : '#1a0505');
        ctx.fillRect(bx - 50, by - 35, 100, 60);

        // Yüz emoji
        ctx.font = "32px serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        let yuzEmoji = "😊";
        const hpOran = boss.hp / boss.maxHp;
        if (boss.state === 'kirilgan') yuzEmoji = "😵";
        else if (boss.renkFlash > 0) yuzEmoji = "😡";
        else if (hpOran > 0.75) yuzEmoji = "😊";
        else if (hpOran > 0.5) yuzEmoji = "🤔";
        else if (hpOran > 0.25) yuzEmoji = "😰";
        else if (hpOran > 0) yuzEmoji = "🥴";
        ctx.fillText(yuzEmoji, bx, by - 5);

        // Tuş takımı
        ctx.fillStyle = '#2a2a3e';
        ctx.beginPath();
        ctx.roundRect(bx - 45, by + 38, 90, 20, 4);
        ctx.fill();
        ctx.fillStyle = renk;
        for (let i = 0; i < 6; i++) {
            const tx = bx - 38 + (i % 3) * 30;
            const ty = by + 43 + Math.floor(i / 3) * 8;
            ctx.fillRect(tx, ty, 20, 5);
        }

        // Kablo
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(bx + 60, by + 40);
        ctx.quadraticCurveTo(bx + 90, by + 50, bx + 85, by + 80);
        ctx.stroke();
    }

    // Boss HP bar
    if (gameState.state === 'bossSavasi' && boss.isActive && boss.hp > 0) {
        const barWidth = Math.min(screenWidth * 0.7, 400);
        const barX = (screenWidth - barWidth) / 2;
        const barY = screenHeight * 0.28 - 18;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(barX, barY, barWidth, 10);
        ctx.fillStyle = boss.state === 'kirilgan' ? colors.green : colors.red;
        ctx.fillRect(barX + 1, barY + 1, (barWidth - 2) * (boss.hp / boss.maxHp), 8);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, 10);
        ctx.save();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`SYSTEM HP ${boss.hp}/${boss.maxHp}`, screenWidth / 2, barY - 3);
        ctx.restore();
    }

    // Oyuncu
    if (gameState.isRunning) {
        ctx.globalAlpha = (player.invulnerableTimer > 0 && Math.floor(timestamp / 100) % 2) ? 0.4 : 1;
        if (gameState.extraHeart > 0) {
            ctx.strokeStyle = colors.gold;
            ctx.lineWidth = 3;
            ctx.shadowColor = colors.gold;
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(player.x, player.y, player.radius + 6, 0, U.P2);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
        daire(player.x, player.y, player.radius, colors.gold, 18);
        daire(player.x, player.y, player.radius * 0.45, '#fff', 0);
        daire(player.x, player.y - 2, player.radius * 0.15, '#000', 0);
        ctx.globalAlpha = 1;
    }

    renderEffects(timestamp);
    ctx.restore();
}

// ============================================================
// ANA DÖNGÜ
// ============================================================
const mainLoop = (timestamp) => {
    const deltaTime = Math.min(50, timestamp - lastTime) / 16.67;
    lastTime = timestamp;
    if (gameState.isRunning) updateGameLogic(deltaTime, timestamp);
    renderGame(timestamp);
    requestAnimationFrame(mainLoop);
};
requestAnimationFrame(mainLoop);

// ============================================================
// OYUN BAŞLAT
// ============================================================
function startGame() {
    document.getElementById('startButton').style.display = 'none';
    document.getElementById('joystick').style.display = 'block';
    document.getElementById('ultiButton').style.display = 'flex';
    document.getElementById('gameOverScreen').style.display = 'none';

    player.x = arena.x + arena.w / 2;
    player.y = arena.y + arena.h / 2;
    player.hp = player.maxHp;
    player.invulnerableTimer = 0;

    gameState.isRunning = true;
    gameState.score = 0;
    gameState.botWaveIndex = 1;
    gameState.toplamDalga = 0;
    gameState.gauge = 0;
    gameState.ultiReady = false;
    gameState.extraHeart = 0;
    gameState.transitionTimer = 0;
    gameState.lastAutoFire = 0;
    gameState.state = 'botDalga';
    gameState.transitionTarget = '';
    gameState.waveClearDelay = 0;
    gameState.waveClearPending = false;
    gameState.dogruCevap = 0;
    gameState.yanlisCevap = 0;

    if (bossIntroTimer) { clearTimeout(bossIntroTimer); bossIntroTimer = null; }
    document.getElementById('warningOverlay').style.display = 'none';
    botFaceEl.style.opacity = '1';
    document.getElementById('waveDisplay').textContent = 'DALGA: 1/3';

    boss.isActive = false;
    boss.hp = boss.maxHp;
    boss.state = 'saldiri';
    boss.phaseIndex = 0;
    boss.renkFlash = 0;

    botEnemies = [];
    enemyBullets = [];
    playerBullets = [];
    lasers = [];
    particles = [];
    effects = [];
    screenShake = 0;

    setBotFace(colors.red, '⚠️');
    updateHealthBar();
    updateScoreDisplay();
    updateUltiButton();
    setDialogMessage('Ready?');
    setTimeout(() => { if (gameState.isRunning) startBotWave(); }, 800);
}

// Oyun sonu
function finishGame(isWin) {
    gameState.isRunning = false;
    const record = Math.max(gameState.score, parseInt(localStorage.getItem('recordKey') || '0'));
    localStorage.setItem('recordKey', record);

    document.getElementById('gameOverTitle').textContent = isWin ? 'SYSTEM CLEAN!' : 'SYSTEM CRASHED!';
    document.getElementById('gameOverDesc').textContent = isWin ? "Virus removed. Thank you, User." : "Virus won. Try again.";
    document.getElementById('gameOverScore').textContent = 'Skor: ' + gameState.score;
    document.getElementById('gameOverRecord').textContent = 'Rekor: ' + record;

    const toplam = gameState.dogruCevap + gameState.yanlisCevap;
    const yuzde = toplam > 0 ? Math.floor((gameState.dogruCevap / toplam) * 100) : 0;
    document.getElementById('gameOverStats').textContent = `İngilizce: ${gameState.dogruCevap}/${toplam} doğru (${yuzde}%)`;

    document.getElementById('gameOverScreen').style.display = 'flex';
    document.getElementById('joystick').style.display = 'none';
    document.getElementById('ultiButton').style.display = 'none';
}

// Başlat butonları
addClickEvent(document.getElementById('startButton'), startGame);
addClickEvent(document.getElementById('restartButton'), startGame);