
import { useEffect, useRef, useState } from "react";

import MessageInput from "./MessageInput";
import MessageList, { type Message } from "./MessageList";
import { CabinScene } from "../room/CabinScene";

import "./ChatWindow.css";

function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Hello! I am NS-5. Your personal little companion. What are we doing today?",
      sender: "assistant",
    },
  ]);

  const [isTyping, setIsTyping] = useState(false);

  const responseTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  useEffect(() => {
    return () => {
      if (responseTimeout.current !== null) {
        clearTimeout(responseTimeout.current);
      }
    };
  }, []);

  function handleSend(message: string) {
    if (isTyping) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      content: message,
      sender: "user",
    };

    setMessages((current) => [...current, userMessage]);
    setIsTyping(true);

    responseTimeout.current = setTimeout(() => {
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        content:
          "I'm here! My systems are ready. What would you like to explore?",
        sender: "assistant",
      };

      setMessages((current) => [...current, assistantMessage]);
      setIsTyping(false);
      responseTimeout.current = null;
    }, 1800);
  }

  return (
    <section className="chat-window">
      <header className="chat-header">
        <div>
          <span className="chat-terminal-label">NS-5 TERMINAL</span>
          <h2>Conversation</h2>
        </div>

        <span className="chat-connection">
          <span className="connection-indicator" />
          LOCAL SESSION
        </span>
      </header>

      <CabinScene isTyping={isTyping} />

      <MessageList
        messages={messages}
        isTyping={isTyping}
      />

      <MessageInput
        onSend={handleSend}
        onTyping={setIsTyping}
        disabled={isTyping}
      />
    </section>
  );
}

export default ChatWindow;
