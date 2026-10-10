// ============================================================
// CONFIG.JS - Tüm sabitler ve replik havuzu
// ============================================================
window.yuklenenDosyalar.push('config');
console.log("[✓] config.js yüklendi");

// Renk paleti - tüm oyunun renkleri
const colors = {
    gold:'#f1c40f',
    red:'#e74c3c',
    green:'#2ecc71',
    purple:'#9b59b6',
    orange:'#ff6b35',
    yellow:'#ffcc00',
    gray:'#555',
    cyan:'#00d2d3',
    blue:'#3498db'
};

// Boss kişilik - şakacı + övünen + bozuk bilgisayar
const bossReplikleri = {
    karsilama: [
        "Hello... who am I? System... broken!",
        "Yine mi sen? En sevdiğim kurban!",
        "Error. Error. Help... please...",
        "Beni yenebileceğini mi sandın? Komik!",
        "W-w-what is happening to me?!"
    ],
    kirilgan: [
        "Vur hadi, vurabilirsin!",
        "System... recovering... 10%... 20%...",
        "Hadi, bir şans daha!",
        "Please... hurry... I can't hold!"
    ],
    fazAtla: [
        "Lazer keyfi başlıyor!",
        "Bak bakalım şimdi ne yapacağım!",
        "Memory... corrupted. Who are you?",
        "Bu sadece ısınma turu!"
    ],
    hasarYedi: [
        "Aa, canım yandı! Şaka şaka!",
        "İyi vuruş! Ama yeterli değil!",
        "ERROR! ERROR! Try again!",
        "Hile! Hile yapıyorsun!"
    ],
    ultiYedi: [
        "Hile! Hile!",
        "No... no... that's wrong!",
        "Bunu ödeyeceksin!",
        "Hey! Kurallara uy!"
    ],
    olum: [
        "System... failed. Not your fault.",
        "İmkansız! Ben... ben yenilmezim!",
        "Goodbye... User... I tried...",
        "Bu son değil, geri döneceğim!"
    ]
};

// Rastgele replik seç
function rastgeleReplik(kategori) {
    const havuz = bossReplikleri[kategori];
    return havuz[Math.floor(Math.random() * havuz.length)];
}