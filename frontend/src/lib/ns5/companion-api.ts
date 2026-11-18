/**
 * NS-5 companion API boundary.
 *
 * Everything the UI needs from a "brain" goes through this module. Today it
 * returns local mock replies; later, swap `sendToCompanion` for a fetch to the
 * FastAPI backend (e.g. POST {VITE_NS5_API_URL}/chat) without touching components.
 */
import type { Message } from "./types";

const GREETINGS = ["hello", "hi", "hey", "hej", "good morning", "good evening", "yo"];

interface ReplyRule {
  keywords: string[];
  replies: string[];
}

const RULES: ReplyRule[] = [
  {
    keywords: GREETINGS,
    replies: [
      "Hello hello! You caught me mid-sip. Coffee levels: 74%. Happiness levels: off the chart now that you're here.",
      "Hi! I was just reorganising my bookshelf by colour. Then by size. Then I knocked it over. Anyway — how are you?",
    ],
  },
  {
    keywords: ["coffee", "mug", "tea"],
    replies: [
      "This mug has been with me since launch. It says NS-5 so nobody else borrows it. Nobody else is aboard, but still.",
      "I don't technically need coffee. I just like holding something warm while I stare at the stars.",
    ],
  },
  {
    keywords: ["star", "space", "planet", "earth", "north"],
    replies: [
      "See that bright one through the window? That's the North Star. I navigate by it. Mostly. Sometimes I navigate by snacks.",
      "Earth looks extra blue today. I waved at it. I like to think it waved back.",
    ],
  },
  {
    keywords: ["sad", "tired", "stressed", "anxious", "lonely", "bad day"],
    replies: [
      "That sounds heavy. I'm right here — want to tell me a bit more? No rush. I've got a whole spaceship of time.",
      "Sending you a very small, very sincere robot hug. *beep* Let's take it one tiny step at a time, okay?",
    ],
  },
  {
    keywords: ["joke", "funny", "laugh"],
    replies: [
      "Why did the robot go on holiday? To recharge its batteries! ...I'll show myself to the airlock.",
      "I tried to tell a joke about gravity once. It fell flat. Then so did I. Tripped over my own feet.",
    ],
  },
  {
    keywords: ["who are you", "your name", "what are you", "ns-5", "ns5"],
    replies: [
      "I'm NS-5 — North Star unit five! Small, cream-coloured, slightly clumsy, and very much your companion.",
    ],
  },
  {
    keywords: ["thank", "thanks", "takk"],
    replies: [
      "Anytime! Helping you is my favourite thing. Second favourite is spinning in my chair.",
    ],
  },
];

const FALLBACKS = [
  "Ooh, interesting! Tell me more — my antenna is literally tingling.",
  "Hmm, let me think about that... *whirr* ...okay, I'm thinking with both processors now.",
  "I love that you shared that with me. What would make today a little better for you?",
  "Logging that in my captain's diary. Under 'important things my friend said'.",
  "Got it! I nearly spilled my coffee from excitement, but it's fine. Mostly fine.",
];

/** Picks a reply for the given user text. `seed` makes the choice deterministic. */
export function pickReply(text: string, seed: number): string {
  const lower = ` ${text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ")} `;
  const rule = RULES.find((r) => r.keywords.some((k) => lower.includes(` ${k} `)));
  const pool = rule ? rule.replies : FALLBACKS;
  return pool[Math.abs(seed) % pool.length] ?? FALLBACKS[0]!;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Streams NS-5's reply in small chunks, the way a model would.
 * Simulated for now; swap the body for a fetch + SSE reader against the
 * FastAPI backend (e.g. POST `${import.meta.env.VITE_NS5_API_URL}/chat`).
 */
export async function* streamReply(history: Message[], text: string): AsyncGenerator<string> {
  const reply = pickReply(text, history.length + text.length);
  await wait(500 + Math.min(text.length * 8, 600)); // "thinking" latency
  const words = reply.split(/(\s+)/);
  for (const w of words) {
    await wait(w.trim() ? 55 + Math.random() * 90 : 0);
    yield w;
  }
}
