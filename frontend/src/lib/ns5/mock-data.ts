import type { Message, Session } from "./types";

let counter = 0;
export function makeId(prefix = "id"): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter.toString(36)}`;
}

export const WELCOME_TEXT =
  "Oh! A visitor! Welcome aboard the North Star. I'm NS-5. I just made coffee — well, I made a mess, then coffee. What's on your mind?";

export function welcomeMessage(at = Date.now()): Message {
  return { id: makeId("m"), role: "ns5", text: WELCOME_TEXT, createdAt: at };
}

// Fixed reference time keeps server and browser renders identical.
const BASE = Date.UTC(2026, 10, 10, 16, 0, 0);
const HOUR = 3_600_000;

export const MOCK_SESSIONS: Session[] = [
  {
    id: "s-stargazing",
    title: "Stargazing after midnight",
    updatedAt: BASE - 3 * HOUR,
    messages: [
      { id: "m-a1", role: "ns5", text: WELCOME_TEXT, createdAt: BASE - 3.2 * HOUR },
      {
        id: "m-a2",
        role: "user",
        text: "Which star is the brightest from your window?",
        createdAt: BASE - 3.1 * HOUR,
      },
      {
        id: "m-a3",
        role: "ns5",
        text: "The North Star, of course! Though Sirius keeps trying to outshine it. Very dramatic star, Sirius.",
        createdAt: BASE - 3 * HOUR,
      },
    ],
  },
  {
    id: "s-plant",
    title: "Naming the cabin plant",
    updatedAt: BASE - 26 * HOUR,
    messages: [
      {
        id: "m-b1",
        role: "user",
        text: "Does your plant have a name?",
        createdAt: BASE - 26.2 * HOUR,
      },
      {
        id: "m-b2",
        role: "ns5",
        text: "Her name is Fernanda. She's the only crew member who never complains about my singing.",
        createdAt: BASE - 26 * HOUR,
      },
    ],
  },
  {
    id: "s-monday",
    title: "Surviving a Monday",
    updatedAt: BASE - 72 * HOUR,
    messages: [
      { id: "m-c1", role: "user", text: "Mondays are rough.", createdAt: BASE - 72.1 * HOUR },
      {
        id: "m-c2",
        role: "ns5",
        text: "Agreed. On Mondays I walk into the door frame at least twice. Let's get through this one together.",
        createdAt: BASE - 72 * HOUR,
      },
    ],
  },
];

export function createSession(at = Date.now()): Session {
  return { id: makeId("s"), title: "New session", updatedAt: at, messages: [welcomeMessage(at)] };
}

/** Derives a short sidebar title from the first user message. */
export function titleFrom(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > 32 ? `${clean.slice(0, 31).trimEnd()}…` : clean || "New session";
}
