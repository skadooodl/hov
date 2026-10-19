// Keep SHUFFLE_QUESTIONS false so the supplied meme rounds stay in order.
const SHUFFLE_QUESTIONS = false;

const QUESTIONS = {
  easy: [
    {
      type: "video",
      title: "Ariana Grindr",
      cardImage: "easy-1-card.jpe",
      heading: "FINISH THE LINE:",
      prompt: "Hey, kamusta po kayo?\n____________?",
      answer: "K LANG! GREEDYYYY!",
      accepted: []
    },
    {
      type: "video",
      title: "KARLA KARLA!",
      cardImage: "easy-2-card.jpeg",
      prompt: "KARLA ESTRADA IS ALSO KNOWN AS THE _______?",
      answer: "Asia’s Echo System",
      accepted: ["Echo Queen"]
    },
    {
      type: "video",
      title: "Latina's",
      cardImage: "easy-3-card.jpe",
      heading: "WHAT’S THE NEXT LINE",
      prompt: "Grabe ka naman be’... Hanep sa ganda oh\n_____________? YESSS!",
      answer: "ITUTOK MO PA!",
      accepted: []
    },
    {
      type: "video",
      title: "Homo-Soldier",
      cardImage: "easy-4-card.jpe",
      heading: "WHAT’S THE NEXT LINE",
      prompt: "Bakit gusto mo maging sundalo?\n____________?",
      answer: "Hulihin ko mga bakla",
      accepted: []
    },
    {
      type: "video",
      title: "Siomai Rice",
      cardImage: "easy-5-card.jpe",
      heading: "WHAT’S THE NEXT LINE",
      prompt: "Mag k-kfc ako…\n_________________?",
      answer: "suntukan tayo right neow!",
      accepted: []
    },
    {
      type: "video",
      title: "POGO",
      cardImage: "easy-6-card.jpg",
      heading: "TELL US ABOUT YOUR CHILDHOOD",
      prompt: "Your Honor,\n____________________?",
      answer: "lumaki po ako sa farm",
      accepted: []
    }
  ],
  average: [
    {
      type: "video",
      title: "Suicide Squabs",
      cardImage: "ave-1-card.jpe",
      heading: "PARANG JOKER AT HARLEY QUEEN ANG GALAWAN",
      prompt: "Klong halika\n__.__.__.__.__.___! ____________________?\nLayo! anlayo bih",
      answer: "hA hA hA hA hA charot!\nDo you wanna play with me?",
      accepted: []
    },
    {
      type: "video",
      title: "Rimmer Dad",
      cardImage: "ave-2-card.jpe",
      heading: "FINISH THE LINE",
      prompt: "Ang gusto ko lang malaman, _________________?\nBA’T AKO BIBIGYAN NG CUP NOODLES..",
      answer: "ang order ko ay bulalo",
      accepted: []
    },
    {
      type: "video",
      title: "Ki'board",
      cardImage: "ave-3-card.jpe",
      heading: "FINISH THE LINE",
      prompt: "Keyboard ka ba? Kase.. type kitugh,\n__________!, ___________!, _______________!.",
      answer: "pakak! arayq, tarantadooo!",
      accepted: []
    },
    {
      type: "video",
      title: "Broke Diva",
      cardImage: "ave-4-card.jpg",
      heading: "FINISH THE LINE",
      prompt: "Kailangan po namin ng 88.. ________________________?",
      answer: "88 million million peso dollar dolar 600 peso",
      accepted: []
    },
    {
      type: "video",
      title: "NIM LAI LUN",
      cardImage: "ave-5-card.jpg",
      prompt: "WHATTT?, ____________!",
      answer: "WATAWAT!",
      accepted: []
    },
    {
      type: "video",
      title: "Lose Streak",
      cardImage: "ave-6-card.jpg",
      heading: "FILL IN THE BLANKS",
      prompt: "Kung ayaw niyo makipag laro sakin, edi wag! mamatay na kayong lahat!\n_________________________, ____________________________,\nMAMATAY NA KAYONG LAHAT!",
      answer: "pati nanay at tatay niyo! pati mga alaga niyo sa bahay niyo!",
      accepted: []
    }
  ],
  hard: [
    {
      type: "video",
      title: "Ma! Anong Ulam?",
      cardImage: "hard-1-card.png",
      heading: "FINISH THE LINE",
      prompt: "Ma, ma anong ulam?\nGiniling\n__________________________?",
      answer: "eto oh giniling, pukenginamo nak!",
      accepted: []
    },
    {
      type: "video",
      title: "Squammy",
      cardImage: "hard-2-card.jpe",
      heading: "FINISH THE LINE",
      prompt: "Hi sizst, bago ka manlaet.. dapat siguraduhin mo munang\n_________________, ________________, at higit sa lahat _________________?",
      answer: "kulay rainbow ang ihi mo, mabango tae mo, straight ang bulbol mo",
      accepted: []
    },
    {
      type: "video",
      title: "Bakla, Salot!",
      cardImage: "hard-3-card.jpg",
      heading: "FINISH THE LINE",
      prompt: "Bakit? Sino ka ba? Sino kabang nambabasher?\n_______________?! ______________________, at ______________________.",
      answer: "excuse me!? hindi moko kilala, at hindi moko kaano-ano",
      accepted: []
    }
  ]
};

// Rounds, prizes and timer durations are configured in one place for easy host edits.
const MODE_CONFIG = {
  easy: { label: "EASY", rounds: 6, prize: 20, duration: 30 },
  average: { label: "AVERAGE", rounds: 6, prize: 30, duration: 20 },
  hard: { label: "HARD", rulesLabel: "HARDCORE", rounds: 3, prize: 50, duration: 15 }
};
