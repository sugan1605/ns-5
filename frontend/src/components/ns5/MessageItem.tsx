import { shipTime } from "@/lib/ns5/format";
import type { Message } from "@/lib/ns5/types";

import { NS5Avatar } from "./NS5Robot";

export function MessageItem({ message }: { message: Message }) {
  if (message.role === "user") {
    return (
      <div className="ns-msg-in flex justify-end">
        <div className="max-w-[85%] rounded-lg rounded-tr-sm border border-border bg-panel px-4 py-3 shadow-sm sm:max-w-[75%]">
          <div className="mb-1 flex items-center justify-end gap-2">
            <span className="text-[0.65rem] text-muted-foreground">
              {shipTime(message.createdAt)}
            </span>
            <span className="label-tech !text-silver">You</span>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-soft">{message.text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ns-msg-in flex gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md inset-well">
        <NS5Avatar className="h-8 w-8" />
      </div>
      <div className="max-w-[85%] border-l-2 border-amber/60 pl-3 sm:max-w-[78%]">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-[0.7rem] font-semibold tracking-[0.18em] text-amber">NS-5 ›</span>
          <span className="text-[0.65rem] text-muted-foreground">
            {shipTime(message.createdAt)}
          </span>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-silver">
          {message.text}
          {message.streaming && (
            <span
              className="ns-caret ml-0.5 inline-block h-3.5 w-2 translate-y-0.5 bg-signal"
              aria-hidden="true"
            />
          )}
        </p>
      </div>
    </div>
  );
}

export function TypingIndicator({ label = "NS-5 is thinking" }: { label?: string }) {
  return (
    <div className="ns-msg-in flex items-center gap-3" aria-live="polite">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md inset-well">
        <NS5Avatar className="h-8 w-8" />
      </div>
      <div className="flex items-center gap-2 border-l-2 border-amber/60 pl-3">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="ns-typing-dot h-1.5 w-1.5 rounded-full bg-amber"
              style={{ animationDelay: `${i * 0.18}s` }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}
