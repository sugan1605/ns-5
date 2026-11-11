
import "./MessageBubble.css";

type MessageBubbleProps = {
  content: string;
  sender: "user" | "assistant";
};

function MessageBubble({ content, sender }: MessageBubbleProps) {
  const isUser = sender === "user";

  const senderLabel = isUser ? "You" : "NS-5";

  return (
    <article
      className={`message-bubble ${sender}`}
      aria-label={`Message from ${senderLabel}`}
    >
      <span className="message-sender">{senderLabel}</span>

      <p>{content}</p>
    </article>
  );
}

export default MessageBubble;
