import { useState, useRef, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import { authAPI, chatAPI, userAPI, privateChatAPI, storage } from "./auth.js";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg-app: #0b0e13;
    --bg-sidebar: #0d1117;
    --bg-main: #0b0e13;
    --bg-surface: #161b22;
    --bg-surface2: #1c2230;
    --bg-input: #1a1f2e;
    --bg-hover: #1e2535;
    --accent: #00d4aa;
    --accent-dim: rgba(0,212,170,0.12);
    --accent-dim2: rgba(0,212,170,0.06);
    --sent-bg: #0e3029;
    --sent-border: rgba(0,212,170,0.18);
    --sent-text: #c8f5eb;
    --recv-bg: #1c2230;
    --text-primary: #e2e8f0;
    --text-secondary: #8892a4;
    --text-muted: #4a5568;
    --border: rgba(255,255,255,0.06);
    --border-accent: rgba(0,212,170,0.25);
    --status-online: #00d4aa;
    --status-away: #f59e0b;
    --danger: #ef4444;
    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 18px;
    --radius-xl: 24px;
    --font-brand: 'Syne', sans-serif;
    --font-body: 'Plus Jakarta Sans', sans-serif;
  }

  [data-theme="light"] {
    --bg-app: #f8fafb;
    --bg-sidebar: #ffffff;
    --bg-main: #f5f7fb;
    --bg-surface: #eff3f8;
    --bg-surface2: #e8ecf3;
    --bg-input: #f0f3f9;
    --bg-hover: #e8ecf3;
    --accent: #0ea38c;
    --accent-dim: rgba(14,163,140,0.1);
    --accent-dim2: rgba(14,163,140,0.05);
    --sent-bg: #dff7f1;
    --sent-border: rgba(14,163,140,0.25);
    --sent-text: #1a202c;
    --recv-bg: #ffffff;
    --text-primary: #1a202c;
    --text-secondary: #4a5568;
    --text-muted: #8a99ab;
    --border: rgba(0,0,0,0.08);
    --border-accent: rgba(14,163,140,0.3);
    --status-online: #0ea38c;
    --status-away: #f59e0b;
    --danger: #e53e3e;
  }

  body { font-family: var(--font-body); background: var(--bg-app); color: var(--text-primary); }

  /* ---- AUTH ---- */
  .auth-wrap {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-app);
    position: relative;
    overflow: hidden;
  }
  .auth-bg-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    pointer-events: none;
  }
  .auth-card {
    width: 420px;
    background: var(--bg-sidebar);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    padding: 40px 36px;
    position: relative;
    z-index: 1;
  }
  .auth-brand {
    font-family: var(--font-brand);
    font-size: 26px;
    font-weight: 800;
    color: var(--accent);
    letter-spacing: -0.5px;
    margin-bottom: 4px;
  }
  .auth-tagline {
    font-size: 13px;
    color: var(--text-secondary);
    margin-bottom: 28px;
  }
  .auth-tabs {
    display: flex;
    gap: 4px;
    background: var(--bg-input);
    border-radius: var(--radius-md);
    padding: 4px;
    margin-bottom: 28px;
  }
  .auth-tab {
    flex: 1;
    padding: 8px;
    border: none;
    border-radius: 9px;
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    background: transparent;
    color: var(--text-secondary);
  }
  .auth-tab.active {
    background: var(--accent);
    color: #020f0c;
    font-weight: 600;
  }
  .field {
    margin-bottom: 16px;
  }
  .field label {
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: var(--text-secondary);
    margin-bottom: 7px;
    letter-spacing: 0.3px;
  }
  .field input {
    width: 100%;
    background: var(--bg-input);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 11px 14px;
    font-family: var(--font-body);
    font-size: 14px;
    color: var(--text-primary);
    outline: none;
    transition: border-color 0.2s;
  }
  .field input:focus { border-color: var(--border-accent); }
  .field input::placeholder { color: var(--text-muted); }
  .btn-primary {
    width: 100%;
    padding: 13px;
    background: var(--accent);
    border: none;
    border-radius: var(--radius-sm);
    font-family: var(--font-brand);
    font-size: 14px;
    font-weight: 700;
    color: #020f0c;
    cursor: pointer;
    letter-spacing: 0.3px;
    transition: opacity 0.2s, transform 0.1s;
    margin-top: 8px;
  }
  .btn-primary:hover { opacity: 0.9; }
  .btn-primary:active { transform: scale(0.98); }
  .auth-divider {
    text-align: center;
    font-size: 12px;
    color: var(--text-muted);
    margin: 20px 0;
    position: relative;
  }
  .auth-divider::before, .auth-divider::after {
    content: '';
    position: absolute;
    top: 50%;
    width: 38%;
    height: 1px;
    background: var(--border);
  }
  .auth-divider::before { left: 0; }
  .auth-divider::after { right: 0; }

  /* ---- LAYOUT ---- */
  .app-layout {
    display: flex;
    height: 100vh;
    overflow: hidden;
  }

  /* ---- SIDEBAR ---- */
  .sidebar {
    width: 300px;
    flex-shrink: 0;
    background: var(--bg-sidebar);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .mobile-menu-btn {
    display: none;
    width: 40px;
    height: 40px;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: var(--bg-input);
    color: var(--text-primary);
    cursor: pointer;
    align-items: center;
    justify-content: center;
    font-size: 18px;
  }
  .mobile-menu-btn i {
    width: 18px;
    height: 18px;
  }
  .mobile-backdrop {
    display: none;
  }
  .sidebar-header {
    padding: 20px 18px 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--border);
  }
  .sidebar-brand {
    font-family: var(--font-brand);
    font-size: 20px;
    font-weight: 800;
    color: var(--accent);
    letter-spacing: -0.3px;
  }
  .sidebar-actions { display: flex; gap: 6px; }
  .icon-btn {
    width: 34px;
    height: 34px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-primary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    transition: all 0.18s;
  }
  .icon-btn i,
  .send-btn i {
    color: inherit;
    font-size: 18px;
  }
  .icon-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
  .search-wrap {
    padding: 12px 14px;
    border-bottom: 1px solid var(--border);
  }
  .search-input-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--bg-input);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 9px 12px;
  }
  .search-input-wrap input {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    font-family: var(--font-body);
    font-size: 13px;
    color: var(--text-primary);
  }
  .search-input-wrap input::placeholder { color: var(--text-muted); }
  .search-icon { color: var(--text-muted); font-size: 15px; }
  .sidebar-section-label {
    padding: 10px 16px 6px;
    font-size: 10px;
    font-weight: 700;
    color: var(--text-muted);
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  .conv-list { flex: 1; overflow-y: auto; padding-bottom: 8px; }
  .conv-list::-webkit-scrollbar { width: 3px; }
  .conv-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
  .conv-item {
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 10px 14px;
    cursor: pointer;
    transition: background 0.15s;
    border-radius: var(--radius-sm);
    margin: 1px 6px;
  }
  .conv-item:hover { background: var(--bg-hover); }
  .conv-item.active { background: var(--accent-dim); }
  .avatar-wrap { position: relative; flex-shrink: 0; }
  .avatar {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-brand);
    font-size: 15px;
    font-weight: 700;
    letter-spacing: -0.3px;
  }
  .profile-card {
    background: var(--bg-sidebar);
    border: 1px solid var(--border);
    border-radius: 22px;
    padding: 24px;
    max-width: 640px;
    display: grid;
    gap: 20px;
  }
  .profile-top {
    display: flex;
    align-items: center;
    gap: 18px;
    flex-wrap: wrap;
  }
  .profile-avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 26px;
    font-weight: 700;
    font-family: var(--font-brand);
    flex-shrink: 0;
    border: 1px solid var(--border);
    background: var(--bg-input);
    overflow: hidden;
  }
  .profile-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .profile-summary {
    display: grid;
    gap: 6px;
  }
  .profile-summary .profile-name {
    font-size: 20px;
    font-weight: 700;
    color: var(--text-primary);
  }
  .profile-summary .profile-username {
    font-size: 13px;
    color: var(--text-secondary);
  }
  .profile-grid {
    display: grid;
    gap: 18px;
  }
  .profile-section {
    background: var(--bg-main);
    border: 1px solid var(--border);
    border-radius: 18px;
    padding: 18px;
    display: grid;
    gap: 16px;
  }
  .profile-section h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
    color: var(--text-primary);
  }
  .profile-section p {
    margin: 0;
    color: var(--text-secondary);
    font-size: 13px;
    line-height: 1.65;
  }
  .profile-field-grid {
    display: grid;
    gap: 14px;
  }
  .profile-submit-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
  }
  .profile-submit-row .btn-primary,
  .profile-submit-row .send-btn {
    flex: 1 1 210px;
  }
  .profile-note {
    color: var(--text-muted);
    font-size: 12px;
  }
  .profile-message {
    color: var(--accent);
    font-size: 13px;
  }
  .profile-error {
    color: var(--danger);
    font-size: 13px;
  }
  .status-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    position: absolute;
    bottom: 0;
    right: 0;
    border: 2px solid var(--bg-sidebar);
  }
  .status-dot.online { background: var(--status-online); }
  .status-dot.away { background: var(--status-away); }
  .status-dot.offline { background: var(--text-muted); }
  .conv-info { flex: 1; min-width: 0; }
  .conv-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 2px;
  }
  .conv-preview {
    font-size: 12px;
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .conv-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; flex-shrink: 0; }
  .conv-time { font-size: 11px; color: var(--text-muted); }
  .unread-badge {
    background: var(--accent);
    color: #020f0c;
    font-size: 10px;
    font-weight: 700;
    min-width: 18px;
    height: 18px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 5px;
    font-family: var(--font-brand);
  }
  .sidebar-user {
    padding: 14px 16px;
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
  }
  .sidebar-user:hover { background: var(--bg-hover); }
  .sidebar-user .user-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
  }
  .sidebar-user .user-status {
    font-size: 11px;
    color: var(--accent);
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .sidebar-user .user-status::before {
    content: '';
    width: 6px;
    height: 6px;
    background: var(--accent);
    border-radius: 50%;
    display: inline-block;
  }
  .sidebar-user-actions { margin-left: auto; }

  /* ---- MAIN CHAT ---- */
  .chat-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--bg-main);
  }
  .chat-header {
    padding: 14px 22px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--bg-sidebar);
  }
  .chat-header-info { flex: 1; }
  .chat-header-name {
    font-family: var(--font-brand);
    font-size: 16px;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 1px;
  }
  .chat-header-sub {
    font-size: 12px;
    color: var(--accent);
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .pulse-dot {
    width: 6px;
    height: 6px;
    background: var(--accent);
    border-radius: 50%;
    display: inline-block;
    animation: pulse 2s infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
  .chat-header-actions { display: flex; gap: 6px; }
  .messages-wrap {
    flex: 1;
    overflow-y: auto;
    padding: 24px 24px 10px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .messages-wrap::-webkit-scrollbar { width: 3px; }
  .messages-wrap::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
  .msg-date-sep {
    text-align: center;
    font-size: 11px;
    color: var(--text-muted);
    padding: 12px 0 8px;
    position: relative;
  }
  .msg-date-sep::before, .msg-date-sep::after {
    content: '';
    position: absolute;
    top: 50%;
    width: 40%;
    height: 1px;
    background: var(--border);
  }
  .msg-date-sep::before { left: 0; }
  .msg-date-sep::after { right: 0; }
  .msg-row {
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
    gap: 8px;
    margin-bottom: 3px;
    width: 100%;
    min-width: 0;
  }
  .msg-row.sent { justify-content: flex-end; }
  .msg-row.sent .msg-avatar { display: none; }
  .msg-row > div {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    min-width: 0;
    max-width: calc(100% - 40px);
  }
  .msg-row.sent > div {
    align-items: flex-end;
  }
  .msg-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    font-family: var(--font-brand);
    flex-shrink: 0;
  }
  .msg-bubble {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: flex-start;
    width: auto;
    max-width: 72%;
    padding: 10px 14px;
    border-radius: var(--radius-lg);
    font-size: 14px;
    line-height: 1.6;
    white-space: normal;
    overflow-wrap: anywhere;
    word-break: normal;
    word-wrap: break-word;
    hyphens: none;
    text-align: left;
    position: relative;
  }
  .msg-row.recv .msg-bubble {
    background: var(--recv-bg);
    border: 1px solid var(--border);
    border-bottom-left-radius: 4px;
    color: var(--text-primary);
  }
  .msg-row.sent .msg-bubble {
    background: var(--sent-bg);
    border: 1px solid var(--sent-border);
    border-bottom-right-radius: 4px;
    color: var(--sent-text);
  }
  .msg-time {
    font-size: 10px;
    color: var(--text-muted);
    margin-top: 4px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .msg-row.sent .msg-time { justify-content: flex-end; }
  .check-icon { color: var(--accent); font-size: 12px; }
  .msg-img {
    width: 200px;
    height: 140px;
    border-radius: var(--radius-md);
    object-fit: cover;
    display: block;
    margin-bottom: 4px;
    background: var(--bg-surface2);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    font-size: 12px;
    border: 1px solid var(--border);
  }
  .typing-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 0 14px;
    color: var(--text-secondary);
    font-size: 13px;
  }
  .typing-dots { display: flex; gap: 3px; }
  .typing-dots span {
    width: 6px;
    height: 6px;
    background: var(--text-muted);
    border-radius: 50%;
    animation: bounce 1.2s infinite;
  }
  .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
  .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes bounce {
    0%, 100% { transform: translateY(0); opacity: 0.5; }
    40% { transform: translateY(-5px); opacity: 1; }
  }
  .input-area {
    padding: 14px 20px 18px;
    border-top: 1px solid var(--border);
    display: flex;
    align-items: flex-end;
    gap: 10px;
    background: var(--bg-sidebar);
  }
  .input-box {
    flex: 1;
    background: var(--bg-input);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 11px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: border-color 0.2s;
  }
  .input-box:focus-within { border-color: var(--border-accent); }
  .input-box textarea {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    font-family: var(--font-body);
    font-size: 14px;
    color: var(--text-primary);
    resize: none;
    max-height: 120px;
    line-height: 1.5;
  }
  .input-box textarea::placeholder { color: var(--text-muted); }
  .input-actions { display: flex; gap: 4px; }
  .attach-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 4px;
    font-size: 18px;
    transition: color 0.15s;
    display: flex;
    align-items: center;
  }
  .attach-btn:hover { color: var(--accent); }
  .send-btn {
    width: 44px;
    height: 44px;
    background: var(--accent);
    border: none;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    color: #020f0c;
    transition: opacity 0.2s, transform 0.1s;
    flex-shrink: 0;
  }
  .send-btn:hover { opacity: 0.9; }
  .send-btn:active { transform: scale(0.93); }

  .profile-action-btn {
    min-width: 140px;
    width: auto;
    min-height: 44px;
    border-radius: 16px;
    padding: 0 18px;
    font-size: 14px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.1s;
  }
  .profile-action-btn:hover { opacity: 0.9; }
  .profile-action-btn:active { transform: scale(0.98); }

  .profile-card {
    background: var(--bg-sidebar);
    border: 1px solid var(--border);
    border-radius: 22px;
    padding: 24px;
    max-width: 640px;
    display: grid;
    gap: 20px;
  }
  .profile-top {
    display: flex;
    align-items: center;
    gap: 18px;
    flex-wrap: wrap;
  }
  .profile-avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 26px;
    font-weight: 700;
    font-family: var(--font-brand);
    flex-shrink: 0;
    border: 1px solid var(--border);
    background: var(--bg-input);
    overflow: hidden;
  }
  .profile-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .profile-summary {
    display: grid;
    gap: 6px;
  }
  .profile-summary .profile-name {
    font-size: 20px;
    font-weight: 700;
    color: var(--text-primary);
  }
  .profile-summary .profile-username {
    font-size: 13px;
    color: var(--text-secondary);
  }
  .profile-grid {
    display: grid;
    gap: 18px;
  }
  .profile-section {
    background: var(--bg-main);
    border: 1px solid var(--border);
    border-radius: 18px;
    padding: 18px;
    display: grid;
    gap: 16px;
  }
  .profile-section h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
    color: var(--text-primary);
  }
  .profile-section p {
    margin: 0;
    color: var(--text-secondary);
    font-size: 13px;
    line-height: 1.65;
  }
  .profile-field-grid {
    display: grid;
    gap: 14px;
  }
  .profile-submit-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
  }
  .profile-note {
    color: var(--text-muted);
    font-size: 12px;
  }
  .profile-message {
    color: var(--accent);
    font-size: 13px;
  }
  .profile-error {
    color: var(--danger);
    font-size: 13px;
}   

  @media (max-width: 1024px) {
    .sidebar { width: 280px; }
    .chat-main { min-height: 0; }
    .profile-card { max-width: 100%; }
    .profile-top { flex-direction: column; align-items: flex-start; }
    .profile-submit-row { flex-direction: column; align-items: stretch; }
  }

  @media (max-width: 900px) {
    .sidebar { width: 280px; }
    .chat-main { min-height: 0; }
  }

  @media (max-width: 900px) {
    .app-layout { position: relative; }
    .sidebar {
      position: fixed;
      top: 0;
      left: 0;
      height: 100vh;
      width: 270px;
      transform: translateX(-100%);
      box-shadow: 12px 0 40px rgba(0,0,0,0.12);
      z-index: 30;
      transition: transform 0.25s ease;
      border-right: 1px solid var(--border);
    }
    .sidebar.open { transform: translateX(0); }
    .sidebar-header { padding-right: 12px; }
    .chat-main { width: 100%; }
    .mobile-backdrop {
      display: block;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.25);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s ease;
      z-index: 25;
    }
    .mobile-backdrop.active {
      opacity: 1;
      pointer-events: auto;
    }
    .chat-header { padding: 14px 16px; gap: 12px; }
    .chat-header-info { flex: 1; }
    .main-menu { display: inline-flex; }
    .sidebar { width: 100%; max-width: 320px; }
    .sidebar-nav { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; padding: 14px; }
    .nav-tab { justify-content: center; padding: 10px 12px; }
    .search-wrap { padding: 10px 14px; }
    .conv-item { margin: 8px 10px; }
    .sidebar-user { padding: 12px 14px; }
    .sidebar-user-actions { display: none; }
  }

  @media (max-width: 640px) {
    .sidebar { width: 100%; max-width: 100%; }
    .chat-header { padding: 12px 14px; }
    .messages-wrap { padding: 18px 16px; }
    .input-area { padding: 12px 14px; }
    .input-box { padding: 10px 12px; }
    .send-btn { width: 42px; height: 42px; }
  }

  /* ---- EMPTY STATE ---- */
  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    gap: 14px;
  }
  .empty-icon { font-size: 54px; opacity: 0.3; }
  .empty-title {
    font-family: var(--font-brand);
    font-size: 20px;
    font-weight: 700;
    color: var(--text-secondary);
  }
  .empty-sub { font-size: 13px; color: var(--text-muted); }

  /* ---- THEME TOGGLE ---- */
  .theme-toggle {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 14px 16px;
    background: var(--accent);
    border: none;
    border-radius: 12px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    color: #020f0c;
    transition: all 0.2s;
    font-family: var(--font-body);
    justify-content: space-between;
  }
  .theme-toggle:hover { opacity: 0.9; }
  .theme-toggle:active { transform: scale(0.98); }
  .theme-toggle i { font-size: 18px; }

  /* ---- GROUP BADGE ---- */
  .group-avatar {
    width: 42px;
    height: 42px;
    border-radius: 13px;
  }

  /* ---- NOTIFICATION TOAST ---- */
  .toast {
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--bg-surface2);
    border: 1px solid var(--border-accent);
    border-radius: var(--radius-md);
    padding: 12px 16px;
    font-size: 13px;
    color: var(--text-primary);
    z-index: 999;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    animation: slideIn 0.3s ease;
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(60px); }
    to { opacity: 1; transform: translateX(0); }
  }
  .toast-dot { width: 8px; height: 8px; background: var(--accent); border-radius: 50%; flex-shrink: 0; }

  /* ---- MEDIA PREVIEW PLACEHOLDER ---- */
  .media-placeholder {
    width: 200px;
    height: 130px;
    border-radius: var(--radius-md);
    border: 1px solid var(--border);
    background: var(--bg-surface2);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    color: var(--text-muted);
    font-size: 12px;
    margin-bottom: 6px;
  }
  .media-placeholder i { font-size: 28px; color: var(--accent); opacity: 0.7; }

  .sidebar-nav {
    display: flex;
    padding: 8px 14px;
    gap: 4px;
    border-bottom: 1px solid var(--border);
  }
  .nav-tab {
    flex: 1;
    padding: 7px 0;
    background: none;
    border: none;
    border-radius: var(--radius-sm);
    font-family: var(--font-body);
    font-size: 12px;
    font-weight: 500;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.15s;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }
  .nav-tab i { font-size: 17px; }
  .nav-tab.active { color: var(--accent); background: var(--accent-dim2); }
  .nav-tab:hover:not(.active) { background: var(--bg-hover); color: var(--text-primary); }
