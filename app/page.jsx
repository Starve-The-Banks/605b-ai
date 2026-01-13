"use client";

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { ArrowRight, Shield, Clock, FileText, Scale, Upload, Flag, BarChart3, Menu, X, ChevronDown, Lock, Eye, Send } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

// Interactive particle field component
function ParticleField() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const particlesRef = useRef([]);
  const animationRef = useRef(null);
  const isMobileRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = canvas.offsetWidth;
    let height = canvas.offsetHeight;

    // Check if mobile
    const checkMobile = () => {
      isMobileRef.current = window.innerWidth < 768;
    };
    checkMobile();

    const setSize = () => {
      checkMobile();
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      initParticles();
    };

    const initParticles = () => {
      particlesRef.current = [];
      // Wider spacing on mobile = fewer particles = better performance
      const spacing = isMobileRef.current ? 120 : 80;
      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          particlesRef.current.push({
            baseX: i * spacing + (j % 2) * (spacing / 2),
            baseY: j * spacing,
            x: i * spacing + (j % 2) * (spacing / 2),
            y: j * spacing,
            size: isMobileRef.current ? Math.random() * 1 + 0.6 : Math.random() * 1.2 + 0.8,
            opacity: Math.random() * 0.15 + 0.05,
          });
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      const particles = particlesRef.current;
      const isMobile = isMobileRef.current;

      // Update positions
      particles.forEach((p) => {
        const dx = mouseRef.current.x - p.x;
        const dy = mouseRef.current.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = isMobile ? 100 : 150;

        if (dist < maxDist) {
          const force = (maxDist - dist) / maxDist;
          const angle = Math.atan2(dy, dx);
          p.x = p.baseX - Math.cos(angle) * force * (isMobile ? 20 : 25);
          p.y = p.baseY - Math.sin(angle) * force * (isMobile ? 20 : 25);
        } else {
          p.x += (p.baseX - p.x) * 0.06;
          p.y += (p.baseY - p.y) * 0.06;
        }
      });

      // Draw connections (skip on mobile for performance)
      if (!isMobile) {
        const connectionDist = 100;
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const p1 = particles[i];
            const p2 = particles[j];
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < connectionDist) {
              const opacity = (1 - dist / connectionDist) * 0.08;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = `rgba(247, 208, 71, ${opacity})`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }
        }
      }

      // Draw particles
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(247, 208, 71, ${p.opacity})`;
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    // Mouse events (desktop)
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    // Touch events (mobile)
    const handleTouchMove = (e) => {
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        mouseRef.current = {
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top,
        };
      }
    };

    const handleTouchEnd = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    setSize();
    animate();

    window.addEventListener('resize', setSize);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });
    canvas.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('resize', setSize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'auto',
        zIndex: 0,
      }}
    />
  );
}

export default function LandingPage() {
  const { isSignedIn } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }
        
        .landing-page {
          min-height: 100vh;
          background: #09090b;
          color: #fafafa;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        /* Navigation */
        .nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          padding: 16px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(9, 9, 11, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        
        .logo {
          font-size: 22px;
          font-weight: 700;
          color: #fafafa;
          text-decoration: none;
        }
        
        .logo-accent {
          color: #f7d047;
        }
        
        .nav-links {
          display: flex;
          gap: 24px;
          align-items: center;
        }
        
        .nav-link {
          color: #a1a1aa;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
        }
        
        .nav-link:hover {
          color: #fafafa;
        }
        
        .nav-button {
          padding: 8px 16px;
          background: transparent;
          border: 1px solid #27272a;
          border-radius: 8px;
          color: #fafafa;
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
        }
        
        .nav-button-primary {
          padding: 8px 16px;
          background: #f7d047;
          border: none;
          border-radius: 8px;
          color: #09090b;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
        }
        
        .mobile-menu-btn {
          display: none;
          background: none;
          border: none;
          color: #fafafa;
          cursor: pointer;
          padding: 8px;
        }
        
        .mobile-menu {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: #09090b;
          z-index: 200;
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
          color: #fafafa;
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
        
        /* Hero - New Design */
        .hero {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 120px 24px 80px;
          position: relative;
          background: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(247, 208, 71, 0.08), transparent);
          overflow: hidden;
        }
        
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          background: rgba(247, 208, 71, 0.08);
          border: 1px solid rgba(247, 208, 71, 0.15);
          border-radius: 100px;
          font-size: 13px;
          font-weight: 500;
          color: #f7d047;
          margin-bottom: 32px;
          letter-spacing: 0.02em;
        }
        
        .hero-title {
          font-size: clamp(36px, 9vw, 72px);
          font-weight: 700;
          line-height: 1.05;
          letter-spacing: -0.035em;
          margin-bottom: 24px;
          max-width: 900px;
        }
        
        .hero-title-accent {
          color: #f7d047;
        }
        
        .hero-subtitle {
          font-size: clamp(17px, 2.5vw, 20px);
          line-height: 1.6;
          color: #a1a1aa;
          max-width: 640px;
          margin-bottom: 12px;
        }
        
        .hero-note {
          font-size: 14px;
          color: #52525b;
          margin-bottom: 40px;
          font-style: italic;
        }
        
        .hero-cta {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
          margin-bottom: 48px;
        }
        
        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 16px 28px;
          background: #f7d047;
          border: none;
          border-radius: 10px;
          color: #09090b;
          font-size: 16px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
        }
        
        .btn-primary:hover {
          background: #e5c33f;
          transform: translateY(-2px);
        }
        
        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 16px 28px;
          background: transparent;
          border: 1px solid #27272a;
          border-radius: 10px;
          color: #fafafa;
          font-size: 16px;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.2s;
        }
        
        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: #3f3f46;
        }
        
        .hero-trust {
          display: flex;
          gap: 32px;
          flex-wrap: wrap;
          justify-content: center;
          padding-top: 32px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        
        .hero-trust-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #71717a;
        }
        
        .hero-trust-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(247, 208, 71, 0.08);
          border-radius: 8px;
          color: #f7d047;
        }
        
        .scroll-indicator {
          position: absolute;
          bottom: 32px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: #52525b;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          cursor: pointer;
          transition: color 0.2s;
        }
        
        .scroll-indicator:hover {
          color: #f7d047;
        }
        
        .scroll-indicator svg {
          animation: bounceDown 2s ease-in-out infinite;
        }
        
        @keyframes bounceDown {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(8px); }
          60% { transform: translateY(4px); }
        }
        
        /* Why Section - Primary Asset */
        .why-section {
          padding: 100px 24px;
          background: #09090b;
          border-top: 1px solid rgba(255, 255, 255, 0.04);
        }
        
        .why-container {
          max-width: 720px;
          margin: 0 auto;
        }
        
        .why-label {
          font-size: 12px;
          font-weight: 600;
          color: #f7d047;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin-bottom: 16px;
        }
        
        .why-title {
          font-size: clamp(28px, 5vw, 40px);
          font-weight: 700;
          letter-spacing: -0.02em;
          margin-bottom: 32px;
          line-height: 1.2;
        }
        
        .why-content {
          font-size: 17px;
          line-height: 1.8;
          color: #a1a1aa;
        }
        
        .why-content p {
          margin-bottom: 24px;
        }
        
        .why-content strong {
          color: #fafafa;
          font-weight: 500;
        }
        
        .why-highlight {
          padding: 24px 28px;
          background: rgba(247, 208, 71, 0.06);
          border-left: 3px solid #f7d047;
          border-radius: 0 12px 12px 0;
          margin: 32px 0;
          font-size: 16px;
          color: #e5e5e5;
          font-style: italic;
        }
        
        .why-closing {
          font-size: 18px;
          color: #fafafa;
          font-weight: 500;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          margin-top: 32px;
        }
        
        /* Sections */
        .section {
          padding: 80px 24px;
        }
        
        .section-dark {
          background: #0c0c0e;
        }
        
        .container {
          max-width: 1100px;
          margin: 0 auto;
        }
        
        .section-label {
          font-size: 12px;
          font-weight: 600;
          color: #f7d047;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin-bottom: 12px;
        }
        
        .section-title {
          font-size: clamp(24px, 5vw, 32px);
          font-weight: 700;
          letter-spacing: -0.02em;
          margin-bottom: 12px;
        }
        
        .section-subtitle {
          font-size: 15px;
          color: #a1a1aa;
          margin-bottom: 40px;
          max-width: 500px;
        }
        
        /* Steps */
        .steps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
        }
        
        .step-card {
          padding: 24px;
          background: #111113;
          border: 1px solid #1c1c1f;
          border-radius: 12px;
          transition: all 0.2s;
        }
        
        .step-card:hover {
          border-color: #27272a;
          transform: translateY(-2px);
        }
        
        .step-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(247, 208, 71, 0.1);
          border-radius: 10px;
          color: #f7d047;
          margin-bottom: 16px;
        }
        
        .step-number {
          font-size: 13px;
          font-weight: 600;
          color: #52525b;
          margin-bottom: 8px;
        }
        
        .step-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #fafafa;
        }
        
        .step-desc {
          font-size: 14px;
          color: #a1a1aa;
          line-height: 1.6;
        }
        
        /* Features */
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
        }
        
        .feature-card {
          padding: 24px;
          background: #0f0f11;
          border: 1px solid #1c1c1f;
          border-radius: 12px;
          transition: all 0.2s;
        }
        
        .feature-card:hover {
          border-color: #27272a;
        }
        
        .feature-icon {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(247, 208, 71, 0.1);
          border-radius: 10px;
          margin-bottom: 16px;
          color: #f7d047;
        }
        
        .feature-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #fafafa;
        }
        
        .feature-desc {
          font-size: 14px;
          line-height: 1.6;
          color: #a1a1aa;
        }
        
        /* Statutes */
        .statute-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
        }
        
        .statute-card {
          padding: 28px;
          background: #111113;
          border: 1px solid #1c1c1f;
          border-radius: 12px;
          transition: all 0.2s;
        }
        
        .statute-card:hover {
          border-color: rgba(247, 208, 71, 0.3);
        }
        
        .statute-number {
          font-size: 28px;
          font-weight: 700;
          color: #f7d047;
          margin-bottom: 8px;
        }
        
        .statute-name {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 12px;
          color: #fafafa;
        }
        
        .statute-desc {
          font-size: 14px;
          color: #a1a1aa;
          line-height: 1.6;
        }
        
        /* CTA */
        .cta-section {
          padding: 100px 24px;
          text-align: center;
          background: linear-gradient(180deg, #09090b 0%, #0c0c0e 100%);
        }
        
        .cta-title {
          font-size: clamp(28px, 5vw, 40px);
          font-weight: 700;
          margin-bottom: 16px;
          letter-spacing: -0.02em;
        }
        
        .cta-subtitle {
          font-size: 17px;
          color: #a1a1aa;
          margin-bottom: 32px;
          max-width: 500px;
          margin-left: auto;
          margin-right: auto;
        }
        
        .cta-disclaimer {
          font-size: 13px;
          color: #52525b;
          margin-top: 20px;
        }
        
        /* Footer */
        .footer {
          border-top: 1px solid #1c1c1f;
          padding: 0 24px;
          background: #0c0c0e;
        }
        
        .footer-main {
          display: flex;
          flex-direction: column;
          gap: 32px;
          padding: 48px 0;
          border-bottom: 1px solid #1c1c1f;
        }
        
        .footer-brand {
          max-width: 300px;
        }
        
        .footer-logo {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 12px;
          color: #fafafa;
        }
        
        .footer-tagline {
          font-size: 14px;
          color: #71717a;
          line-height: 1.6;
        }
        
        .footer-links {
          display: flex;
          flex-wrap: wrap;
          gap: 48px;
        }
        
        .footer-column {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .footer-column-title {
          font-size: 13px;
          font-weight: 600;
          color: #fafafa;
          margin-bottom: 4px;
        }
        
        .footer-link {
          font-size: 14px;
          color: #71717a;
          text-decoration: none;
        }
        
        .footer-link:hover {
          color: #f7d047;
        }
        
        .footer-disclaimer {
          padding: 24px 0;
          border-bottom: 1px solid #1c1c1f;
        }
        
        .disclaimer-text {
          font-size: 12px;
          color: #52525b;
          line-height: 1.7;
        }
        
        .footer-bottom {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 24px 0;
          font-size: 13px;
          color: #52525b;
        }
        
        .footer-bottom-links {
          display: flex;
          gap: 24px;
        }
        
        .footer-bottom-link {
          font-size: 13px;
          color: #52525b;
          text-decoration: none;
        }
        
        .footer-bottom-link:hover {
          color: #f7d047;
        }
        
        /* Mobile Responsive */
        @media (max-width: 768px) {
          .nav-links {
            display: none;
          }
          
          .mobile-menu-btn {
            display: block;
            min-width: 44px;
            min-height: 44px;
          }
          
          .hero {
            padding: 100px 20px 60px;
            min-height: auto;
          }
          
          .hero-badge {
            font-size: 12px;
            padding: 8px 14px;
          }
          
          .hero-subtitle {
            font-size: 16px;
          }
          
          .hero-note {
            font-size: 13px;
          }
          
          .hero-cta {
            width: 100%;
            max-width: 320px;
          }
          
          .btn-primary, .btn-secondary {
            padding: 14px 24px;
            font-size: 15px;
            width: 100%;
            justify-content: center;
            min-height: 48px;
          }
          
          .hero-trust {
            gap: 20px;
            padding-top: 24px;
          }
          
          .hero-trust-item {
            font-size: 12px;
          }
          
          .scroll-indicator {
            display: none;
          }
          
          .why-section {
            padding: 60px 20px;
          }
          
          .why-content {
            font-size: 16px;
          }
          
          .why-highlight {
            padding: 20px 24px;
            font-size: 15px;
          }
          
          .section {
            padding: 60px 20px;
          }
          
          .section-subtitle {
            margin-bottom: 32px;
          }
          
          .steps-grid {
            grid-template-columns: 1fr;
          }
          
          .features-grid {
            grid-template-columns: 1fr;
          }
          
          .statute-grid {
            grid-template-columns: 1fr;
          }
          
          .cta-section .btn-primary {
            max-width: 320px;
          }
          
          .footer-main {
            flex-direction: column;
          }
          
          .footer-links {
            gap: 32px;
          }
          
          .mobile-menu-link {
            min-height: 44px;
            display: flex;
            align-items: center;
          }
        }
        
        @media (min-width: 769px) {
          .footer-main {
            flex-direction: row;
            justify-content: space-between;
          }
          
          .footer-bottom {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
        }
      `}</style>

      <div className="landing-page">
        {/* Navigation */}
        <nav className="nav">
          <Link href="/" className="logo">
            605b<span className="logo-accent">.ai</span>
          </Link>
          <div className="nav-links">
            <a href="#why" className="nav-link">Why</a>
            <a href="#how-it-works" className="nav-link">How It Works</a>
            <Link href="/about" className="nav-link">About</Link>
            <Link href="/pricing" className="nav-link">Pricing</Link>
            {isSignedIn ? (
              <Link href="/dashboard" className="nav-button-primary">Dashboard</Link>
            ) : (
              <>
                <Link href="/sign-in" className="nav-button">Log In</Link>
                <Link href="/sign-up" className="nav-button-primary">Get Started</Link>
              </>
            )}
          </div>
          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(true)}>
            <Menu size={24} />
          </button>
        </nav>

        {/* Mobile Menu */}
        <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
          <div className="mobile-menu-header">
            <span className="logo">605b<span className="logo-accent">.ai</span></span>
            <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(false)}>
              <X size={24} />
            </button>
          </div>
          <div className="mobile-menu-links">
            <a href="#why" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>Why</a>
            <a href="#how-it-works" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
            <Link href="/about" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>About</Link>
            <Link href="/pricing" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
          </div>
          <div className="mobile-menu-buttons">
            {isSignedIn ? (
              <Link href="/dashboard" className="btn-primary" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
            ) : (
              <>
                <Link href="/sign-up" className="btn-primary" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
                <Link href="/sign-in" className="btn-secondary" onClick={() => setMobileMenuOpen(false)}>Log In</Link>
              </>
            )}
          </div>
        </div>

        {/* Hero - New Copy */}
        <section className="hero">
          <ParticleField />
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="hero-badge">
              <Shield size={14} />
              Self-Service Software
            </div>
            <h1 className="hero-title">
              All the tools. One place.<br />
              <span className="hero-title-accent">You stay in control.</span>
            </h1>
            <p className="hero-subtitle">
              Self-service software that organizes the credit dispute and identity theft 
              process into a clear, transparent workflow. No monthly fees. No promises. 
              No one acting on your behalf.
            </p>
            <p className="hero-note">
              If you can follow directions and mail certified letters, you can use this.
            </p>
            <div className="hero-cta">
              {isSignedIn ? (
                <Link href="/dashboard" className="btn-primary">
                  Go to Dashboard <ArrowRight size={18} />
                </Link>
              ) : (
                <>
                  <Link href="/sign-up" className="btn-primary">
                    Get Started Free <ArrowRight size={18} />
                  </Link>
                  <Link href="/pricing" className="btn-secondary">
                    View Pricing
                  </Link>
                </>
              )}
            </div>
            <div className="hero-trust">
              <div className="hero-trust-item">
                <div className="hero-trust-icon"><Eye size={16} /></div>
                <span>Nothing hidden</span>
              </div>
              <div className="hero-trust-item">
                <div className="hero-trust-icon"><Lock size={16} /></div>
                <span>You control everything</span>
              </div>
              <div className="hero-trust-item">
                <div className="hero-trust-icon"><Send size={16} /></div>
                <span>You send it yourself</span>
              </div>
            </div>
          </div>
          <a href="#why" className="scroll-indicator">
            <span>Learn why</span>
            <ChevronDown size={20} />
          </a>
        </section>

        {/* Why 605b.ai Exists - Primary Asset */}
        <section className="why-section" id="why">
          <div className="why-container">
            <div className="why-label">Our Philosophy</div>
            <h2 className="why-title">Why 605b.ai Exists</h2>
            <div className="why-content">
              <p>
                <strong>The lawful credit dispute process isn't secret — it's fragmented.</strong>
              </p>
              <p>
                Over time, that fragmentation gave rise to an industry built around acting as an 
                intermediary between people and their own rights. Most services operate behind 
                the scenes, charge ongoing fees, reuse generic templates, and keep the mechanics opaque.
              </p>
              <p>
                <strong>We took the opposite approach.</strong>
              </p>
              <p>
                605b.ai compiles and structures the real dispute process into self-service software 
                that keeps everything transparent and user-controlled. Nothing is sent on your behalf. 
                Nothing is hidden. You generate the documents, review them, and send them yourself.
              </p>
              <div className="why-highlight">
                In practice, this is a decentralization of a service model that depends on opacity and dependency.
              </div>
              <p className="why-closing">
                If you can follow directions and go to the post office, you can use this.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="section section-dark" id="how-it-works">
          <div className="container">
            <div className="section-label">How It Works</div>
            <h2 className="section-title">A systematic workflow</h2>
            <p className="section-subtitle">
              Organize your dispute process with software tools designed around FCRA procedures.
            </p>
            <div className="steps-grid">
              {[
                { icon: Upload, num: '01', title: 'Upload & Identify', desc: 'Upload your credit reports. Our software helps you identify items you may want to review or dispute.' },
                { icon: FileText, num: '02', title: 'Generate Documents', desc: 'Choose from 62+ letter templates based on FCRA sections. Customize with your specific information.' },
                { icon: Flag, num: '03', title: 'Track Your Workflow', desc: 'Log sent correspondence, track statutory response windows, and maintain an organized timeline.' },
                { icon: BarChart3, num: '04', title: 'Document Everything', desc: 'Maintain an audit trail of all actions. Export records for your personal documentation.' },
              ].map((step, i) => (
                <div key={i} className="step-card">
                  <div className="step-icon"><step.icon size={24} /></div>
                  <div className="step-number">{step.num}</div>
                  <h3 className="step-title">{step.title}</h3>
                  <p className="step-desc">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="section" id="features">
          <div className="container">
            <div className="section-label">Features</div>
            <h2 className="section-title">Software tools for organization</h2>
            <p className="section-subtitle">
              Everything you need to manage your dispute documentation workflow.
            </p>
            <div className="features-grid">
              {[
                { icon: Upload, title: 'Report Analysis', desc: 'Upload credit report PDFs. Software identifies items and provides educational context about relevant FCRA sections.' },
                { icon: Clock, title: 'Deadline Tracking', desc: 'Track statutory response windows. The software calculates timeframes based on FCRA requirements.' },
                { icon: FileText, title: '62+ Letter Templates', desc: 'Access the full template library for dispute correspondence. Customize templates with your information.' },
                { icon: Shield, title: 'AI Guidance', desc: 'AI assistant trained on consumer protection statutes provides educational information about your rights.' },
                { icon: Flag, title: 'Item Flagging', desc: 'Flag items you want to address. Organize your workflow by priority and status.' },
                { icon: Scale, title: 'Audit Trail', desc: 'Automatic logging of all actions. Export your complete documentation history.' },
              ].map((feature, i) => (
                <div key={i} className="feature-card">
                  <div className="feature-icon"><feature.icon size={24} /></div>
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-desc">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Statutes */}
        <section className="section section-dark">
          <div className="container">
            <div className="section-label">Legal Framework</div>
            <h2 className="section-title">Built around federal law</h2>
            <p className="section-subtitle">
              Our templates and workflows reference these federal consumer protection provisions.
            </p>
            <div className="statute-grid">
              {[
                { num: '§605B', name: 'Identity Theft Blocks', desc: 'Allows identity theft victims to request blocking of fraudulent information. Bureaus must respond within 4 business days.' },
                { num: '§611', name: 'Dispute Procedures', desc: 'Establishes the right to dispute inaccurate information. Bureaus must investigate within 30 days.' },
                { num: '§809', name: 'Debt Validation', desc: 'FDCPA provision requiring collectors to validate debts upon request within 30 days of initial contact.' },
              ].map((statute, i) => (
                <div key={i} className="statute-card">
                  <div className="statute-number">{statute.num}</div>
                  <div className="statute-name">{statute.name}</div>
                  <p className="statute-desc">{statute.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta-section">
          <h2 className="cta-title">Ready to take control?</h2>
          <p className="cta-subtitle">
            Start organizing your credit dispute process today. 
            Free to analyze. Upgrade when you're ready to act.
          </p>
          <Link href="/sign-up" className="btn-primary">
            Get Started Free <ArrowRight size={18} />
          </Link>
          <p className="cta-disclaimer">
            No credit card required. Results vary based on individual circumstances.
          </p>
        </section>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-main">
            <div className="footer-brand">
              <div className="footer-logo">605b<span className="logo-accent">.ai</span></div>
              <p className="footer-tagline">Self-service software for credit dispute organization.</p>
            </div>
            <div className="footer-links">
              <div className="footer-column">
                <div className="footer-column-title">Product</div>
                <Link href="/sign-up" className="footer-link">Get Started</Link>
                <a href="#features" className="footer-link">Features</a>
                <a href="#how-it-works" className="footer-link">How It Works</a>
                <Link href="/pricing" className="footer-link">Pricing</Link>
              </div>
              <div className="footer-column">
                <div className="footer-column-title">Company</div>
                <Link href="/about" className="footer-link">About</Link>
                <Link href="/terms" className="footer-link">Terms of Service</Link>
                <Link href="/privacy" className="footer-link">Privacy Policy</Link>
              </div>
              <div className="footer-column">
                <div className="footer-column-title">Contact</div>
                <a href="mailto:support@9thwave.io" className="footer-link">support@9thwave.io</a>
              </div>
            </div>
          </div>
          
          <div className="footer-disclaimer">
            <p className="disclaimer-text">
              <strong>Important Disclaimer:</strong> 605b.ai provides software tools and educational guidance only. 
              We are not a law firm, credit repair organization, or credit counseling service. We do not provide 
              legal advice, credit repair services, or guarantees of any outcomes. The information provided is 
              for educational purposes and should not be construed as legal advice. Results depend entirely on 
              individual circumstances. Consult with a qualified attorney for legal advice specific to your situation.
            </p>
          </div>

          <div className="footer-bottom">
            <div>© {new Date().getFullYear()} Ninth Wave Analytics LLC · Delaware, USA</div>
            <div className="footer-bottom-links">
              <Link href="/terms" className="footer-bottom-link">Terms</Link>
              <Link href="/privacy" className="footer-bottom-link">Privacy</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
