const HATE_SPEECH_KEYWORDS = [
  "nazi",
  "neonazi",
  "judensau",
  "zigeuner",
  "nigger",
  "kanake",
  "hurensohn",
  "miststück",
  "faggot",
  "retard",
  "tranny",
  "chink",
  "spic",
  "umbringen",
  "ermorden",
  "abschlachten",
  "aufhängen",
  "erschießen",
  "vergewaltigen",
  "terrorist",
  "schwuchtel",
  "arschloch",
  "fick dich",
  "du opfer",
  "wixxer",
  "bastard",
  "verpiss dich",
  "halt die fresse",
  "muschilecker",
  "drecksau",
  "fotze",
  "wichser",
  "missgeburt",
  "kackbratze",
  "hohlbirne",
  "dummfick",
  "nuttensohn",
];

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function checkHateSpeech(text: string): { flagged: boolean; detectedWord?: string } {
  for (const keyword of HATE_SPEECH_KEYWORDS) {
    const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, "i");
    if (regex.test(text)) {
      return { flagged: true, detectedWord: keyword };
    }
  }
  return { flagged: false };
}
