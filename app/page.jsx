"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@clerk/nextjs';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

// Terminal animation scenes
const terminalScenes = [
  {
    lines: [
      { type: 'cmd', text: '605b parse --report equifax.pdf', delay: 0 },
      { type: 'out', text: 'Parsing credit report...', delay: 800 },
      { type: 'out', text: 'Extracted 47 tradelines', delay: 400 },
      { type: 'out', text: 'Scanning for discrepancies...', delay: 300 },
      { type: 'error', text: '→ 3 discrepancies flagged for review', delay: 600 },
      { type: 'out', text: '  Capital One: Date inconsistency (FCRA §611)', delay: 150 },
      { type: 'out', text: '  Midland MCM: Unverified account (FDCPA §809)', delay: 150 },
      { type: 'out', text: '  AT&T: Balance mismatch (FCRA §623)', delay: 150 },
    ],
    pause: 2500
  },
  {
    lines: [
      { type: 'cmd', text: '605b generate --all-discrepancies', delay: 0 },
      { type: 'out', text: 'Selecting applicable statutes...', delay: 600 },
      { type: 'out', text: 'Building reinvestigation requests...', delay: 500 },
      { type: 'success', text: '✓ Letter 1: Equifax — FCRA §611 dispute', delay: 400 },
      { type: 'success', text: '✓ Letter 2: TransUnion — FDCPA §809 validation', delay: 200 },
      { type: 'success', text: '✓ Letter 3: Experian — FCRA §623 direct dispute', delay: 200 },
      { type: 'out', text: 'Letters saved to /documents', delay: 400 },
    ],
    pause: 2500
  },
  {
    lines: [
      { type: 'cmd', text: '605b tracker --status', delay: 0 },
      { type: 'out', text: 'Fetching dispute status...', delay: 500 },
      { type: 'out', text: '', delay: 200 },
      { type: 'out', text: '  Equifax      Sent Jan 8     ⏳ 22 days remaining', delay: 150 },
      { type: 'out', text: '  TransUnion   Sent Jan 10    ⏳ 24 days remaining', delay: 150 },
      { type: 'success', text: '  Experian     RESPONSE RECEIVED', delay: 150 },
      { type: 'out', text: '', delay: 300 },
      { type: 'success', text: '3 of 3 responses received', delay: 400 },
    ],
    pause: 2500
  },
  {
    lines: [
      { type: 'cmd', text: '605b inbox --check', delay: 0 },
      { type: 'out', text: 'Checking for bureau responses...', delay: 600 },
      { type: 'success', text: '✓ New response from Equifax', delay: 500 },
      { type: 'out', text: '  Status: Investigation complete', delay: 200 },
      { type: 'out', text: '  Result: Item verified as accurate', delay: 200 },
      { type: 'out', text: '', delay: 300 },
      { type: 'cmd', text: '605b escalate --method-of-verification', delay: 800 },
      { type: 'out', text: 'Generating MOV request under FCRA §611(a)(7)...', delay: 500 },
      { type: 'success', text: '✓ Follow-up letter ready for review', delay: 400 },
    ],
    pause: 2500
  },
  {
    lines: [
      { type: 'cmd', text: '605b audit --export', delay: 0 },
      { type: 'out', text: 'Compiling documentation trail...', delay: 500 },
      { type: 'out', text: '  12 letters generated', delay: 200 },
      { type: 'out', text: '  8 responses logged', delay: 150 },
      { type: 'out', text: '  47 timestamps recorded', delay: 150 },
      { type: 'success', text: '✓ Exported to audit_trail_2025.pdf', delay: 400 },
      { type: 'out', text: '', delay: 300 },
      { type: 'success', text: 'Complete record ready for documentation', delay: 300 },
    ],
    pause: 3000
  },
];

