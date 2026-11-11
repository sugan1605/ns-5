import "./MessageList.css";
import MessageBubble from "./MessageBubble";

export type Message = {
  id: string;
  content: string;
  sender: "user" | "assistant";
};

type MessageListProps = {
  messages: Message[];
  isTyping: boolean;
};

function MessageList({ messages, isTyping }: MessageListProps) {
  return (
    <div
      className="message-list"
      role="log"
      aria-label="Conversation messages"
      aria-live="polite"
      aria-relevant="additions"
    >
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          content={message.content}
          sender={message.sender}
        />
      ))}

      {isTyping && (
        <div className="typing-indicator" aria-label="NS-5 is typing">
          <span />
          <span />
          <span />
        </div>
      )}
    </div>
  );
}

export default MessageList;
