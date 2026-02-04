export const dashboardStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }

  .dashboard { display: flex; min-height: 100vh; background: #09090b; color: #fafafa; }

  /* Sidebar - Desktop */
  .sidebar {
    width: 220px;
    background: linear-gradient(180deg, #0a0a0c 0%, #0c0c0e 100%);
    border-right: 1px solid rgba(255,255,255,0.06);
    display: flex;
    flex-direction: column;
    position: fixed;
    height: 100vh;
    z-index: 100;
  }

  .sidebar-header {
    padding: 24px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 2px;
    font-size: 19px;
    font-weight: 700;
    color: #fafafa;
    text-decoration: none;
    letter-spacing: -0.03em;
  }

  .logo-accent {
    background: linear-gradient(135deg, #FF6B35 0%, #FF8F5C 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .logo-dot {
    width: 6px;
    height: 6px;
    background: linear-gradient(135deg, #FF6B35 0%, #FF8F5C 100%);
    border-radius: 50%;
    margin-left: 1px;
    margin-bottom: 8px;
  }

  .nav { 
    padding: 16px 12px; 
    display: flex; 
    flex-direction: column; 
    gap: 4px; 
    flex: 1; 
  }

  .nav-section-label {
    font-size: 10px;
    font-weight: 600;
    color: #3f3f46;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 16px 12px 8px;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 14px;
    background: transparent;
    border: none;
    border-radius: 10px;
    color: #71717a;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    text-align: left;
    width: 100%;
    transition: all 0.15s ease;
    position: relative;
  }

  .nav-item:hover { 
    background: rgba(255,255,255,0.04); 
    color: #a1a1aa; 
  }

  .nav-item.active { 
    background: linear-gradient(135deg, rgba(255, 107, 53, 0.12) 0%, rgba(255, 107, 53, 0.06) 100%);
    color: #FF6B35;
  }

  .nav-item.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 20px;
    background: linear-gradient(180deg, #FF6B35 0%, #E55A2B 100%);
    border-radius: 0 2px 2px 0;
  }

  .nav-item svg {
    width: 18px;
    height: 18px;
    opacity: 0.7;
    transition: opacity 0.15s;
  }

  .nav-item:hover svg,
  .nav-item.active svg {
    opacity: 1;
  }

  .nav-badge {
    margin-left: auto;
    padding: 2px 7px;
    background: linear-gradient(135deg, #FF6B35 0%, #E55A2B 100%);
    color: #09090b;
    border-radius: 6px;
    font-size: 10px;
    font-weight: 700;
  }

  .sidebar-footer {
    padding: 16px;
    border-top: 1px solid rgba(255,255,255,0.06);
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .user-name { 
    font-size: 13px; 
    color: #a1a1aa;
    font-weight: 500;
  }

  /* Main content */
  .main { flex: 1; margin-left: 220px; min-height: 100vh; }

  /* Mobile header */
  .mobile-header {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: linear-gradient(180deg, #0c0c0e 0%, rgba(12, 12, 14, 0.95) 100%);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(255,255,255,0.06);
    padding: 0 16px;
    align-items: center;
    justify-content: space-between;
    z-index: 90;
  }

  /* Mobile bottom nav */
  .mobile-nav {
    display: none;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(180deg, rgba(12, 12, 14, 0.95) 0%, #0c0c0e 100%);
    backdrop-filter: blur(12px);
    border-top: 1px solid rgba(255,255,255,0.06);
    padding: 6px 0;
    padding-bottom: env(safe-area-inset-bottom, 6px);
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
    color: #52525b;
    font-size: 10px;
    font-weight: 500;
    cursor: pointer;
    transition: color 0.15s;
  }

  .mobile-nav-item.active { 
    color: #FF6B35; 
  }

  .mobile-nav-item svg {
    width: 22px;
    height: 22px;
  }

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

  .page-title { 
    font-size: 22px; 
    font-weight: 600; 
    margin-bottom: 4px;
    letter-spacing: -0.02em;
  }

  .page-subtitle { 
    font-size: 14px; 
    color: #71717a; 
  }

  /* Buttons */
  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background: linear-gradient(135deg, #FF6B35 0%, #E55A2B 100%);
    border: none;
    border-radius: 10px;
    color: #09090b;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 107, 53, 0.25);
  }

  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background: transparent;
    border: 1px solid #27272a;
    border-radius: 10px;
    color: #a1a1aa;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-secondary:hover {
    background: rgba(255,255,255,0.04);
    border-color: #3f3f46;
  }

  /* Cards */
  .card {
    background: linear-gradient(135deg, rgba(15, 15, 17, 0.8) 0%, rgba(15, 15, 17, 0.6) 100%);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 14px;
    padding: 20px;
    margin-bottom: 16px;
  }

  /* Upload zone */
  .upload-zone {
    border: 2px dashed rgba(255,255,255,0.1);
    border-radius: 14px;
    padding: 40px 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    background: linear-gradient(135deg, rgba(15, 15, 17, 0.4) 0%, rgba(15, 15, 17, 0.2) 100%);
  }

  .upload-zone:hover { 
    border-color: rgba(255, 107, 53, 0.4);
    background: linear-gradient(135deg, rgba(255, 107, 53, 0.05) 0%, rgba(255, 107, 53, 0.02) 100%);
  }

  .upload-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 16px;
    background: linear-gradient(135deg, rgba(255, 107, 53, 0.15) 0%, rgba(255, 107, 53, 0.05) 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #FF6B35;
  }

  /* File list */
  .file-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: rgba(15, 15, 17, 0.6);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 10px;
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
    background: linear-gradient(135deg, rgba(15, 15, 17, 0.8) 0%, rgba(15, 15, 17, 0.5) 100%);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 14px;
    text-align: center;
  }

  .summary-value { font-size: 32px; font-weight: 700; }
  .summary-label { font-size: 12px; color: #71717a; margin-top: 4px; }

  /* Findings */
  .finding-card {
    padding: 16px;
    background: rgba(15, 15, 17, 0.6);
    border: 1px solid rgba(255,255,255,0.06);
    border-left: 4px solid;
    border-radius: 10px;
    margin-bottom: 12px;
  }

  .finding-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px; }
  .severity-badge { padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: 700; }
  .statute-tag { font-size: 12px; color: #FF6B35; }
  .finding-account { font-size: 15px; font-weight: 600; margin-bottom: 8px; }
  .finding-issue { font-size: 14px; color: #a1a1aa; line-height: 1.5; margin-bottom: 12px; }
  .flag-btn { background: none; border: none; color: #71717a; cursor: pointer; padding: 8px; transition: color 0.15s; }
  .flag-btn:hover { color: #FF6B35; }
  .flag-btn.flagged { color: #FF6B35; }

  /* Templates */
  .category-card { 
    background: linear-gradient(135deg, rgba(15, 15, 17, 0.8) 0%, rgba(15, 15, 17, 0.5) 100%);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 14px; 
    margin-bottom: 12px; 
    overflow: hidden; 
  }

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
    transition: background 0.15s;
  }

  .category-header:hover {
    background: rgba(255,255,255,0.02);
  }

  .category-title { display: flex; align-items: center; gap: 12px; font-size: 15px; font-weight: 600; }

  .category-icon { 
    width: 36px; 
    height: 36px; 
    background: linear-gradient(135deg, rgba(255, 107, 53, 0.15) 0%, rgba(255, 107, 53, 0.05) 100%);
    border-radius: 10px; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    color: #FF6B35; 
  }

  .template-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    border-top: 1px solid rgba(255,255,255,0.06);
    gap: 12px;
    flex-wrap: wrap;
  }

  .template-info { flex: 1; min-width: 200px; }
  .template-name { font-size: 14px; font-weight: 500; margin-bottom: 4px; }
  .template-desc { font-size: 13px; color: #71717a; margin-bottom: 4px; }
  .template-deadline { font-size: 12px; color: #FF6B35; display: flex; align-items: center; gap: 4px; }

  .template-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: linear-gradient(135deg, #FF6B35 0%, #E55A2B 100%);
    border: none;
    border-radius: 8px;
    color: #09090b;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.15s;
  }

  .template-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 107, 53, 0.25);
  }

  /* Tracker */
  .dispute-card {
    padding: 16px;
    background: linear-gradient(135deg, rgba(15, 15, 17, 0.8) 0%, rgba(15, 15, 17, 0.5) 100%);
    border: 1px solid;
    border-radius: 14px;
    margin-bottom: 12px;
  }

  .dispute-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; flex-wrap: wrap; gap: 8px; }
  .dispute-agency { font-size: 16px; font-weight: 600; }
  .dispute-type { font-size: 13px; color: #71717a; }
  .type-badge { padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 500; }
  .countdown { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; margin-bottom: 12px; }
  .dispute-actions { display: flex; gap: 8px; flex-wrap: wrap; }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: rgba(28, 28, 31, 0.8);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px;
    color: #a1a1aa;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .action-btn:hover {
    background: rgba(255,255,255,0.06);
    border-color: rgba(255,255,255,0.12);
  }

  /* Audit */
  .audit-notice {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    background: linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(255, 107, 53, 0.05) 100%);
    border: 1px solid rgba(255, 107, 53, 0.2);
    border-radius: 10px;
    font-size: 13px;
    color: #FF6B35;
    margin-bottom: 24px;
  }

  .audit-entry {
    padding: 12px 16px;
    background: rgba(15, 15, 17, 0.6);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 10px;
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 12px;
    margin-bottom: 8px;
  }

  .audit-timestamp { color: #52525b; margin-bottom: 4px; }
  .audit-action { color: #FF6B35; font-weight: 500; }
  .audit-details { color: #71717a; margin-top: 4px; }

  /* Empty state */
  .empty-state {
    text-align: center;
    padding: 48px 24px;
    background: linear-gradient(135deg, rgba(15, 15, 17, 0.6) 0%, rgba(15, 15, 17, 0.3) 100%);
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.06);
  }

  .empty-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 16px;
    background: rgba(28, 28, 31, 0.8);
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
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  }

  .modal {
    background: linear-gradient(135deg, #111113 0%, #0c0c0e 100%);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 18px;
    width: 100%;
    max-width: 600px;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }

  .modal-title { font-size: 17px; font-weight: 600; }

  .close-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba(39, 39, 42, 0.8);
    border: none;
    color: #a1a1aa;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
  }

  .close-btn:hover {
    background: rgba(255,255,255,0.1);
    color: #fafafa;
  }

  .modal-body { padding: 20px; overflow-y: auto; flex: 1; }
  .modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 16px 20px; border-top: 1px solid rgba(255,255,255,0.06); }

  .letter-instructions {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px 16px;
    background: linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(255, 107, 53, 0.05) 100%);
    border: 1px solid rgba(255, 107, 53, 0.2);
    border-radius: 10px;
    font-size: 13px;
    color: #FF6B35;
    margin-bottom: 16px;
  }

  .letter-content {
    background: rgba(28, 28, 31, 0.6);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 10px;
    padding: 16px;
    font-size: 12px;
    line-height: 1.6;
    color: #e4e4e7;
    white-space: pre-wrap;
    font-family: 'SF Mono', 'Fira Code', monospace;
    overflow-x: auto;
  }

  /* Error box */
  .error-box {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    background: rgba(239, 68, 68, 0.08);
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: 10px;
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
  .sync-indicator.syncing { color: #FF6B35; }
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
    .summary-value { font-size: 24px; }
  }

  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;
