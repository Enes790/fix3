// ============================================================
// QUESTIONS.JS - İngilizce sorular (5 tense x 5 soru)
// ============================================================
window.dosyaYuklendi('questions');

const sorular = {
    presentSimple: [
        { text: "She ___ to school every day.", options: ["go", "goes", "going", "went"], correct: 1 },
        { text: "They ___ football on Sundays.", options: ["plays", "playing", "play", "played"], correct: 2 },
        { text: "He ___ coffee every morning.", options: ["drink", "drinks", "drinking", "drank"], correct: 1 },
        { text: "We ___ in Istanbul.", options: ["lives", "living", "live", "lived"], correct: 2 },
        { text: "My sister ___ English very well.", options: ["speak", "speaks", "speaking", "spoke"], correct: 1 }
    ],
    presentContinuous: [
        { text: "She ___ TV right now.", options: ["watch", "watches", "is watching", "watched"], correct: 2 },
        { text: "They ___ in the park at the moment.", options: ["play", "plays", "are playing", "played"], correct: 2 },
        { text: "I ___ for the bus now.", options: ["wait", "waits", "am waiting", "waited"], correct: 2 },
        { text: "Look! The cat ___ on the sofa.", options: ["sleep", "sleeps", "is sleeping", "slept"], correct: 2 },
        { text: "We ___ dinner right now.", options: ["cook", "cooks", "are cooking", "cooked"], correct: 2 }
    ],
    pastSimple: [
        { text: "They ___ to Paris last year.", options: ["go", "goes", "went", "going"], correct: 2 },
        { text: "She ___ a beautiful song yesterday.", options: ["sing", "sings", "sang", "singing"], correct: 2 },
        { text: "I ___ my homework last night.", options: ["do", "does", "did", "doing"], correct: 2 },
        { text: "We ___ pizza for dinner yesterday.", options: ["eat", "eats", "ate", "eating"], correct: 2 },
        { text: "He ___ his keys this morning.", options: ["lose", "loses", "lost", "losing"], correct: 2 }
    ],
    presentPerfect: [
        { text: "I have never ___ sushi before.", options: ["eat", "ate", "eaten", "eating"], correct: 2 },
        { text: "She has just ___ home.", options: ["arrive", "arrived", "arriving", "arrives"], correct: 1 },
        { text: "They have already ___ the film.", options: ["see", "saw", "seen", "seeing"], correct: 2 },
        { text: "We ___ lived here for 5 years.", options: ["has", "have", "had", "having"], correct: 1 },
        { text: "He hasn't ___ his work yet.", options: ["finish", "finishes", "finished", "finishing"], correct: 2 }
    ],
    future: [
        { text: "We ___ visit grandma tomorrow.", options: ["will", "are", "did", "have"], correct: 0 },
        { text: "She ___ be a doctor when she grows up.", options: ["is", "will", "was", "has"], correct: 1 },
        { text: "I think it ___ rain tonight.", options: ["will", "is", "was", "did"], correct: 0 },
        { text: "They ___ going to travel next summer.", options: ["is", "am", "are", "be"], correct: 2 },
        { text: "He ___ call you later.", options: ["will", "is", "did", "was"], correct: 0 }
    ]
};

const tenseSirasi = [
    { key: 'presentSimple', label: 'PRESENT SIMPLE' },
    { key: 'presentContinuous', label: 'PRESENT CONTINUOUS' },
    { key: 'pastSimple', label: 'PAST SIMPLE' },
    { key: 'presentPerfect', label: 'PRESENT PERFECT' },
    { key: 'future', label: 'FUTURE' }
];