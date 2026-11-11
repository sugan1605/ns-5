
import { useState } from 'react'
import Sidebar from './Sidebar'
import ChatWindow from '../chat/ChatWindow'
import './ChatLayout.css'

function ChatLayout() {
  const [sessionKey, setSessionKey] = useState(0)

  function handleNewConversation() {
    setSessionKey((currentKey) => currentKey + 1)
  }

  return (
    <main className="chat-layout">
      <Sidebar onNewConversation={handleNewConversation} />

      <div className="chat-layout-main">
        <ChatWindow key={sessionKey} />
      </div>
    </main>
  )
}

export default ChatLayout
