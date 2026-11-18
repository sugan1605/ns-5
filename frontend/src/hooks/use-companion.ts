import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { streamReply } from "@/lib/ns5/companion-api";
import { createSession, makeId, MOCK_SESSIONS, titleFrom } from "@/lib/ns5/mock-data";
import type { Message, Session } from "@/lib/ns5/types";
import { world, useCompanionStore } from "@/ns5/runtime";
import { ask, finishReply } from "@/ns5/sim/brain";

// Fixed timestamp keeps the server render and browser render identical.
const CURRENT_SESSION_AT = Date.UTC(2026, 10, 10, 17, 0, 0);
const REVEAL_INTERVAL = 40; // ms per reveal tick while NS-5 types
const REVEAL_CHARS = 2;

interface PendingReply {
  sessionId: string;
  messageId: string | null;
  buffer: string;
  shown: number;
  done: boolean;
}

/**
 * Conversation state + the bridge to NS-5's brain:
 * send → brain notices and walks to his desk → reply text is revealed only
 * while he is seated and typing → brain is told when the reply is complete.
 */
export function useCompanion() {
  const [sessions, setSessions] = useState<Session[]>(() => [
    { ...createSession(CURRENT_SESSION_AT), id: "s-current" },
    ...MOCK_SESSIONS,
  ]);
  const [activeId, setActiveId] = useState("s-current");
  const [busy, setBusy] = useState(false);
  const pending = useRef<PendingReply | null>(null);
  const sessionsRef = useRef(sessions);
  sessionsRef.current = sessions;
  const phase = useCompanionStore((s) => s.phase);

  const active = useMemo(
    () => sessions.find((s) => s.id === activeId) ?? sessions[0]!,
    [sessions, activeId],
  );

  const patchMessage = (sessionId: string, messageId: string, patch: Partial<Message>) =>
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? { ...s, messages: s.messages.map((m) => (m.id === messageId ? { ...m, ...patch } : m)) }
          : s,
      ),
    );

  // Reveal the buffered reply only while NS-5 is actually typing at his desk.
  useEffect(() => {
    if (phase !== "typing") return;
    const p = pending.current;
    if (!p) return;
    if (!p.messageId) {
      const msg: Message = {
        id: makeId("m"),
        role: "ns5",
        text: "",
        createdAt: Date.now(),
        streaming: true,
      };
      p.messageId = msg.id;
      setSessions((prev) =>
        prev.map((s) => (s.id === p.sessionId ? { ...s, messages: [...s.messages, msg] } : s)),
      );
    }
    const timer = setInterval(() => {
      const cur = pending.current;
      if (!cur || !cur.messageId) return;
      if (cur.shown < cur.buffer.length) {
        cur.shown = Math.min(cur.buffer.length, cur.shown + REVEAL_CHARS);
        const text = cur.buffer.slice(0, cur.shown);
        world.screenText = text;
        patchMessage(cur.sessionId, cur.messageId, { text });
      } else if (cur.done) {
        patchMessage(cur.sessionId, cur.messageId, { streaming: false, createdAt: Date.now() });
        setSessions((prev) =>
          prev.map((s) => (s.id === cur.sessionId ? { ...s, updatedAt: Date.now() } : s)),
        );
        pending.current = null;
        world.screenText = "";
        finishReply(world.brain);
        setBusy(false);
      }
    }, REVEAL_INTERVAL);
    return () => clearInterval(timer);
  }, [phase]);

  const newSession = useCallback(() => {
    const s = createSession();
    setSessions((prev) => [s, ...prev]);
    setActiveId(s.id);
  }, []);

  const selectSession = useCallback((id: string) => setActiveId(id), []);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || pending.current) return;
      const sessionId = activeId;
      const userMsg: Message = {
        id: makeId("m"),
        role: "user",
        text: trimmed,
        createdAt: Date.now(),
      };
      const history = sessionsRef.current.find((s) => s.id === sessionId)?.messages ?? [];
      const isFirst = !history.some((m) => m.role === "user");

      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                title: isFirst ? titleFrom(trimmed) : s.title,
                updatedAt: userMsg.createdAt,
                messages: [...s.messages, userMsg],
              }
            : s,
        ),
      );
      const p: PendingReply = { sessionId, messageId: null, buffer: "", shown: 0, done: false };
      pending.current = p;
      setBusy(true);
      world.screenText = "";
      ask(world.brain);

      try {
        for await (const chunk of streamReply([...history, userMsg], trimmed)) p.buffer += chunk;
      } catch {
        p.buffer += p.buffer ? " …signal lost." : "Oops — my antenna lost the signal. Try again?";
      } finally {
        p.done = true;
      }
    },
    [activeId],
  );

  return {
    sessions,
    active,
    activeId: active.id,
    busy,
    phase,
    newSession,
    selectSession,
    send,
  };
}
