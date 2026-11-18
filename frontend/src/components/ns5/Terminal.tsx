import { useEffect, useRef } from "react";

import type { Session } from "@/lib/ns5/types";
import type { Phase } from "@/ns5/sim/brain";

import { Composer } from "./Composer";
import { MessageItem, TypingIndicator } from "./MessageItem";

const WAIT_LABEL: Partial<Record<Phase, string>> = {
  noticing: "NS-5 noticed your message",
  walking: "NS-5 is waddling to his workstation",
  sitting: "NS-5 is climbing into his chair",
  typing: "NS-5 is thinking",
  idle: "NS-5 is on his way",
  returning: "NS-5 is heading back",
};

interface TerminalProps {
  session: Session;
  isReplying: boolean;
  phase: Phase;
  onSend: (text: string) => void;
  onTypingChange: (typing: boolean) => void;
}

export function Terminal({ session, isReplying, phase, onSend, onTypingChange }: TerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [session.messages, isReplying, session.id]);

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, [session.id, isReplying]);

  const streaming = session.messages.some((m) => m.streaming);

  return (
    <section
      aria-label="NS-5 terminal"
      className="metal-panel metal-edge flex h-full min-h-0 flex-col overflow-hidden rounded-xl"
    >
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h1 className="text-sm font-semibold tracking-[0.24em] text-soft">NS-5 TERMINAL</h1>
          <p className="label-tech truncate !normal-case !tracking-[0.08em]">{session.title}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded-md inset-well px-2.5 py-1.5">
          <span
            className={`h-1.5 w-1.5 rounded-full ns-blink-dot ${isReplying ? "bg-amber glow-amber" : "bg-signal glow-signal"}`}
          />
          <span className={`label-tech ${isReplying ? "!text-amber" : "!text-signal"}`}>
            {isReplying ? "Transmitting" : "Local session"}
          </span>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="scrollbar-thin flex-1 space-y-5 overflow-y-auto px-4 py-5"
        aria-live="polite"
      >
        {session.messages.map((m) => (
          <MessageItem key={m.id} message={m} />
        ))}
        {isReplying && !streaming && (
          <TypingIndicator label={WAIT_LABEL[phase] ?? "NS-5 is thinking"} />
        )}
      </div>

      <div className="border-t border-border p-3">
        <Composer
          key={session.id}
          ref={inputRef}
          disabled={isReplying}
          onSend={onSend}
          onTypingChange={onTypingChange}
        />
        <p className="mt-2 px-1 text-[0.65rem] text-muted-foreground">
          <kbd className="text-silver">Enter</kbd> to send ·{" "}
          <kbd className="text-silver">Shift + Enter</kbd> for a new line
        </p>
      </div>
    </section>
  );
}
