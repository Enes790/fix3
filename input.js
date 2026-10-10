// ============================================================
// INPUT.JS - Klavye + Joystick kontrolü
// ============================================================
window.dosyaYuklendi('input');

// Klavye tuşları
let keyboardKeys = {};

// Klavye olayları
window.addEventListener('keydown', (e) => {
    keyboardKeys[e.key.toLowerCase()] = true;
    if (e.key !== 'F12') e.preventDefault();
});
window.addEventListener('keyup', (e) => keyboardKeys[e.key.toLowerCase()] = false);

// ============================================================
// JOYSTICK (Mobil)
// ============================================================
const joystickElement = document.getElementById('joystick');
const joystickKnob = document.getElementById('joystickKnob');

function updateJoystick(touch) {
    let dx = touch.clientX - joystickState.centerX;
    let dy = touch.clientY - joystickState.centerY;
    const distance = U.d(0, 0, dx, dy);
    if (distance > 55) {
        dx = (dx / distance) * 55;
        dy = (dy / distance) * 55;
    }
    joystickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
    joystickState.x = dx / 55;
    joystickState.y = dy / 55;
}

joystickElement.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const rect = joystickElement.getBoundingClientRect();
    joystickState.centerX = rect.left + rect.width / 2;
    joystickState.centerY = rect.top + rect.height / 2;
    joystickState.id = e.changedTouches[0].identifier;
    joystickState.active = true;
    updateJoystick(e.changedTouches[0]);
}, { passive: false });

window.addEventListener('touchmove', (e) => {
    if (!joystickState.active) return;
    for (const touch of e.changedTouches) {
        if (touch.identifier === joystickState.id) updateJoystick(touch);
    }
}, { passive: false });

window.addEventListener('touchend', (e) => {
    for (const touch of e.changedTouches) {
        if (touch.identifier === joystickState.id) {
            joystickState.active = false;
            joystickState.x = 0;
            joystickState.y = 0;
            joystickKnob.style.transform = 'translate(0, 0)';
        }
    }
});

// Mouse ile joystick (PC test için)
joystickElement.addEventListener('mousedown', (e) => {
    const rect = joystickElement.getBoundingClientRect();
    joystickState.centerX = rect.left + rect.width / 2;
    joystickState.centerY = rect.top + rect.height / 2;
    joystickState.id = 'mouse';
    joystickState.active = true;
    updateJoystick({ clientX: e.clientX, clientY: e.clientY });
});

window.addEventListener('mousemove', (e) => {
    if (joystickState.active && joystickState.id === 'mouse') {
        updateJoystick({ clientX: e.clientX, clientY: e.clientY });
    }
});

window.addEventListener('mouseup', () => {
    if (joystickState.id === 'mouse') {
        joystickState.active = false;
        joystickState.x = 0;
        joystickState.y = 0;
        joystickKnob.style.transform = 'translate(0, 0)';
    }
});

// Pencere boyutlandırma
window.addEventListener('resize', () => {
    if (typeof resizeCanvas === 'function') resizeCanvas();
});