export const dashboardStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }

  .dashboard { display: flex; min-height: 100vh; background: #09090b; color: #fafafa; }

  /* Sidebar - Desktop */
  .sidebar {
    width: 240px;
    background: #0c0c0e;
    border-right: 1px solid #1c1c1f;
    display: flex;
    flex-direction: column;
    position: fixed;
    height: 100vh;
    z-index: 100;
  }

  .sidebar-header {
    padding: 20px;
    border-bottom: 1px solid #1c1c1f;
  }

  .logo {
    font-size: 20px;
    font-weight: 700;
    color: #fafafa;
    text-decoration: none;
  }

  .logo-accent { color: #d4a574; }

  .nav { padding: 12px; display: flex; flex-direction: column; gap: 4px; flex: 1; }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: transparent;
    border: none;
    border-radius: 8px;
    color: #71717a;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    text-align: left;
    width: 100%;
    transition: all 0.15s;
  }

  .nav-item:hover { background: rgba(255,255,255,0.05); color: #a1a1aa; }
  .nav-item.active { background: rgba(212, 165, 116, 0.1); color: #d4a574; }

  .nav-badge {
    margin-left: auto;
    padding: 2px 8px;
    background: #d4a574;
    color: #09090b;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 600;
  }

  .sidebar-footer {
    padding: 16px 20px;
    border-top: 1px solid #1c1c1f;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .user-name { font-size: 13px; color: #a1a1aa; }

  /* Main content */
  .main { flex: 1; margin-left: 240px; min-height: 100vh; }

  /* Mobile header */
  .mobile-header {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: #0c0c0e;
    border-bottom: 1px solid #1c1c1f;
    padding: 0 16px;
    align-items: center;
    justify-content: space-between;
    z-index: 90;
  }

  .mobile-menu-btn {
    background: none;
    border: none;
    color: #fafafa;
    cursor: pointer;
    padding: 8px;
  }

  /* Mobile bottom nav */
  .mobile-nav {
    display: none;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: #0c0c0e;
    border-top: 1px solid #1c1c1f;
    padding: 8px 0;
    padding-bottom: env(safe-area-inset-bottom, 8px);
    z-index: 90;
  }

  .mobile-nav-items {
    display: flex;
    justify-content: space-around;
  }

  .mobile-nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 8px 12px;
    background: none;
    border: none;
    color: #71717a;
    font-size: 10px;
    cursor: pointer;
  }

  .mobile-nav-item.active { color: #d4a574; }

  /* Content areas */
  .content-area {
    padding: 24px;
    min-height: 100vh;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 16px;
  }

  .page-title { font-size: 24px; font-weight: 600; margin-bottom: 4px; }
  .page-subtitle { font-size: 14px; color: #71717a; }

  /* Buttons */
  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background: #d4a574;
    border: none;
    border-radius: 8px;
    color: #09090b;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
  }

  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background: transparent;
    border: 1px solid #27272a;
    border-radius: 8px;
    color: #a1a1aa;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
  }

  /* Cards */
  .card {
    background: #0f0f11;
    border: 1px solid #1c1c1f;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 16px;
  }

  /* Upload zone */
  .upload-zone {
    border: 2px dashed #27272a;
    border-radius: 12px;
    padding: 40px 20px;
    text-align: center;
    cursor: pointer;
    transition: border-color 0.2s;
  }

  .upload-zone:hover { border-color: #d4a574; }

  .upload-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 16px;
    background: rgba(212,165,116,0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #d4a574;
  }

  /* File list */
  .file-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: #0f0f11;
    border: 1px solid #1c1c1f;
    border-radius: 8px;
    margin-bottom: 8px;
  }

  .file-name { flex: 1; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .file-size { font-size: 12px; color: #52525b; }
  .file-remove { background: none; border: none; color: #71717a; cursor: pointer; padding: 4px; }

  /* Summary cards */
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 12px;
    margin-bottom: 24px;
  }

  .summary-card {
    padding: 20px;
    background: #0f0f11;
    border: 1px solid #1c1c1f;
    border-radius: 12px;
    text-align: center;
  }

  .summary-value { font-size: 32px; font-weight: 700; }
  .summary-label { font-size: 12px; color: #71717a; margin-top: 4px; }

  /* Findings */
  .finding-card {
    padding: 16px;
    background: #0f0f11;
    border: 1px solid #1c1c1f;
    border-left: 4px solid;
    border-radius: 8px;
    margin-bottom: 12px;
  }

  .finding-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px; }
  .severity-badge { padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; }
  .statute-tag { font-size: 12px; color: #d4a574; }
  .finding-account { font-size: 15px; font-weight: 600; margin-bottom: 8px; }
  .finding-issue { font-size: 14px; color: #a1a1aa; line-height: 1.5; margin-bottom: 12px; }
  .flag-btn { background: none; border: none; color: #71717a; cursor: pointer; padding: 8px; }
  .flag-btn.flagged { color: #d4a574; }

  /* Chat */
  .chat-container { display: flex; flex-direction: column; height: calc(100vh - 48px); }
  .chat-messages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px; }
  .message { max-width: 85%; }
  .message.user { align-self: flex-end; }
  .message.assistant { align-self: flex-start; }
  .message-content {
    padding: 12px 16px;
    border-radius: 16px;
    font-size: 14px;
    line-height: 1.6;
    white-space: pre-wrap;
  }
  .message.user .message-content { background: #d4a574; color: #09090b; border-bottom-right-radius: 4px; }
  .message.assistant .message-content { background: #1c1c1f; color: #e4e4e7; border: 1px solid #27272a; border-bottom-left-radius: 4px; }
  .message.error .message-content { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.3); color: #fca5a5; }

  .chat-input-area { padding: 16px; border-top: 1px solid #1c1c1f; }
  .chat-input-wrapper {
    display: flex;
    align-items: flex-end;
    gap: 12px;
    background: #1c1c1f;
    border: 1px solid #27272a;
    border-radius: 12px;
    padding: 12px 16px;
  }
  .chat-input {
    flex: 1;
    background: transparent;
    border: none;
    color: #fafafa;
    font-size: 14px;
    resize: none;
    outline: none;
    line-height: 1.5;
    font-family: inherit;
    max-height: 120px;
  }
  .send-btn {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: #d4a574;
    border: none;
    color: #09090b;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .send-btn:disabled { opacity: 0.4; }

  /* Templates */
  .category-card { background: #0f0f11; border: 1px solid #1c1c1f; border-radius: 12px; margin-bottom: 12px; overflow: hidden; }
  .category-header {
    width: 100%;
    padding: 16px;
    background: transparent;
    border: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    color: #fafafa;
  }
  .category-title { display: flex; align-items: center; gap: 12px; font-size: 16px; font-weight: 600; }
  .category-icon { width: 36px; height: 36px; background: rgba(212,165,116,0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #d4a574; }

  .template-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    border-top: 1px solid #1c1c1f;
    gap: 12px;
    flex-wrap: wrap;
  }
  .template-info { flex: 1; min-width: 200px; }
  .template-name { font-size: 14px; font-weight: 500; margin-bottom: 4px; }
  .template-desc { font-size: 13px; color: #71717a; margin-bottom: 4px; }
  .template-deadline { font-size: 12px; color: #d4a574; display: flex; align-items: center; gap: 4px; }
  .template-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: #d4a574;
    border: none;
    border-radius: 6px;
    color: #09090b;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    text-decoration: none;
  }

  /* Tracker */
  .dispute-card {
    padding: 16px;
    background: #0f0f11;
    border: 1px solid;
    border-radius: 12px;
    margin-bottom: 12px;
  }
  .dispute-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; flex-wrap: wrap; gap: 8px; }
  .dispute-agency { font-size: 16px; font-weight: 600; }
  .dispute-type { font-size: 13px; color: #71717a; }
  .type-badge { padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; }
  .countdown { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; margin-bottom: 12px; }
  .dispute-actions { display: flex; gap: 8px; flex-wrap: wrap; }
  .action-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: #1c1c1f;
    border: 1px solid #27272a;
    border-radius: 6px;
    color: #a1a1aa;
    font-size: 13px;
    cursor: pointer;
  }

  /* Audit */
  .audit-notice {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    background: rgba(212,165,116,0.1);
    border: 1px solid rgba(212,165,116,0.2);
    border-radius: 8px;
    font-size: 13px;
    color: #d4a574;
    margin-bottom: 24px;
  }
  .audit-entry {
    padding: 12px 16px;
    background: #0f0f11;
    border: 1px solid #1c1c1f;
    border-radius: 8px;
    font-family: monospace;
    font-size: 12px;
    margin-bottom: 8px;
  }
  .audit-timestamp { color: #52525b; margin-bottom: 4px; }
  .audit-action { color: #d4a574; font-weight: 500; }
  .audit-details { color: #71717a; margin-top: 4px; }

  /* Empty state */
  .empty-state {
    text-align: center;
    padding: 48px 24px;
    background: #0f0f11;
    border-radius: 12px;
    border: 1px solid #1c1c1f;
  }
  .empty-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 16px;
    background: #1c1c1f;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #52525b;
  }
  .empty-title { font-size: 16px; font-weight: 600; color: #a1a1aa; margin-bottom: 8px; }
  .empty-text { font-size: 14px; color: #52525b; }

  /* Modal */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  }
  .modal {
    background: #0f0f11;
    border: 1px solid #27272a;
    border-radius: 16px;
    width: 100%;
    max-width: 600px;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
  }
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #27272a;
  }
  .modal-title { font-size: 18px; font-weight: 600; }
  .close-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: #27272a;
    border: none;
    color: #a1a1aa;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .modal-body { padding: 20px; overflow-y: auto; flex: 1; }
  .modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 16px 20px; border-top: 1px solid #27272a; }

  .letter-instructions {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px 16px;
    background: rgba(212,165,116,0.1);
    border: 1px solid rgba(212,165,116,0.2);
    border-radius: 8px;
    font-size: 13px;
    color: #d4a574;
    margin-bottom: 16px;
  }
  .letter-content {
    background: #1c1c1f;
    border: 1px solid #27272a;
    border-radius: 8px;
    padding: 16px;
    font-size: 12px;
    line-height: 1.6;
    color: #e4e4e7;
    white-space: pre-wrap;
    font-family: monospace;
    overflow-x: auto;
  }

  /* Error box */
  .error-box {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    background: rgba(239,68,68,0.1);
    border: 1px solid rgba(239,68,68,0.3);
    border-radius: 8px;
    color: #fca5a5;
    margin-bottom: 16px;
  }

  /* Sync indicator */
  .sync-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: #52525b;
  }
  .sync-indicator.syncing { color: #d4a574; }
  .sync-indicator.error { color: #ef4444; }

  /* Loading state */
  .loading-overlay {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    color: #71717a;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .sidebar { display: none; }
    .main { margin-left: 0; padding-top: 60px; padding-bottom: 80px; }
    .mobile-header { display: flex; }
    .mobile-nav { display: block; }
    .content-area { padding: 16px; }
    .page-title { font-size: 20px; }
    .chat-container { height: calc(100vh - 140px); }
    .chat-messages { padding: 16px; }
    .summary-value { font-size: 24px; }
  }

  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;
