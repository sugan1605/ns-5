
import './Sidebar.css'

type SidebarProps = {
  onNewConversation: () => void
}

function Sidebar({ onNewConversation }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-symbol">✦</div>

        <div>
          <h1>NORTH STAR</h1>
          <span>PERSONAL COMPANION SYSTEM</span>
        </div>
      </div>

      <div className="sidebar-system">
        <div className="system-status">
          <span className="system-status-light" />
          SYSTEM ONLINE
        </div>

        <div className="system-version">
          NS-5 <span>·</span> UNIT 001
        </div>
      </div>

      <button
        className="new-conversation-button"
        type="button"
        onClick={onNewConversation}
      >
        <span>+</span>
        NEW SESSION
      </button>

      <div className="sidebar-section">
        <span className="sidebar-section-label">NAVIGATION</span>

        <div className="sidebar-nav-item active">
          <span className="nav-icon">◈</span>
          <span>Command Center</span>
        </div>
      </div>

      <div className="sidebar-section conversation-section">
        <span className="sidebar-section-label">RECENT SESSIONS</span>

        <div className="empty-history">
          <span className="empty-history-icon">⌁</span>
          <p>No previous sessions</p>
          <span>Your conversations will appear here.</span>
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="footer-divider" />

        <div className="north-star-status">
          <span className="north-star-icon">✦</span>
          <div>
            <strong>NORTH STAR 5</strong>
            <span>ALWAYS HERE FOR YOU</span>
          </div>
        </div>

        <span className="sidebar-build">NS-5 INTERFACE · BUILD 001</span>
      </div>
    </aside>
  )
}

export default Sidebar
