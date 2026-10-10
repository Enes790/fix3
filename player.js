// ============================================================
// PLAYER.JS - Oyuncu (teknisyen) hareketi + ateş
// ============================================================
window.dosyaYuklendi('player');

// Oyuncu state
let player = {
    x: 0, y: 0,
    radius: 18,
    speed: 3.6,
    hp: 5, maxHp: 5,
    invulnerableTimer: 0
};

// Oyuncu hareketi
function oyuncuGuncelle(deltaTime) {
    let moveX = joystickState.active ? joystickState.x : 0;
    let moveY = joystickState.active ? joystickState.y : 0;
    if (keyboardKeys['w'] || keyboardKeys['arrowup']) moveY--;
    if (keyboardKeys['s'] || keyboardKeys['arrowdown']) moveY++;
    if (keyboardKeys['a'] || keyboardKeys['arrowleft']) moveX--;
    if (keyboardKeys['d'] || keyboardKeys['arrowright']) moveX++;

    const length = U.d(0, 0, moveX, moveY);
    if (length > 1) { moveX /= length; moveY /= length; }

    player.x = Math.max(arena.x + player.radius,
                Math.min(arena.x + arena.w - player.radius,
                    player.x + moveX * player.speed * deltaTime));
    player.y = Math.max(arena.y + player.radius,
                Math.min(arena.y + arena.h - player.radius,
                    player.y + moveY * player.speed * deltaTime));

    if (player.invulnerableTimer > 0) player.invulnerableTimer -= deltaTime * 16.67;
}

// Hasar alma
function handleDamage() {
    if (player.invulnerableTimer > 0) return;

    if (gameState.extraHeart > 0) {
        gameState.extraHeart = 0;
        gameState.gauge = 0;
        gameState.ultiReady = false;
        player.invulnerableTimer = 1200;
        screenShake = 14;
        playSound(150, 0.2, 'sawtooth');
        updateHealthBar();
        updateUltiButton();
        setDialogMessage('Bonus kalkan kırıldı!');
        return;
    }

    player.hp--;
    player.invulnerableTimer = 1200;
    screenShake = 14;
    playSound(150, 0.2, 'sawtooth');
    updateHealthBar();
    if (player.hp <= 0) finishGame(false);
}

// Oyuncu ateş
function firePlayerBullet() {
    // Boss kırılgansa boss'a
    if (gameState.state === 'bossSavasi' && boss.state === 'kirilgan' && boss.hp > 0) {
        const angle = U.a(player.x, player.y, screenWidth / 2, screenHeight * 0.14);
        playerBullets.push({
            x: player.x, y: player.y,
            vx: Math.cos(angle) * 11,
            vy: Math.sin(angle) * 11,
            radius: 5, life: 250,
            target: 'boss'
        });
        efektNamluAtesi(player.x, player.y, angle, colors.gold);
        playSound(600, 0.05, 'square');
        return;
    }

    // Bot dalgası - sadece kutunun içindekilere
    if (gameState.state === 'botDalga' && botEnemies.length > 0) {
        const hedefler = botEnemies.filter(b => b.icerde);
        if (hedefler.length === 0) return;

        let closestEnemy = hedefler[0];
        let minDistance = Infinity;
        for (const enemy of hedefler) {
            const dist = U.d(enemy.x, enemy.y, player.x, player.y);
            if (dist < minDistance) { minDistance = dist; closestEnemy = enemy; }
        }

        const angle = U.a(player.x, player.y, closestEnemy.x, closestEnemy.y);
        playerBullets.push({
            x: player.x, y: player.y,
            vx: Math.cos(angle) * 11,
            vy: Math.sin(angle) * 11,
            radius: 5, life: 90,
            target: 'bot'
        });
        efektNamluAtesi(player.x, player.y, angle, colors.gold);
        playSound(600, 0.05, 'square');
    }
}