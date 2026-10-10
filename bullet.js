// ============================================================
// BULLET.JS - Mermi hareketi + çarpışma
// ============================================================
window.dosyaYuklendi('bullet');

function mermiGuncelle(deltaTime) {
    // ============================================
    // OYUNCU MERMİLERİ
    // ============================================
    for (let i = playerBullets.length - 1; i >= 0; i--) {
        const bullet = playerBullets[i];
        bullet.x += bullet.vx * deltaTime;
        bullet.y += bullet.vy * deltaTime;
        bullet.life -= deltaTime;

        // Boss hedefi
        if (bullet.target === 'boss') {
            if (U.d(bullet.x, bullet.y, screenWidth / 2, screenHeight * 0.14) < bullet.radius + 45) {
                if (boss.state === 'kirilgan') {
                    boss.hp--;
                    createParticles(bullet.x, bullet.y, colors.gold, 8);
                    efektCarpmaKivilcimi(bullet.x, bullet.y, colors.gold);
                    playSound(500, 0.1, 'square');
                    gameState.score += 5;
                    updateScoreDisplay();
                    if (boss.hp <= 0) triggerBossDeath();
                }
                playerBullets.splice(i, 1);
                continue;
            }
            if (bullet.life <= 0) playerBullets.splice(i, 1);
            continue;
        }

        // Bot hedefi
        if (bullet.life <= 0) { playerBullets.splice(i, 1); continue; }
        let hit = false;
        for (let j = botEnemies.length - 1; j >= 0; j--) {
            const enemy = botEnemies[j];
            if (U.d(bullet.x, bullet.y, enemy.x, enemy.y) < bullet.radius + enemy.radius) {
                enemy.hp--;
                createParticles(bullet.x, bullet.y, colors.gold, 5);
                efektCarpmaKivilcimi(bullet.x, bullet.y, colors.gold);
                playerBullets.splice(i, 1);
                hit = true;
                if (enemy.hp <= 0) {
                    gameState.score += 20;
                    createParticles(enemy.x, enemy.y, enemy.tip === 'yelpaze' ? colors.cyan : colors.red, 12);
                    efektSokDalgasi(enemy.x, enemy.y, enemy.tip === 'yelpaze' ? colors.cyan : colors.purple);
                    botEnemies.splice(j, 1);
                    updateScoreDisplay();
                    playSound(400, 0.1, 'triangle');
                }
                break;
            }
        }
        if (hit) continue;
    }

    // ============================================
    // LAZER
    // ============================================
    for (let i = lasers.length - 1; i >= 0; i--) {
        const laser = lasers[i];
        if (laser.state === 'warning') {
            laser.warningTimer -= deltaTime * 16.67;
            if (laser.warningTimer <= 0) {
                laser.state = 'active';
                screenShake = 7;
                playSound(700, 0.15, 'sawtooth');
            }
        } else if (laser.state === 'active') {
            laser.activeTimer -= deltaTime * 16.67;
            const dist = getDistanceFromLine(player.x, player.y, laser.x1, laser.y1, laser.x2, laser.y2);
            if (dist < player.radius + laser.width / 2) handleDamage();
            if (laser.activeTimer <= 0) lasers.splice(i, 1);
        }
    }

    // ============================================
    // DÜŞMAN MERMİLERİ
    // ============================================
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];
        bullet.x += bullet.vx * deltaTime;
        bullet.y += bullet.vy * deltaTime;

        // BÜYÜK (mouse) mermi - sekmeli
        if (bullet.type === 'buyuk') {
            // Çok uzaklaştıysa sil
            if (U.d(bullet.x, bullet.y, screenWidth / 2, screenHeight / 2) > 2500) {
                enemyBullets.splice(i, 1);
                continue;
            }

            if (bullet.isStopped) {
                bullet.stopTimer -= deltaTime * 16.67;
                if (bullet.stopTimer <= 0) {
                    // 3 küçük mermiye bölün
                    for (let k = 0; k < 3; k++) {
                        const angle = U.P / 2 + (k - 1) * (U.P / 6);
                        enemyBullets.push({
                            x: bullet.x, y: bullet.y,
                            vx: Math.cos(angle) * 6.5,
                            vy: Math.sin(angle) * 6.5,
                            radius: 7, type: 'kucuk'
                        });
                    }
                    createParticles(bullet.x, bullet.y, colors.orange, 12);
                    efektSokDalgasi(bullet.x, bullet.y, colors.orange);
                    efektYildizPatlamasi(bullet.x, bullet.y);
                    playSound(350, 0.1, 'square');
                    screenShake = 10;
                    enemyBullets.splice(i, 1);
                    continue;
                }
            } else {
                // Arenaya girdi mi?
                if (!bullet.isInside &&
                    bullet.x > arena.x + bullet.radius && bullet.x < arena.x + arena.w - bullet.radius &&
                    bullet.y > arena.y + bullet.radius && bullet.y < arena.y + arena.h - bullet.radius) {
                    bullet.isInside = true;
                    const speed = U.d(0, 0, bullet.vx, bullet.vy);
                    const angle = Math.atan2(bullet.vy, bullet.vx) + (Math.random() - 0.5) * 0.6;
                    bullet.vx = Math.cos(angle) * speed;
                    bullet.vy = Math.sin(angle) * speed;
                }
                // İçerdeyse sek
                if (bullet.isInside) {
                    let bounced = false;
                    if (bullet.x - bullet.radius <= arena.x && bullet.vx < 0) { bullet.vx = -bullet.vx; bullet.x = arena.x + bullet.radius; bounced = true; }
                    if (bullet.x + bullet.radius >= arena.x + arena.w && bullet.vx > 0) { bullet.vx = -bullet.vx; bullet.x = arena.x + arena.w - bullet.radius; bounced = true; }
                    if (bullet.y - bullet.radius <= arena.y && bullet.vy < 0) { bullet.vy = -bullet.vy; bullet.y = arena.y + bullet.radius; bounced = true; }
                    if (bullet.y + bullet.radius >= arena.y + arena.h && bullet.vy > 0) { bullet.vy = -bullet.vy; bullet.y = arena.y + arena.h - bullet.radius; bounced = true; }

                    if (bounced) {
                        bullet.bounces++;
                        createParticles(bullet.x, bullet.y, colors.orange, 4);
                        playSound(280, 0.06, 'square');
                        bullet.vx *= 0.9;
                        bullet.vy *= 0.9;
                        if (bullet.bounces >= 5) {
                            bullet.isStopped = true;
                            bullet.stopTimer = 500;
                            bullet.vx = bullet.vy = 0;
                        }
                    }
                }
            }

            if (U.d(bullet.x, bullet.y, player.x, player.y) < bullet.radius + player.radius) {
                handleDamage();
                createParticles(bullet.x, bullet.y, colors.orange, 10);
                enemyBullets.splice(i, 1);
                continue;
            }
            continue;
        }

        // Diğer mermiler - ekran dışına çıktıysa sil
        if (bullet.x < arena.x - 80 || bullet.x > arena.x + arena.w + 80 ||
            bullet.y < arena.y - 80 || bullet.y > arena.y + arena.h + 80) {
            enemyBullets.splice(i, 1);
            continue;
        }
        if (U.d(bullet.x, bullet.y, player.x, player.y) < bullet.radius + player.radius) {
            handleDamage();
            enemyBullets.splice(i, 1);
            continue;
        }
    }
}