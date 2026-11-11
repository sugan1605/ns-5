
import { useState } from "react";
import type {
  FormEvent,
  KeyboardEvent,
  ChangeEvent,
} from "react";

import "./MessageInput.css";

type MessageInputProps = {
  onSend: (message: string) => void;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
};

function MessageInput({
  onSend,
  onTyping,
  disabled = false,
}: MessageInputProps) {
  const [message, setMessage] = useState("");

  const canSend = message.trim().length > 0;

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    const value = event.target.value;

    setMessage(value);
    onTyping(value.trim().length > 0);

    event.target.style.height = "auto";
    event.target.style.height = `${event.target.scrollHeight}px`;
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage || disabled) return;

    onSend(trimmedMessage);

    setMessage("");
    onTyping(false);

    const textarea = event.currentTarget.querySelector("textarea");

    if (textarea) {
      textarea.style.height = "auto";
    }
  }

  return (
    <form className="message-input" onSubmit={handleSubmit}>
      <span className="terminal-prompt" aria-hidden="true">
        {">"}
      </span>

      <textarea
        value={message}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={
          disabled ? "NS-5 is responding..." : "Type a message..."
        }
        aria-label="Type a message"
        rows={1}
        maxLength={4000}
        disabled={disabled}
      />

      <button
        type="submit"
        disabled={disabled || !canSend}
      >
        SEND
      </button>
    </form>
  );
}

export default MessageInput;
