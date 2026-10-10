// ============================================================
// BOSS.JS - Bilgisayar boss + lazer + faz sistemi
// ============================================================
window.dosyaYuklendi('boss');

// Lazer oluştur
function createLaser(px, py, angle) {
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const len = Math.max(screenWidth, screenHeight) * 2;
    lasers.push({
        x1: px - cos * len, y1: py - sin * len,
        x2: px + cos * len, y2: py + sin * len,
        warningTimer: 1500, activeTimer: 300,
        state: 'warning', width: 14
    });
}

// 6'lı lazer saldırısı
function triggerSixLaserAttack() {
    const angleToPlayer = U.a(screenWidth / 2, screenHeight * 0.14 + 40, player.x, player.y);
    createLaser(player.x, player.y, angleToPlayer);
    for (let i = 0; i < 5; i++) {
        const rx = U.r(arena.x, arena.x + arena.w);
        const ry = U.r(arena.y, arena.y + arena.h);
        const ra = Math.random() * U.P2;
        createLaser(rx, ry, ra);
    }
    playSound(400, 0.2, 'sawtooth');
}

// Bir noktanın çizgiye mesafesi
function getDistanceFromLine(px, py, x1, y1, x2, y2) {
    const A = px - x1, B = py - y1, C = x2 - x1, D = y2 - y1;
    const dot = A * C + B * D, len_sq = C * C + D * D;
    let param = -1;
    if (len_sq !== 0) param = dot / len_sq;
    let xx, yy;
    if (param < 0) { xx = x1; yy = y1; }
    else if (param > 1) { xx = x2; yy = y2; }
    else { xx = x1 + param * C; yy = y1 + param * D; }
    return U.d(px, py, xx, yy);
}

// Boss güncelleme
function updateBoss(deltaTime, timestamp) {
    if (gameState.state !== 'bossSavasi' || !boss.isActive || boss.hp <= 0) return;
    if (boss.renkFlash > 0) boss.renkFlash -= deltaTime * 16.67;

    if (boss.state === 'saldiri') {
        boss.attackTimer -= deltaTime * 16.67;
        if (boss.attackTimer <= 0 && boss.attackCount < boss.maxAttacks) {
            boss.attackTimer = boss.phaseIndex === 1 ? 1500 : 1400;
            boss.attackCount++;
            const bx = screenWidth / 2, by = screenHeight * 0.14 + 40;
            if (boss.phaseIndex === 1) boss.renkFlash = 200;

            if (boss.phaseIndex === 0) {
                // Mouse fırlat
                const angle = U.a(bx, by, player.x, player.y);
                enemyBullets.push({
                    x: bx, y: by,
                    vx: Math.cos(angle) * 4.5,
                    vy: Math.sin(angle) * 4.5,
                    radius: 18, type: 'buyuk',
                    bounces: 0, isInside: false, isStopped: false, stopTimer: 0
                });
                efektDogusDalgasi(bx, by, colors.orange);
                playSound(200, 0.15, 'triangle');
            } else {
                triggerSixLaserAttack();
            }
        }
        if (boss.attackCount >= boss.maxAttacks) {
            boss.state = 'bekleme';
            boss.breakWaitTimer = 600;
        }
    } else if (boss.state === 'bekleme') {
        boss.breakWaitTimer -= deltaTime * 16.67;
        if (boss.breakWaitTimer <= 0) {
            boss.state = 'kirilgan';
            boss.breakTimer = 2800;
            setBotFace(colors.green, '😌');
            setDialogMessage(rastgeleReplik('kirilgan'));
            playSound(900, 0.3, 'sine');
        }
    } else if (boss.state === 'kirilgan') {
        boss.breakTimer -= deltaTime * 16.67;
        botFaceEl.style.opacity = Math.floor(timestamp / 150) % 2 ? '0.6' : '1';
        if (boss.breakTimer <= 0) {
            boss.phaseIndex = (boss.phaseIndex + 1) % 2;
            boss.attackCount = 0;
            boss.isActive = false;
            botFaceEl.style.opacity = '1';
            gameState.botWaveIndex = 1;
            startBotWave();
        }
    }
}

// Boss savaşı başlat
function startBossBattle() {
    gameState.state = 'bossSavasi';
    boss.isActive = true;
    boss.state = 'saldiri';
    boss.attackCount = 0;
    boss.attackTimer = 800;
    boss.renkFlash = 0;
    document.getElementById('warningOverlay').style.display = 'block';
    playSound(200, 0.5, 'sawtooth');
    setDialogMessage('HAZIR OL!');

    if (bossIntroTimer) clearTimeout(bossIntroTimer);
    bossIntroTimer = setTimeout(() => {
        bossIntroTimer = null;
        if (gameState.state !== 'bossSavasi') return;
        document.getElementById('warningOverlay').style.display = 'none';
        setBotFace(colors.red, '🖥️');
        setDialogMessage(rastgeleReplik('karsilama'));
        playSound(150, 0.4, 'sawtooth');
    }, 1800);
    updateWaveDisplay();
}

// Boss ölümü
function triggerBossDeath() {
    boss.hp = 0;
    boss.isActive = false;
    botFaceEl.style.opacity = '1';
    createParticles(screenWidth / 2, screenHeight * 0.14, colors.gold, 40);
    efektSokDalgasi(screenWidth / 2, screenHeight * 0.14, colors.gold);
    efektYildizPatlamasi(screenWidth / 2, screenHeight * 0.14);
    screenShake = 40;
    playSound(100, 1, 'sawtooth');
    setBotFace(colors.gray, '😇');
    setDialogMessage(rastgeleReplik('olum'));
    setTimeout(() => finishGame(true), 2000);
}

// Geçiş durumu
function startTransition(targetState, duration) {
    gameState.state = 'gecis';
    gameState.transitionTimer = duration;
    gameState.transitionTarget = targetState;
    document.getElementById('waveDisplay').textContent = '...';
}