`;

const AVATAR_COLORS = [
  ["#1a3a2a","#00d4aa"], ["#2a1a3a","#a78bfa"],
  ["#2a1a1a","#f87171"], ["#1a2a3a","#60a5fa"],
  ["#2a2a1a","#fbbf24"], ["#1a2a2a","#34d399"],
];

function initials(name) {
  return name.split(" ").slice(0,2).map(w => w[0]).join("").toUpperCase();
}

function Avatar({ contact, size = 42, radius = "50%" }) {
  const [bg, fg] = contact.color;
  const photo = contact.profilePhoto || contact.photo;
  if (photo) {
    return (
      <div style={{
        width: size, height: size, borderRadius: radius,
        overflow: 'hidden', background: 'var(--bg-input)', flexShrink: 0,
      }}>
        <img src={photo} alt={contact.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: radius,
      background: bg, color: fg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "var(--font-brand)", fontSize: size * 0.35,
      fontWeight: 700, flexShrink: 0,
    }}>
      {contact.isGroup ? <i className="ti ti-users" style={{ fontSize: size * 0.42 }} aria-hidden="true" /> : initials(contact.name)}
    </div>
  );
}

function AuthScreen({ onLogin, onError }) {
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ name:"", username:"", email:"", password:"" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handle = async () => {
    if (!form.email || !form.password) {
      setError("Please fill in all fields");
      return;
    }
    if (tab === "register" && !form.name) {
      setError("Please enter your name");
      return;
    }
    if (tab === "register" && !form.username) {
      setError("Please choose a username");
      return;
    }

    setError("");
    setLoading(true);

    try {
      let data;
      if (tab === "login") {
        data = await authAPI.login(form.email, form.password);
      } else {
        data = await authAPI.register(form.name, form.username, form.email, form.password);
      }

      // Save token and user
      storage.setToken(data.token);
      storage.setUser(data.user);

      console.log("✅ Auth successful, saved token:", data.token.substring(0, 20) + "...");
      
      // Call parent callback
      onLogin(data.user);
    } catch (err) {
      const errMsg = err.message;
      setError(errMsg);
      console.error("❌ Auth error:", errMsg);
      onError?.(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-bg-orb" style={{ width:380, height:380, background:"rgba(0,212,170,0.06)", top:"-80px", right:"-80px" }} />
      <div className="auth-bg-orb" style={{ width:280, height:280, background:"rgba(124,58,237,0.05)", bottom:"-40px", left:"-60px" }} />
      <div className="auth-card">
        <div className="auth-brand">Connectify</div>
        <div className="auth-tagline">Instant. Secure. Real-Time.</div>
        <div className="auth-tabs">
          <button className={`auth-tab${tab==="login"?" active":""}`} onClick={() => { setTab("login"); setError(""); }}>Sign In</button>
          <button className={`auth-tab${tab==="register"?" active":""}`} onClick={() => { setTab("register"); setError(""); }}>Create Account</button>
        </div>
        {error && <div style={{ padding:"10px 12px", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:"var(--radius-sm)", color:"#fca5a5", fontSize:"12px", marginBottom:"16px" }}>{error}</div>}
        {tab === "register" && (
          <>
            <div className="field">
              <label>Full Name</label>
              <input placeholder="e.g. Rajveer Singh" value={form.name} onChange={e => setForm({...form, name:e.target.value})} disabled={loading} />
            </div>
            <div className="field">
              <label>Username</label>
              <input placeholder="unique username" value={form.username} onChange={e => setForm({...form, username:e.target.value.toLowerCase()})} disabled={loading} />
            </div>
          </>
        )}
        <div className="field">
          <label>Email Address</label>
          <input type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({...form, email:e.target.value})} disabled={loading} />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({...form, password:e.target.value})} disabled={loading} />
        </div>
        <button className="btn-primary" onClick={handle} disabled={loading} style={{ opacity: loading ? 0.6 : 1 }}>
          {loading ? "Processing..." : (tab === "login" ? "Sign In →" : "Create Account →")}
        </button>
        {tab === "login" && (
          <div className="auth-divider">or continue with</div>
        )}
        {tab === "login" && (
          <button className="btn-primary" style={{ background:"var(--bg-surface2)", color:"var(--text-primary)", border:"1px solid var(--border)", marginTop:0, fontFamily:"var(--font-body)", fontWeight:500 }} onClick={handle} disabled={loading}>
            <i className="ti ti-brand-google" style={{ marginRight:8, fontSize:16, verticalAlign:-2 }} /> Continue with Google
          </button>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [navTab, setNavTab] = useState("chats");
  const [search, setSearch] = useState("");
  const [peopleSearch, setPeopleSearch] = useState("");
  const [peopleResults, setPeopleResults] = useState([]);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState({});
  const [inputText, setInputText] = useState("");
  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem('app-theme') || 'dark');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', username: '', profilePhoto: '' });
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '' });
  const [photoPreview, setPhotoPreview] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileMode, setProfileMode] = useState('view');
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const socketRef = useRef(null);
  const BACKEND_URL = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || "http://localhost:8080";

  // Helper functions (must be before useEffect)
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const changeTab = (tab) => {
    setNavTab(tab);
    setSidebarOpen(false);
    if (tab !== 'profile') {
      setProfileMode('view');
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('app-theme', newTheme);
  };

  const setupSocketListeners = useCallback((socket) => {
    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    socket.on('message_received', ({ chatId, message }) => {
      setMessages((prev) => {
        const chatMessages = prev[chatId] || [];
        if (chatMessages.some((item) => item.id === message.id)) {
          return prev;
        }
        return {
          ...prev,
          [chatId]: [...chatMessages, message],
        };
      });
      setContacts((prev) => prev.map((chat) =>
        chat._id === chatId
          ? { ...chat, lastMsg: message.text, time: message.time, unread: chat._id === selectedId ? 0 : (chat.unread || 0) + 1 }
          : chat
      ));
      if (chatId === selectedId) {
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      }
    });

    socket.on('chat_updated', ({ chatId, lastMsg, time }) => {
      setContacts((prev) => prev.map((chat) =>
        chat._id === chatId ? { ...chat, lastMsg, time } : chat
      ));
    });

    socket.on('chat_created', ({ chat }) => {
      setContacts((prev) => {
        if (prev.some((item) => item._id === chat._id)) return prev;
        return [chat, ...prev];
      });
    });
  }, [selectedId]);

  const socketRequest = (event, payload) => new Promise((resolve, reject) => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) {
      return reject(new Error('Socket is not connected.'));
    }
    socket.emit(event, payload, (response) => {
      if (!response) return reject(new Error('No response from socket.'));
      if (response.status === 'ok') return resolve(response);
      return reject(new Error(response.error || 'Socket request failed.'));
    });
  });

  const searchUsers = async (query) => {
    setPeopleSearch(query);
    if (!query.trim()) {
      setPeopleResults([]);
      return;
    }

    setPeopleLoading(true);
    try {
      const socket = socketRef.current;
      if (socket?.connected) {
        const response = await socketRequest('search_user', { username: query });
        setPeopleResults(response.users || []);
      } else {
        const users = await userAPI.search(query, storage.getToken());
        setPeopleResults(users);
      }
    } catch (err) {
      console.error('Search users error:', err.message);
      showToast(err.message);
    } finally {
      setPeopleLoading(false);
    }
  };

  const openUserChat = async (username) => {
    if (!username) return;
    try {
      let response;
      const socket = socketRef.current;
      if (socket?.connected) {
        response = await socketRequest('create_private_chat', { username });
      } else {
        response = await privateChatAPI.create(username, storage.getToken());
      }

      const newChat = response.chat;
      setContacts((prev) => {
        if (prev.some((item) => item._id === newChat._id)) return prev;
        return [newChat, ...prev];
      });
      setNavTab('chats');
      setSelectedId(newChat._id);
      await loadMessages(newChat._id);
      showToast(`Chat opened with ${username}`);
    } catch (err) {
      console.error('Open user chat error:', err.message);
      showToast(err.message);
    }
  };

  const loadMessages = useCallback(async (chatId) => {
    if (!chatId || messages[chatId]) return;
    const token = storage.getToken();
    if (!token) return;

    try {
      const msgList = await chatAPI.getMessages(chatId, token);
      setMessages((prev) => ({ ...prev, [chatId]: msgList }));
    } catch (err) {
      console.error('Message load error:', err.message);
      showToast(err.message);
    }
  }, [messages]);

  const loadChats = useCallback(async () => {
    const token = storage.getToken();
    if (!token) return;

    try {
      const chatList = await chatAPI.getChats(token);
      const filteredChats = chatList.filter((chat) => !['Priya Sharma', 'Dev Squad 🚀', 'Connectify Team'].includes(chat.name));
      setContacts(filteredChats);
      if (filteredChats.length > 0) {
        const firstChatId = filteredChats[0]._id;
        setSelectedId(firstChatId);
        await loadMessages(firstChatId);
      }
    } catch (err) {
      console.error('Load chats error:', err.message);
      showToast(err.message);
    }
  }, [loadMessages]);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);
    document.documentElement.setAttribute('data-theme', theme);
    return () => document.head.removeChild(style);
  }, [theme]);

  // Restore session on app load
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = storage.getToken();
        const user = storage.getUser();

        if (token && user) {
          console.log("🔍 Checking session... Token found:", token.substring(0, 20) + "...");
          const profile = await authAPI.getProfile(token);
          console.log("✅ Session valid, user:", profile.name);
          storage.setUser(profile);
          setCurrentUser(profile);
          setProfileForm({ name: profile.name, username: profile.username, profilePhoto: profile.profilePhoto || '' });
          setPhotoPreview(profile.profilePhoto || '');
          setLoggedIn(true);
          const socket = io(BACKEND_URL, {
            auth: { token },
            transports: ['websocket'],
          });
          socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
            showToast('Connected to live chat');
          });
          socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error.message);
            showToast('Live chat connection failed');
          });
          socketRef.current = socket;
          setupSocketListeners(socket);
          await loadChats();
        } else {
          console.log("❌ No saved session found");
        }
      } catch (err) {
        console.error("Session check error:", err.message);
        storage.clear();
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, [BACKEND_URL, setupSocketListeners, loadChats]);

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (selectedId) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedId, messages]);

  const handleProfileImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result);
      setProfileForm((prev) => ({ ...prev, profilePhoto: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    setProfileError('');
    setProfileMessage('');
    try {
      const updated = await userAPI.updateProfile({
        name: profileForm.name,
        username: profileForm.username,
        profilePhoto: profileForm.profilePhoto,
      }, storage.getToken());
      setCurrentUser(updated);
      setProfileForm({ name: updated.name, username: updated.username, profilePhoto: updated.profilePhoto || '' });
      setPhotoPreview(updated.profilePhoto || '');
      storage.setUser(updated);
      setProfileMessage('Profile saved successfully.');
    } catch (err) {
      setProfileError(err.message || 'Unable to update profile.');
    }
  };

  const changePassword = async () => {
    setProfileError('');
    setProfileMessage('');
    if (!passwordForm.oldPassword || !passwordForm.newPassword) {
      setProfileError('Please enter both current and new password.');
      return;
    }
    try {
      await userAPI.changePassword(passwordForm.oldPassword, passwordForm.newPassword, storage.getToken());
      setPasswordForm({ oldPassword: '', newPassword: '' });
      setProfileMessage('Password updated successfully.');
    } catch (err) {
      setProfileError(err.message || 'Unable to change password.');
    }
  };

  const handleChatSelect = async (chatId) => {
    setSelectedId(chatId);
    await loadMessages(chatId);
    if (typeof window !== 'undefined' && window.innerWidth < 900) {
      setSidebarOpen(false);
    }
  };

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || !selectedId) return;
    const socket = socketRef.current;
    const token = storage.getToken();
    if (!token) return;

    if (socket?.connected) {
      socket.emit('send_message', { chatId: selectedId, text }, (response) => {
        if (response?.status === 'ok') {
          setMessages((prev) => ({
            ...prev,
            [selectedId]: [...(prev[selectedId] || []), response.message],
          }));
          setContacts((prev) => prev.map((chat) =>
            chat._id === selectedId ? { ...chat, lastMsg: response.message.text, time: response.message.time, unread: 0 } : chat
          ));
          setInputText("");
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        } else {
          const message = response?.error || 'Failed to send message';
          console.error('Socket send error:', message);
          showToast(message);
        }
      });
    } else {
      try {
        const { message } = await chatAPI.sendMessage(selectedId, text, token);
        setMessages((prev) => ({
          ...prev,
          [selectedId]: [...(prev[selectedId] || []), message],
        }));
        setContacts((prev) => prev.map((chat) =>
          chat._id === selectedId ? { ...chat, lastMsg: message.text, time: message.time, unread: 0 } : chat
        ));
        setInputText("");
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      } catch (err) {
        console.error("Send message error:", err.message);
        showToast(err.message);
      }
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleLogout = async () => {
    const token = storage.getToken();
    if (token) {
      await authAPI.logout(token);
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    storage.clear();
    setLoggedIn(false);
    setCurrentUser(null);
    setContacts([]);
    setMessages({});
    setSelectedId(null);
  };

  // Show loading state while checking session
  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--bg-app)", color: "var(--text-secondary)" }}>
        <div>
          <div style={{ fontSize: "20px", marginBottom: "20px" }}>Connectify</div>
          <div>Restoring session...</div>
        </div>
      </div>
    );
  }

  // Show auth screen if not logged in
  if (!loggedIn) {
    return <AuthScreen onLogin={(u) => {
      setCurrentUser(u);
      setProfileForm({ name: u.name, username: u.username, profilePhoto: u.profilePhoto || '' });
      setPhotoPreview(u.profilePhoto || '');
      setLoggedIn(true);
      const token = storage.getToken();
      if (token) {
        const socket = io(BACKEND_URL, {
          auth: { token },
          transports: ['websocket'],
        });
        socket.on('connect', () => {
          console.log('Socket connected:', socket.id);
          showToast('Connected to live chat');
        });
        socket.on('connect_error', (error) => {
          console.error('Socket connection error:', error.message);
          showToast('Live chat connection failed');
        });
        socketRef.current = socket;
        setupSocketListeners(socket);
        loadChats().catch((err) => {
          console.error('Load chats after login error:', err.message);
        });
      }
    }} onError={(err) => showToast(err)} />;
  }

  const filtered = contacts.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  const selected = contacts.find((c) => c._id === selectedId);
  const msgs = selectedId ? messages[selectedId] || [] : [];
  const isTyping = selected?.typing || false;
  const joinedOn = currentUser?._id ? new Date(parseInt(currentUser._id.substring(0,8), 16) * 1000).toLocaleDateString() : '';

  const meContact = {
    id: 0,
    name: currentUser?.name || currentUser?.email?.split("@")[0] || "You",
    color: AVATAR_COLORS[1],
    isGroup: false,
    profilePhoto: photoPreview || currentUser?.profilePhoto || '',
  };

  return (
    <div className="app-layout">
      {toast && (
        <div className="toast">
          <span className="toast-dot" />
          {toast}
        </div>
      )}

      {/* SIDEBAR */}
      <div className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-brand">Connectify</span>
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            <i className="ti ti-x" aria-hidden="true" />
          </button>
        </div>

        <div className="sidebar-nav">
          {[
            { key:"chats", icon:"ti-message-circle", label:"Chats" },
            { key:"people", icon:"ti-search", label:"People" },
            { key:"profile", icon:"ti-user", label:"Profile" },
            { key:"groups", icon:"ti-users", label:"Groups" },
            { key:"calls", icon:"ti-phone", label:"Calls" },
            { key:"media", icon:"ti-photo", label:"Media" },
          ].map(n => (
            <button key={n.key} className={`nav-tab${navTab===n.key?" active":""}`} onClick={() => changeTab(n.key)}>
              <i className={`ti ${n.icon}`} aria-hidden="true" />
              {n.label}
            </button>
          ))}
        </div>

        <div className="search-wrap">
          <div className="search-input-wrap">
            <i className="ti ti-search search-icon" aria-hidden="true" />
            <input placeholder="Search conversations..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="sidebar-section-label">Recent</div>
        <div className="conv-list">
          {filtered
            .filter(c => navTab === "groups" ? c.isGroup : navTab === "chats" ? !c.isGroup : true)
            .map(contact => (
              <div key={contact._id} className={`conv-item${selectedId===contact._id?" active":""}`} onClick={() => handleChatSelect(contact._id)}>
                <div className="avatar-wrap">
                  <Avatar contact={contact} radius={contact.isGroup ? "13px" : "50%"} />
                  <span className={`status-dot ${contact.status}`} />
                </div>
                <div className="conv-info">
                  <div className="conv-name">{contact.name}</div>
                  <div className="conv-preview">{contact.lastMsg}</div>
                </div>
                <div className="conv-meta">
                  <span className="conv-time">{contact.time}</span>
                  {contact.unread > 0 && <span className="unread-badge">{contact.unread}</span>}
                </div>
              </div>
          ))}
        </div>

        <div className="sidebar-user" onClick={() => changeTab('profile')}>
          <Avatar contact={meContact} size={36} />
          <div>
            <div className="user-name">{meContact.name}</div>
            <div className="user-status">Online</div>
          </div>
          <div className="sidebar-user-actions">
            <button className="icon-btn" onClick={(e) => { e.stopPropagation(); handleLogout(); setSelectedId(null); }}>
              <i className="ti ti-logout" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <div className={`mobile-backdrop${sidebarOpen ? ' active' : ''}`} onClick={() => setSidebarOpen(false)} />
      {/* MAIN */}
      <div className="chat-main">
        {navTab === 'people' ? (
          <>
            <div className="chat-header">
              <button className="mobile-menu-btn main-menu" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
                <i className="ti ti-menu" aria-hidden="true" />
              </button>
              <div className="chat-header-info">
                <div className="chat-header-name">Find people</div>
                <div className="chat-header-sub">Search by username and start a private chat instantly.</div>
              </div>
            </div>
            <div className="messages-wrap" style={{ padding: '20px 24px', gap: 14 }}>
              <div className="search-wrap">
                <div className="search-input-wrap" style={{ width: '100%' }}>
                  <i className="ti ti-search search-icon" aria-hidden="true" />
                  <input placeholder="Search username..." value={peopleSearch} onChange={e => searchUsers(e.target.value)} />
                </div>
              </div>

              {peopleLoading && (
                <div className="empty-state" style={{ padding: '40px 0' }}>
                  <div className="empty-title">Searching users...</div>
                </div>
              )}

              {!peopleLoading && peopleSearch.trim() !== '' && peopleResults.length === 0 && (
                <div className="empty-state" style={{ padding: '40px 0' }}>
                  <i className="ti ti-user-search empty-icon" aria-hidden="true" style={{ fontSize:48, color:'var(--text-muted)' }} />
                  <div className="empty-title">No users found</div>
                  <div className="empty-sub">Try another username or ask the person to register.</div>
                </div>
              )}

              {peopleResults.map((user) => (
                <div key={user._id} className="conv-item" style={{ margin:'8px 6px', alignItems:'center' }}>
                  <div className="avatar-wrap">
                    <Avatar contact={{ name: user.name, color: AVATAR_COLORS[3] }} radius="50%" size={40} />
                  </div>
                  <div className="conv-info">
                    <div className="conv-name">{user.name}</div>
                    <div className="conv-preview">@{user.username}</div>
                  </div>
                  <div className="conv-meta">
                    <button className="send-btn" style={{ minWidth: '82px', width: 'auto', borderRadius: '14px', padding: '10px 14px' }} onClick={() => openUserChat(user.username)}>
                      Chat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : navTab === 'profile' ? (
          <>
            <div className="chat-header">
              <button className="mobile-menu-btn main-menu" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
                <i className="ti ti-menu" aria-hidden="true" />
              </button>
              <div className="chat-header-info">
                <div className="chat-header-name">Account profile</div>
                <div className="chat-header-sub">Edit your profile, update security, and refresh your display.</div>
              </div>
              <div className="chat-header-actions">
                <button className="icon-btn" title="Back to chats" onClick={() => changeTab('chats')}>
                  <i className="ti ti-arrow-left" aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="messages-wrap" style={{ padding: '28px 24px', gap: 18 }}>
              <div className="profile-card">
                <div className="profile-top">
                  <div className="profile-avatar">
                    <Avatar contact={meContact} size={80} />
                  </div>
                  <div className="profile-summary">
                    <div className="profile-name">{currentUser?.name}</div>
                    <div className="profile-username">@{currentUser?.username}</div>
                    <div className="profile-note">Email: {currentUser?.email}</div>
                    <div className="profile-note">Joined: {joinedOn}</div>
                  </div>
                </div>

                {profileMode === 'view' ? (
                  <>
                    <div className="profile-grid">
                      <section className="profile-section">
                        <h3>Summary</h3>
                        <p>Review your current account profile and open the edit page when ready.</p>
                        <div className="profile-field-grid">
                          <div className="field" style={{ marginBottom: 0 }}>
                            <label>Name</label>
                            <div style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{currentUser?.name}</div>
                          </div>
                          <div className="field" style={{ marginBottom: 0 }}>
                            <label>Username</label>
                            <div style={{ color: 'var(--text-primary)' }}>@{currentUser?.username}</div>
                          </div>
                          <div className="field" style={{ marginBottom: 0 }}>
                            <label>Email</label>
                            <div style={{ color: 'var(--text-primary)' }}>{currentUser?.email}</div>
                          </div>
                        </div>
                      </section>
                    </div>

                    {(profileError || profileMessage) && (
                      <div className={profileError ? 'profile-error' : 'profile-message'}>
                        {profileError || profileMessage}
                      </div>
                    )}

                    <div className="profile-submit-row">
                      <button className="profile-action-btn btn-primary" onClick={() => setProfileMode('edit')}>Edit profile</button>
                      <button className="profile-action-btn" style={{ background: 'var(--accent)', color: '#020f0c' }} onClick={() => setProfileMode('edit')}>Change password</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="profile-grid">
                      <section className="profile-section">
                        <h3>Edit profile</h3>
                        <p>Update your display name, username, or profile photo. These changes will appear across the app immediately.</p>
                        <div className="profile-field-grid">
                          <div className="field" style={{ marginBottom: 0 }}>
                            <label>Profile photo</label>
                            <input type="file" accept="image/*" onChange={handleProfileImageChange} />
                          </div>
                          <div className="field" style={{ marginBottom: 0 }}>
                            <label>Name</label>
                            <input value={profileForm.name} onChange={e => setProfileForm((prev) => ({ ...prev, name: e.target.value }))} />
                          </div>
                          <div className="field" style={{ marginBottom: 0 }}>
                            <label>Username</label>
                            <input value={profileForm.username} onChange={e => setProfileForm((prev) => ({ ...prev, username: e.target.value.toLowerCase() }))} />
                          </div>
                        </div>
                      </section>

                      <section className="profile-section">
                        <h3>Security</h3>
                        <p>Use your current password to set a new password for your account.</p>
                        <div className="profile-field-grid">
                          <div className="field" style={{ marginBottom: 0 }}>
                            <label>Current password</label>
                            <input type="password" value={passwordForm.oldPassword} onChange={e => setPasswordForm((prev) => ({ ...prev, oldPassword: e.target.value }))} />
                          </div>
                          <div className="field" style={{ marginBottom: 0 }}>
                            <label>New password</label>
                            <input type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))} />
                          </div>
                        </div>
                      </section>
                    </div>

                    {(profileError || profileMessage) && (
                      <div className={profileError ? 'profile-error' : 'profile-message'}>
                        {profileError || profileMessage}
                      </div>
                    )}

                    <div className="profile-submit-row">
                      <button className="profile-action-btn btn-primary" onClick={saveProfile}>Save profile</button>
                      <button className="profile-action-btn" onClick={changePassword} style={{ background: 'var(--accent)', color: '#020f0c' }}>Update password</button>
                    </div>
                  </>
                )}

                <button className="theme-toggle" onClick={toggleTheme}>
                  <span>{theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}</span>
                  <i className={`ti ${theme === 'dark' ? 'ti-sun' : 'ti-moon'}`} aria-hidden="true" />
                </button>
                <button className="profile-action-btn" style={{ background: 'var(--danger)', color: '#fff' }} onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </div>
          </>
        ) : !selected ? (
          <div className="empty-state">
            <i className="ti ti-messages empty-icon" aria-hidden="true" style={{ fontSize:56, color:"var(--text-muted)" }} />
            <div className="empty-title">Select a conversation</div>
            <div className="empty-sub">Pick a chat from the sidebar to start messaging</div>
          </div>
        ) : (
          <>
            <div className="chat-header">
              <button className="mobile-menu-btn main-menu" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
                <i className="ti ti-menu" aria-hidden="true" />
              </button>
              <div className="avatar-wrap">
                <Avatar contact={selected} radius={selected.isGroup ? "13px" : "50%"} />
                <span className={`status-dot ${selected.status}`} />
              </div>
              <div className="chat-header-info">
                <div className="chat-header-name">{selected.name}</div>
                <div className="chat-header-sub">
                  {selected.status === "online"
                    ? <><span className="pulse-dot" />Active now</>
                    : selected.status === "away"
                    ? "Away"
                    : `${selected.role}`}
                </div>
              </div>
              <div className="chat-header-actions">
                <button className="icon-btn" title="Voice Call" onClick={() => showToast("Voice calling coming soon!")}>
                  <i className="ti ti-phone" aria-hidden="true" />
                </button>
                <button className="icon-btn" title="Video Call" onClick={() => showToast("Video calling coming soon!")}>
                  <i className="ti ti-video" aria-hidden="true" />
                </button>
                <button className="icon-btn" title="Info">
                  <i className="ti ti-info-circle" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="messages-wrap">
              <div className="msg-date-sep">Today</div>
              {msgs.map((msg) => {
                const isSent = msg.senderId?.toString() === currentUser?._id?.toString();
                return (
                <div key={msg.id} className={`msg-row ${isSent ? "sent" : "recv"}`}>
                  {msg.from !== "me" && (
                    <div className="msg-avatar" style={{ background: selected.color[0], color: selected.color[1] }}>
                      {selected.isGroup && msg.sender ? msg.sender[0].toUpperCase() : initials(selected.name)}
                    </div>
                  )}
                  <div>
                    {selected.isGroup && !isSent && msg.senderName && (
                      <div style={{ fontSize:11, color:"var(--text-muted)", marginBottom:3, paddingLeft:2 }}>{msg.senderName}</div>
                    )}
                    <div className="msg-bubble">
                      {msg.type === "image" && (
                        <div className="media-placeholder">
                          <i className="ti ti-photo" aria-hidden="true" />
                          <span>{msg.caption || "image.png"}</span>
                        </div>
                      )}
                      {msg.text && msg.text}
                    </div>
                    <div className="msg-time">
                      {msg.time}
                      {isSent && <i className="ti ti-checks check-icon" aria-hidden="true" />}
                    </div>
                  </div>
                </div>
              );})}
              {isTyping && (
                <div className="typing-indicator">
                  <div className="typing-dots">
                    <span /><span /><span />
                  </div>
                  <span>{selected.name.split(" ")[0]} is typing...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="input-area">
              <div className="input-box">
                <div className="input-actions">
                  <button className="attach-btn" title="Attach file" onClick={() => showToast("File sharing — click to attach")}>
                    <i className="ti ti-paperclip" aria-hidden="true" />
                  </button>
                  <button className="attach-btn" title="Send photo" onClick={() => showToast("Photo sharing coming soon!")}>
                    <i className="ti ti-photo" aria-hidden="true" />
                  </button>
                </div>
                <textarea
                  ref={textareaRef}
                  rows={1}
                  placeholder={`Message ${selected.name.split(" ")[0]}...`}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={onKeyDown}
                  style={{ minHeight:22 }}
                />
                <button className="attach-btn" title="Emoji">
                  <i className="ti ti-mood-smile" aria-hidden="true" />
                </button>
              </div>
              <button className="send-btn" onClick={sendMessage} title="Send">
                <i className="ti ti-send-2" aria-hidden="true" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