// Terminal component with typing animation
function Terminal({ reducedMotion = false }) {
  const terminalBodyRef = useRef(null);
  const [lines, setLines] = useState([]);
  const sceneIndexRef = useRef(0);
  const isRunningRef = useRef(false);

  useEffect(() => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;

    const typeText = async (text, onChar) => {
      for (let i = 0; i <= text.length; i++) {
        onChar(text.slice(0, i));
        await new Promise(r => setTimeout(r, 25));
      }
    };

    const playScene = async (scene) => {
      setLines([]);
      const currentLines = [];

      for (const line of scene.lines) {
        await new Promise(r => setTimeout(r, line.delay));

        if (line.type === 'cmd') {
          const lineId = Date.now();
          currentLines.push({ id: lineId, type: 'cmd', text: '', typing: true });
          setLines([...currentLines]);

          await typeText(line.text, (partial) => {
            const updated = currentLines.map(l =>
              l.id === lineId ? { ...l, text: partial } : l
            );
            setLines([...updated]);
          });

          currentLines[currentLines.length - 1].typing = false;
          setLines([...currentLines]);
        } else {
          currentLines.push({ id: Date.now(), type: line.type, text: line.text, typing: false });
          setLines([...currentLines]);
        }

        if (terminalBodyRef.current) {
          terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
        }
      }

      await new Promise(r => setTimeout(r, scene.pause));
    };

    const runLoop = async () => {
      while (true) {
        await playScene(terminalScenes[sceneIndexRef.current]);
        sceneIndexRef.current = (sceneIndexRef.current + 1) % terminalScenes.length;
      }
    };

    const timer = setTimeout(() => {
      runLoop();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="terminal">
      {!reducedMotion && <div className="terminal-shimmer" />}
      <div className="terminal-bar">
        <span className="terminal-dot r"></span>
        <span className="terminal-dot y"></span>
        <span className="terminal-dot g"></span>
        <span className="terminal-title">605b.ai — reinvestigation</span>
      </div>
      <div className="terminal-body" ref={terminalBodyRef}>
        {lines.map((line) => (
          <div key={line.id} className={`t-line ${line.type === 'cmd' ? '' : 't-out'} ${line.type === 'success' ? 't-success' : ''} ${line.type === 'error' ? 't-error' : ''}`}>
            {line.type === 'cmd' ? (
              <>
                <span className="t-prompt">$</span>
                <span className={`t-cmd ${line.typing ? '' : 'done'}`}>{line.text}</span>
              </>
            ) : (
              line.text
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Feature icons as inline SVGs
const icons = {
  file: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <path d="M14 2v6h6"/>
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 16v-4"/><path d="M12 8h.01"/>
    </svg>
  ),
  grid: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M3 9h18"/><path d="M9 21V9"/>
    </svg>
  ),
  activity: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  flag: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
      <line x1="4" y1="22" x2="4" y2="15"/>
    </svg>
  ),
  edit: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9"/>
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
    </svg>
  ),
};

export default function LandingPage() {
  const { isSignedIn } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [glowVisible, setGlowVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const handler = (e) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    // Debug: confirm component mounted client-side
    console.log("Process animation component mounted");
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      if (!glowVisible) setGlowVisible(true);
    };

    const handleMouseLeave = () => {
      setGlowVisible(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.body.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.body.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [glowVisible]);

  const features = [
    { icon: 'file', title: 'Report Parser', desc: 'Upload PDF reports from all three bureaus. Extract tradelines and flag discrepancies.' },
    { icon: 'info', title: 'Statute Guidance Engine', desc: 'Context-aware assistance for selecting applicable statutes and structuring correspondence.' },
    { icon: 'grid', title: 'Letter Templates', desc: '62 professionally-structured templates covering FCRA, FDCPA, FCBA, and related statutes.' },
    { icon: 'activity', title: 'Response & Deadline Tracker', desc: 'Monitor correspondence status with automated deadline calculations and response logging.' },
    { icon: 'flag', title: 'Discrepancy Queue', desc: 'Review flagged items with reason codes and applicable statute references.' },
    { icon: 'edit', title: 'Audit Trail', desc: 'Complete timestamped history of all actions, exportable for documentation purposes.' },
  ];

  const steps = [
    { num: '01', title: 'Upload', desc: 'Upload credit reports from all three bureaus. We do not store your uploaded PDFs as retrievable files.' },
    { num: '02', title: 'Analyze', desc: 'System parses tradelines, identifies discrepancies, and flags items with applicable statutes.' },
    { num: '03', title: 'Dispute', desc: 'Generate structured correspondence with proper statute citations and deadline tracking.' },
    { num: '04', title: 'Document', desc: 'Log responses, monitor deadlines, maintain complete audit trail.' },
  ];

  const statutes = ['FCRA', 'FDCPA', 'FCBA', 'TILA', 'ECOA', 'RESPA', 'EFTA'];

  return (
    <>
      <style jsx global>{`
        .landing-page {
          font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
        }

        /* Grid background */
        .bg-grid {
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(255, 107, 53, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 107, 53, 0.03) 1px, transparent 1px);
          background-size: 80px 80px;
          pointer-events: none;
          z-index: 0;
        }

        /* Mouse-follow gradient glow */
        .bg-glow {
          position: fixed;
          width: 800px;
          height: 800px;
          background: radial-gradient(circle, rgba(255, 107, 53, 0.08) 0%, transparent 70%);
          pointer-events: none;
          z-index: 1;
          transform: translate(-50%, -50%);
          transition: opacity 0.3s ease;
          opacity: 0;
        }

        .bg-glow.visible {
          opacity: 1;
        }

        /* Navigation */
        nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          padding: 0 32px;
          height: 96px;
          min-height: 80px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(12, 12, 12, 0.8);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.12);
          animation: slideDown 0.6s ease forwards;
        }

        @media (min-width: 768px) {
          nav {
            min-height: 96px;
          }
        }

        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: var(--text);
          transition: opacity 0.2s;
        }

        .logo:hover {
          opacity: 0.85;
        }

        .logo-icon {
          width: 44px;
          height: 44px;
          flex-shrink: 0;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .logo:hover .logo-icon {
          transform: scale(1.05) rotate(-3deg);
        }

        .logo-text {
          display: flex;
          align-items: baseline;
          line-height: 1;
          letter-spacing: -0.02em;
        }

        .logo-text-main {
          font-size: 24px;
          font-weight: 600;
          color: var(--text);
        }

        .logo-text-ext {
          font-size: 24px;
          font-weight: 600;
          color: var(--orange);
          margin-left: 0;
        }

        .nav-center {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        @media (min-width: 1024px) {
          .nav-center {
            gap: 40px;
          }
        }

        @media (min-width: 1280px) {
          .nav-center {
            gap: 48px;
          }
        }

        .nav-link {
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 18px;
          font-weight: 500;
          padding: 14px 12px;
          border-radius: 6px;
          transition: all 0.2s;
          position: relative;
        }

        @media (min-width: 1024px) {
          .nav-link {
            font-size: 20px;
            padding: 14px 16px;
          }
        }

        .nav-link::after {
          content: '';
          position: absolute;
          bottom: 6px;
          left: 16px;
          right: 16px;
          height: 2px;
          background: var(--orange);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.25s ease-out;
        }

        @media (min-width: 1024px) {
          .nav-link::after {
            left: 20px;
            right: 20px;
          }
        }

        .nav-link:hover {
          color: var(--text);
        }

        .nav-link:hover::after {
          transform: scaleX(1);
        }

        .nav-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .btn {
          font-family: inherit;
          font-size: 16px;
          font-weight: 500;
          padding: 10px 20px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        @media (min-width: 768px) {
          .btn {
            font-size: 18px;
            padding: 14px 28px;
          }
        }

        .btn-ghost {
          background: transparent;
          color: var(--text-secondary);
        }

        .btn-ghost:hover {
          color: var(--text);
          background: var(--bg-card);
        }

        .btn-primary {
          background: var(--text);
          color: var(--bg);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 255, 255, 0.15);
        }

        .btn-orange {
          background: var(--orange);
          color: white;
        }

        .btn-orange:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px var(--orange-glow);
        }

        .btn-outline {
          background: transparent;
          color: var(--text);
          border: 1px solid var(--border);
        }

        .btn-outline:hover {
          border-color: var(--orange);
          color: var(--orange);
        }

        .btn-lg {
          padding: 14px 28px;
          font-size: 16px;
        }

        @media (min-width: 768px) {
          .btn-lg {
            padding: 16px 32px;
            font-size: 18px;
          }
        }

        /* Mobile menu button */
        .mobile-menu-btn {
          display: none;
          background: none;
          border: none;
          color: var(--text);
          cursor: pointer;
          padding: 10px;
        }

        .mobile-menu-btn svg {
          width: 28px;
          height: 28px;
        }

        /* Hero */
        .hero {
          position: relative;
          z-index: 10;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 140px 32px 100px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .hero-content {
          order: 1;
        }

        .hero-terminal {
          order: 2;
        }

        .hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          font-weight: 500;
          color: var(--orange);
          margin-bottom: 20px;
          opacity: 0;
          animation: fadeInUp 0.6s ease 0.3s forwards;
        }

        .hero-eyebrow::before {
          content: '';
          width: 20px;
          height: 2px;
          background: var(--orange);
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes blink {
          50% { opacity: 0; }
        }

        .hero h1 {
          font-size: clamp(44px, 7vw, 72px);
          font-weight: 700;
          letter-spacing: -0.03em;
          line-height: 1.05;
          margin-bottom: 24px;
          opacity: 0;
          animation: fadeInUp 0.6s ease 0.4s forwards;
        }

        .hero h1 .highlight {
          color: var(--orange);
        }

        .hero-desc {
          font-size: 18px;
          color: var(--text-secondary);
          max-width: 540px;
          line-height: 1.7;
          margin-bottom: 24px;
          opacity: 0;
          animation: fadeInUp 0.6s ease 0.5s forwards;
        }

        .hero-bridge {
          font-size: 15px;
          color: var(--text-muted);
          max-width: 540px;
          line-height: 1.6;
          margin-bottom: 28px;
          opacity: 0;
          animation: fadeInUp 0.6s ease 0.55s forwards;
        }

        .hero-steps {
          margin-bottom: 32px;
          opacity: 0;
          animation: fadeInUp 0.6s ease 0.58s forwards;
        }

        .hero-steps-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 12px;
        }

        .hero-steps-item {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 15px;
          color: var(--text-secondary);
        }

        .hero-steps-num {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          font-weight: 600;
          color: var(--orange);
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--orange-dim);
          border-radius: 4px;
        }

        .hero-steps-note {
          font-size: 13px;
          color: var(--text-muted);
          font-style: italic;
        }

        .hero-buttons {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
          opacity: 0;
          animation: fadeInUp 0.6s ease 0.6s forwards;
        }

        .hero-disclaimer {
          font-size: 13px;
          color: var(--text-muted);
          margin-bottom: 60px;
        }

        /* Terminal */
        .terminal {
          position: relative;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
          max-width: 720px;
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
          opacity: 0;
          animation: fadeInUp 0.8s ease 0.7s forwards;
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s;
        }

        .terminal:hover {
          transform: translateY(-4px);
          box-shadow: 0 32px 64px rgba(0, 0, 0, 0.5);
        }

        .terminal-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 16px 20px;
          background: var(--bg-card);
          border-bottom: 1px solid var(--border);
        }

        .terminal-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          transition: transform 0.2s;
        }

        .terminal:hover .terminal-dot {
          transform: scale(1.2);
        }

        .terminal-dot.r { background: #FF5F56; }
        .terminal-dot.y { background: #FFBD2E; }
        .terminal-dot.g { background: #27C93F; }

        .terminal-title {
          margin-left: 12px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          color: var(--text-muted);
        }

        .terminal-body {
          padding: 24px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 15px;
          line-height: 1.7;
          min-height: 320px;
          max-height: 320px;
          overflow-y: auto;
        }

        @media (min-width: 768px) {
          .terminal-body {
            padding: 32px;
            font-size: 17px;
            min-height: 380px;
            max-height: 380px;
          }
          .terminal-title {
            font-size: 14px;
          }
        }

        .terminal-shimmer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 1;
          background: linear-gradient(
            105deg,
            transparent 0%,
            transparent 40%,
            rgba(255, 122, 51, 0.08) 50%,
            transparent 60%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: shimmer 8s linear infinite;
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .t-line {
          display: flex;
          gap: 10px;
          animation: fadeIn 0.15s ease;
        }

        .t-cmd::after {
          content: '▋';
          animation: blink 1s step-end infinite;
          margin-left: 2px;
          opacity: 0.7;
        }

        .t-cmd.done::after {
          display: none;
        }

        .t-prompt {
          color: var(--orange);
          user-select: none;
        }

        .t-cmd {
          color: var(--text);
        }

        .t-out {
          color: var(--text-muted);
          padding-left: 18px;
        }

        .t-success {
          color: #27C93F;
        }

        .t-error {
          color: var(--orange);
        }

        /* Logos strip */
        .logos {
          position: relative;
          z-index: 10;
          padding: 60px 32px;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          background: var(--bg-secondary);
        }

        .logos-inner {
          max-width: 1200px;
          margin: 0 auto;
          text-align: center;
        }

        .logos-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-muted);
          margin-bottom: 24px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .logos-grid {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 48px;
          flex-wrap: wrap;
        }

        .logo-item {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-muted);
          opacity: 0.4;
          transition: all 0.3s;
          cursor: default;
        }

        .logo-item:hover {
          opacity: 1;
          color: var(--orange);
          transform: translateY(-2px);
        }

        /* Stats */
        .stats {
          position: relative;
          z-index: 10;
          padding: 80px 32px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
        }

        .stat-item {
          text-align: center;
          padding: 24px;
          border-radius: 12px;
          transition: all 0.3s;
        }

        .stat-item:hover {
          background: var(--bg-secondary);
        }

        .stat-value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 44px;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 4px;
          transition: all 0.3s;
        }

        .stat-item:hover .stat-value {
          color: var(--orange);
          transform: scale(1.05);
        }

        .stat-label {
          font-size: 14px;
          color: var(--text-muted);
        }

        .stats-source {
          text-align: center;
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 24px;
          opacity: 0.6;
        }

        /* Features */
        .features {
          position: relative;
          z-index: 10;
          padding: 120px 32px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .section-header {
          text-align: center;
          margin-bottom: 64px;
        }

        .section-eyebrow {
          font-size: 13px;
          font-weight: 600;
          color: var(--orange);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 16px;
        }

        .section-title {
          font-size: clamp(32px, 4vw, 44px);
          font-weight: 700;
          letter-spacing: -0.02em;
          margin-bottom: 16px;
        }

        .section-desc {
          font-size: 17px;
          color: var(--text-secondary);
          max-width: 500px;
          margin: 0 auto;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        .feature-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 28px;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
          overflow: hidden;
        }

        .feature-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--orange), transparent);
          transform: scaleX(0);
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .feature-card:hover {
          border-color: var(--border-hover);
          transform: translateY(-8px);
        }

        .feature-card:hover::before {
          transform: scaleX(1);
        }

        .feature-icon {
          width: 40px;
          height: 40px;
          background: var(--orange-dim);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .feature-card:hover .feature-icon {
          transform: scale(1.1) rotate(-5deg);
          background: var(--orange);
        }

        .feature-card:hover .feature-icon svg {
          stroke: white;
        }

        .feature-icon svg {
          width: 20px;
          height: 20px;
          stroke: var(--orange);
          transition: stroke 0.3s;
        }

        .feature-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .feature-desc {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        /* Steps */
        .steps {
          position: relative;
          z-index: 10;
          padding: 120px 32px;
          background: var(--bg-secondary);
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }

        .steps-inner {
          max-width: 1200px;
          margin: 0 auto;
        }

        .steps-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 32px;
        }

        .step-card {
          text-align: center;
          padding: 24px;
          position: relative;
        }

        .step-card::after {
          content: '';
          position: absolute;
          top: 50px;
          right: -16px;
          width: 32px;
          height: 2px;
          background: var(--border);
        }

        .step-card:last-child::after {
          display: none;
        }

        .step-num {
          font-family: 'JetBrains Mono', monospace;
          font-size: 48px;
          font-weight: 700;
          color: var(--orange);
          opacity: 0.3;
          margin-bottom: 16px;
          transition: opacity 0.25s ease-out;
        }

        .step-card:hover .step-num {
          opacity: 0.5;
        }

        .step-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .step-desc {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        /* CTA */
        .cta {
          position: relative;
          z-index: 10;
          padding: 120px 32px;
          text-align: center;
        }

        .cta-inner {
          max-width: 600px;
          margin: 0 auto;
        }

        .cta h2 {
          font-size: clamp(32px, 5vw, 48px);
          font-weight: 700;
          letter-spacing: -0.02em;
          margin-bottom: 16px;
        }

        .cta p {
          font-size: 17px;
          color: var(--text-secondary);
          margin-bottom: 32px;
        }

        .cta-buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .cta-disclaimer {
          font-size: 13px;
          color: var(--text-muted);
          margin-top: 24px;
        }

        /* Audience filter */
        .audience-filter {
          position: relative;
          z-index: 10;
          padding: 32px;
          text-align: center;
          border-top: 1px solid var(--border);
          background: var(--bg-secondary);
        }

        .audience-filter p {
          font-size: 14px;
          color: var(--text-muted);
          max-width: 600px;
          margin: 0 auto;
        }

        /* Footer */
        footer {
          position: relative;
          z-index: 10;
          padding: 40px 32px;
          border-top: 1px solid var(--border);
        }

        .footer-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .footer-links {
          display: flex;
          gap: 28px;
        }

        .footer-links a {
          font-size: 15px;
          color: var(--text-muted);
          text-decoration: none;
          transition: all 0.2s;
        }

        .footer-links a:hover {
          color: var(--orange);
        }

        .footer-copy {
          font-size: 13px;
          color: var(--text-muted);
        }

        /* Mobile menu */
        .mobile-menu {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--bg);
          z-index: 2000;
          padding: 24px;
          flex-direction: column;
        }

        .mobile-menu.open {
          display: flex;
        }

        .mobile-menu-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 48px;
        }

        .mobile-menu-links {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .mobile-menu-link {
          color: var(--text);
          text-decoration: none;
          font-size: 24px;
          font-weight: 600;
        }

        .mobile-menu-buttons {
          margin-top: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .features-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .steps-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .step-card::after {
            display: none;
          }
        }

        @media (max-width: 768px) {
          nav {
            padding: 0 20px;
            height: 72px;
          }
          .nav-center {
            display: none;
          }
          .nav-right {
            display: none;
          }
          .mobile-menu-btn {
            display: block;
          }
          .hero, .features, .stats, .cta {
            padding-left: 20px;
            padding-right: 20px;
          }
          .hero {
            padding-top: 100px;
          }
          /* Terminal first on mobile */
          .hero-terminal {
            order: 1;
            margin-bottom: 40px;
          }
          .hero-content {
            order: 2;
          }
          .hero-terminal .terminal {
            animation-delay: 0.3s;
          }
          .hero-desc {
            font-size: 16px;
          }
          .terminal {
            max-width: 100%;
          }
          .terminal-body {
            padding: 16px;
            font-size: 12px;
            min-height: 240px;
            max-height: 240px;
            line-height: 1.8;
          }
          .terminal-bar {
            padding: 12px 16px;
          }
          .terminal-title {
            font-size: 11px;
          }
          .features-grid,
          .steps-grid,
          .stats-grid {
            grid-template-columns: 1fr;
          }
          .steps {
            padding: 80px 20px;
          }
          .step-num {
            font-size: 36px;
          }
          .hero-buttons,
          .cta-buttons {
            flex-direction: column;
          }
          .hero-buttons .btn,
          .cta-buttons .btn {
            width: 100%;
            justify-content: center;
          }
          .footer-inner {
            flex-direction: column;
            gap: 20px;
            text-align: center;
          }
          .footer-links {
            flex-wrap: wrap;
            justify-content: center;
            gap: 16px;
          }
          .logos-grid {
            gap: 24px;
          }
          .stat-value {
            font-size: 36px;
          }
        }
      `}</style>

      <div className="landing-page">
        <div className="bg-grid"></div>
        <div
          className={`bg-glow ${glowVisible ? 'visible' : ''}`}
          style={{ left: mousePos.x, top: mousePos.y }}
        />

        {/* Navigation */}
        <nav>
          <Link href="/" className="logo">
            <Image src="/logos/favicons/favicon.svg" alt="605b.ai" width={44} height={44} className="logo-icon" />
            <span className="logo-text">
              <span className="logo-text-main">605b</span><span className="logo-text-ext">.ai</span>
            </span>
          </Link>

          <div className="nav-center">
            <a href="#features" className="nav-link">Tools</a>
            <a href="#steps" className="nav-link">How It Works</a>
            <Link href="/about" className="nav-link">About</Link>
            <Link href="/pricing" className="nav-link">Pricing</Link>
          </div>

          <div className="nav-right">
            {mounted && isSignedIn ? (
              <Link href="/dashboard" className="btn btn-primary">Dashboard</Link>
            ) : (
              <>
                <Link href="/sign-in" className="btn btn-ghost">Sign In</Link>
                <Link href="/sign-up" className="btn btn-primary">Get Started</Link>
              </>
            )}
          </div>

          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(true)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </nav>

        {/* Mobile Menu */}
        <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
          <div className="mobile-menu-header">
            <Link href="/" className="logo">
              <Image src="/logos/favicons/favicon.svg" alt="605b.ai" width={44} height={44} className="logo-icon" />
              <span className="logo-text">
                <span className="logo-text-main">605b</span><span className="logo-text-ext">.ai</span>
              </span>
            </Link>
            <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(false)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div className="mobile-menu-links">
            <a href="#features" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>Tools</a>
            <a href="#steps" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
            <Link href="/about" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>About</Link>
            <Link href="/pricing" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
          </div>
          <div className="mobile-menu-buttons">
            {mounted && isSignedIn ? (
              <Link href="/dashboard" className="btn btn-orange btn-lg" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
            ) : (
              <>
                <Link href="/sign-up" className="btn btn-orange btn-lg" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
                <Link href="/sign-in" className="btn btn-outline btn-lg" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
              </>
            )}
          </div>
        </div>

        {/* Hero */}
        <section className="hero">
          <div className="hero-terminal">
            <Terminal reducedMotion={reducedMotion} />
          </div>
          <div className="hero-content">
            <div className="hero-eyebrow">Statute-Driven Credit Reinvestigation Platform</div>
            <h1>Credit Reinvestigation,<br /><span className="highlight">Structured Under Federal Law</span></h1>
            <p className="hero-desc">
              Generate compliant documentation, track statutory timelines, and maintain
              a complete audit trail — clearly, deliberately, and without shortcuts.
            </p>
            <p className="hero-bridge">
              If you've been told you need a "credit repair company," this gives you self-service software to do the same dispute process yourself—legally, transparently, and without monthly fees.
            </p>
            <div className="hero-steps">
              <div className="hero-steps-list">
                <div className="hero-steps-item">
                  <span className="hero-steps-num">1</span>
                  <span>Generate the documents</span>
                </div>
                <div className="hero-steps-item">
                  <span className="hero-steps-num">2</span>
                  <span>Review them</span>
                </div>
                <div className="hero-steps-item">
                  <span className="hero-steps-num">3</span>
                  <span>Mail them (certified if you choose)</span>
                </div>
              </div>
              <p className="hero-steps-note">You stay in control. Nothing is sent on your behalf.</p>
            </div>
            <div className="hero-buttons">
              {mounted && isSignedIn ? (
                <Link href="/dashboard" className="btn btn-orange btn-lg">Go to Dashboard →</Link>
              ) : (
                <>
                  <Link href="/sign-up" className="btn btn-orange btn-lg">Start Report Analysis →</Link>
                  <a href="#steps" className="btn btn-outline btn-lg">How It Works</a>
                </>
              )}
            </div>
            <p className="hero-disclaimer">Software tools only. No guarantees. Not legal advice.</p>
          </div>
        </section>

        {/* Logos/Statutes strip */}
        <section className="logos">
          <div className="logos-inner">
            <div className="logos-label">Structured Around Federal Consumer Protection Statutes</div>
            <div className="logos-grid">
              {statutes.map((statute) => (
                <span key={statute} className="logo-item">{statute}</span>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="stats">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">62</div>
              <div className="stat-label">Statute-Specific Templates</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">30</div>
              <div className="stat-label">Day Response Window</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">7</div>
              <div className="stat-label">Federal Statutes Covered</div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="features" id="features">
          <div className="section-header">
            <div className="section-eyebrow">Platform</div>
            <h2 className="section-title">Core reinvestigation tools</h2>
            <p className="section-desc">Six tools designed for structured documentation, deadlines, and audit-ready recordkeeping.</p>
          </div>

          <div className="features-grid">
            {features.map((feature, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon">{icons[feature.icon]}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-desc">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Steps */}
        <section className="steps" id="steps">
          <div className="steps-inner">
            <div className="section-header">
              <div className="section-eyebrow">Process</div>
              <h2 className="section-title">From discrepancy to documentation</h2>
              <p className="section-desc">Four structured steps for statute-compliant reinvestigation requests.</p>
            </div>

            <div className="steps-grid">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  className="step-card"
                  initial={reducedMotion ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 10, scale: 1 }}
                  whileInView={{ opacity: 1, y: 0, scale: reducedMotion ? 1 : 1.02 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                >
                  <div className="step-num">{step.num}</div>
                  <h3 className="step-title">{step.title}</h3>
                  <p className="step-desc">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta">
          <div className="cta-inner">
            <h2>Ready to structure your reinvestigation?</h2>
            <p>Start with a report analysis. Identify discrepancies, generate documentation, and track statutory timelines.</p>
            <div className="cta-buttons">
              <Link href="/sign-up" className="btn btn-orange btn-lg">Start Report Analysis →</Link>
              <a href="https://www.annualcreditreport.com" target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-lg">Get Free Reports</a>
            </div>
            <p className="cta-disclaimer">Software tools only. No guarantees. Not legal advice.</p>
          </div>
        </section>

        {/* Audience Filter */}
        <section className="audience-filter">
          <p>If you're looking for someone to "handle everything for you," this isn't that. 605b.ai is self-service software.</p>
        </section>

        {/* Footer */}
        <footer>
          <div className="footer-inner">
            <Link href="/" className="logo">
              <Image src="/logos/favicons/favicon.svg" alt="605b.ai" width={44} height={44} className="logo-icon" />
              <span className="logo-text">
                <span className="logo-text-main">605b</span><span className="logo-text-ext">.ai</span>
              </span>
            </Link>

            <div className="footer-links">
              <a href="https://www.annualcreditreport.com" target="_blank" rel="noopener noreferrer">Annual Credit Report</a>
              <a href="https://www.cfpb.gov" target="_blank" rel="noopener noreferrer">CFPB</a>
              <a href="https://www.ftc.gov" target="_blank" rel="noopener noreferrer">FTC</a>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
            </div>

            <div className="footer-copy">© {new Date().getFullYear()} Ninth Wave Analytics LLC. Software tools only.</div>
          </div>
        </footer>
      </div>
    </>
  );
}
