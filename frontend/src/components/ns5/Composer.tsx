import { SendHorizontal } from "lucide-react";
import { forwardRef, useState, type KeyboardEvent } from "react";

import { Button } from "@/components/ui/button";

interface ComposerProps {
  disabled?: boolean;
  onSend: (text: string) => void;
  onTypingChange: (typing: boolean) => void;
}

export const Composer = forwardRef<HTMLTextAreaElement, ComposerProps>(function Composer(
  { disabled, onSend, onTypingChange },
  ref,
) {
  const [value, setValue] = useState("");

  const update = (next: string) => {
    setValue(next);
    onTypingChange(next.trim().length > 0);
  };

  const submit = () => {
    if (!value.trim() || disabled) return;
    onSend(value);
    update("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <form
      className="flex items-end gap-2 rounded-lg inset-well p-2 focus-within:ring-1 focus-within:ring-signal/50"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <span
        className="select-none pb-2 pl-2 text-base font-semibold text-signal"
        aria-hidden="true"
      >
        &gt;
      </span>
      <label htmlFor="ns5-input" className="sr-only">
        Message NS-5
      </label>
      <textarea
        id="ns5-input"
        ref={ref}
        rows={1}
        value={value}
        onChange={(e) => update(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => onTypingChange(value.trim().length > 0)}
        placeholder="Transmit a message to NS-5…"
        className="max-h-36 min-h-9 flex-1 resize-none bg-transparent py-2 text-sm leading-relaxed text-soft outline-none [field-sizing:content] placeholder:text-muted-foreground"
      />
      <Button
        type="submit"
        variant="signal"
        size="sm"
        className="h-9 shrink-0 px-3"
        disabled={disabled || !value.trim()}
      >
        <SendHorizontal />
        <span className="hidden sm:inline">Send</span>
      </Button>
    </form>
  );
});
