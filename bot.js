// ============================================================
// BOT.JS - İki fazlı botlar (önce kutuya gir, sonra saldır)
// ============================================================
window.dosyaYuklendi('bot');

// Bot spawn (doğuş)
function botSpawn(tip) {
    let x, y;
    const corner = Math.floor(Math.random() * 4);
    if (corner === 0) { x = U.r(arena.x, arena.x + arena.w); y = arena.y - 40; }
    else if (corner === 1) { x = arena.x + arena.w + 40; y = U.r(arena.y, arena.y + arena.h); }
    else if (corner === 2) { x = U.r(arena.x, arena.x + arena.w); y = arena.y + arena.h + 40; }
    else { x = arena.x - 40; y = U.r(arena.y, arena.y + arena.h); }

    if (tip === 'yelpaze') {
        botEnemies.push({
            x, y, radius: 18, tip: 'yelpaze',
            hp: 8, maxHp: 8,
            speed: 1.0,
            idealDistance: 180,
            lastShot: Math.random() * 5500,
            shootInterval: 5500,
            charging: false,
            icerde: false
        });
    } else {
        botEnemies.push({
            x, y, radius: 18, tip: 'mor',
            hp: 4, maxHp: 4,
            speed: 0.9,
            idealDistance: 220,
            lastShot: Math.random() * 2500,
            shootInterval: 2500 + (Math.random() * 400 - 200),
            icerde: false
        });
    }
}

// Bot güncelleme - 2 fazlı davranış
function botGuncelle(enemy, deltaTime, timestamp) {
    const dist = U.d(enemy.x, enemy.y, player.x, player.y);
    const angle = U.a(enemy.x, enemy.y, player.x, player.y);

    // Kutu içinde mi?
    const kutuIci = enemy.x > arena.x + 10 && enemy.x < arena.x + arena.w - 10 &&
                    enemy.y > arena.y + 10 && enemy.y < arena.y + arena.h - 10;

    // ============================================
    // FAZ 1: KUTUYA GİRİŞ
    // ============================================
    if (!enemy.icerde) {
        const merkezX = arena.x + arena.w / 2;
        const merkezY = arena.y + arena.h / 2;
        const aciMerkez = U.a(enemy.x, enemy.y, merkezX, merkezY);

        enemy.x += Math.cos(aciMerkez) * enemy.speed * deltaTime;
        enemy.y += Math.sin(aciMerkez) * enemy.speed * deltaTime;

        // Kutuya girdi mi?
        if (kutuIci) {
            enemy.icerde = true;
            efektSokDalgasi(enemy.x, enemy.y, enemy.tip === 'yelpaze' ? colors.cyan : colors.purple);
            playSound(500, 0.15, 'triangle');
        }
        return;
    }

    // ============================================
    // FAZ 2: İÇERDE SALDIRI
    // ============================================
    // Mesafe koru
    if (dist > enemy.idealDistance + 20) {
        enemy.x += Math.cos(angle) * enemy.speed * deltaTime;
        enemy.y += Math.sin(angle) * enemy.speed * deltaTime;
    } else if (dist < enemy.idealDistance - 20) {
        enemy.x -= Math.cos(angle) * enemy.speed * deltaTime;
        enemy.y -= Math.sin(angle) * enemy.speed * deltaTime;
    }

    // Kutu içinde kal
    enemy.x = Math.max(arena.x + enemy.radius, Math.min(arena.x + arena.w - enemy.radius, enemy.x));
    enemy.y = Math.max(arena.y + enemy.radius, Math.min(arena.y + arena.h - enemy.radius, enemy.y));

    // Ateş
    if (enemy.tip === 'yelpaze') {
        const kalan = enemy.shootInterval - (timestamp - enemy.lastShot);
        enemy.charging = kalan < 500 && kalan > 0;

        if (timestamp - enemy.lastShot > enemy.shootInterval) {
            enemy.lastShot = timestamp;
            // 5 açılı yelpaze (90°)
            const acilar = [-U.P / 4, -U.P / 8, 0, U.P / 8, U.P / 4];
            for (const a of acilar) {
                const finalAngle = angle + a;
                enemyBullets.push({
                    x: enemy.x, y: enemy.y,
                    vx: Math.cos(finalAngle) * 3.0,
                    vy: Math.sin(finalAngle) * 3.0,
                    radius: 6, type: 'yelpaze'
                });
            }
            efektDogusDalgasi(enemy.x, enemy.y, colors.cyan);
            playSound(300, 0.15, 'triangle');
            screenShake = 5;
        }
    } else {
        if (timestamp - enemy.lastShot > enemy.shootInterval) {
            enemy.lastShot = timestamp;
            enemyBullets.push({
                x: enemy.x, y: enemy.y,
                vx: Math.cos(angle) * 3.5,
                vy: Math.sin(angle) * 3.5,
                radius: 7, type: 'bot'
            });
            playSound(250, 0.08, 'triangle');
        }
    }

    // Temas hasarı
    if (dist < enemy.radius + player.radius) {
        if (player.invulnerableTimer <= 0) {
            handleDamage();
            enemy.x -= Math.cos(angle) * 25;
            enemy.y -= Math.sin(angle) * 25;
        }
    }
}

// Bot dalgası başlat
function startBotWave() {
    gameState.state = 'botDalga';
    gameState.waveClearPending = false;
    gameState.waveClearDelay = 0;
    botEnemies = [];
    gameState.toplamDalga++;

    const idx = gameState.botWaveIndex;
    let morSayi, yelpazeSayi;
    if (idx === 1) { morSayi = 1; yelpazeSayi = 0; }
    else if (idx === 2) { morSayi = 1; yelpazeSayi = 1; }
    else { morSayi = 2; yelpazeSayi = 1; }

    for (let i = 0; i < morSayi; i++) botSpawn('mor');
    for (let i = 0; i < yelpazeSayi; i++) botSpawn('yelpaze');

    setDialogMessage(`WAVE ${idx}/3`);
    setBotFace(colors.red, '⚠️');
    updateWaveDisplay();
}