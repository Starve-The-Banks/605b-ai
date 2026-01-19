"use client";

import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { useUserTier } from '@/lib/useUserTier';
import {
  Shield, FileText, Scale, Zap, ArrowRight, ArrowLeft,
  Check, Target, Clock, AlertTriangle, Sparkles, Upload,
  ChevronRight, X, Crown, CreditCard, Building, Users,
  HelpCircle, FileSearch
} from 'lucide-react';

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
};

const STEPS = [
  { id: 'welcome', title: 'Welcome' },
  { id: 'situation', title: 'Your Situation' },
  { id: 'scope', title: 'Scope' },
  { id: 'complexity', title: 'Details' },
  { id: 'recommendation', title: 'Recommendation' },
];

const SITUATIONS = [
  {
    id: 'identity-theft',
    icon: Shield,
    title: "I'm a victim of identity theft",
    description: "Fraudulent accounts were opened in my name",
    color: '#ef4444',
    baseScore: 50, // High complexity - always goes to identity theft tier
  },
  {
    id: 'collections',
    icon: AlertTriangle,
    title: "I have collections to dispute",
    description: "Debt collectors are reporting inaccurate info",
    color: '#f59e0b',
    baseScore: 20,
  },
  {
    id: 'errors',
    icon: FileText,
    title: "I found errors on my report",
    description: "Incorrect balances, dates, or account info",
    color: '#3b82f6',
    baseScore: 5,
  },
  {
    id: 'rebuild',
    icon: Zap,
    title: "I want to rebuild my credit",
    description: "Starting fresh and need guidance",
    color: '#22c55e',
    baseScore: 0,
  },
];

const ITEM_COUNTS = [
  { id: '1-3', label: '1-3 items', score: 0 },
  { id: '4-10', label: '4-10 items', score: 10 },
  { id: '11-20', label: '11-20 items', score: 20 },
  { id: '20+', label: '20+ items', score: 35 },
  { id: 'unknown', label: "I'm not sure yet", score: 10 },
];

const BUREAU_COUNTS = [
  { id: '1', label: '1 bureau', description: 'Only one report has issues', score: 0 },
  { id: '2', label: '2 bureaus', description: 'Issues on two reports', score: 10 },
  { id: '3', label: 'All 3 bureaus', description: 'Issues across all reports', score: 15 },
  { id: 'unknown', label: "I'm not sure yet", description: "Haven't pulled all reports", score: 5 },
];

const COMPLEXITY_FACTORS = [
  { id: 'creditors', label: 'I need to dispute directly with creditors', score: 15, icon: Building },
  { id: 'collectors', label: 'I\'m dealing with debt collectors', score: 15, icon: Users },
  { id: 'old-debt', label: 'Some debts may be past statute of limitations', score: 5, icon: Clock },
  { id: 'mixed-fraud', label: 'Mix of fraud and my own accounts', score: 25, icon: Shield },
  { id: 'prior-disputes', label: 'I\'ve disputed before with no success', score: 15, icon: AlertTriangle },
  { id: 'litigation', label: 'I may need to escalate to legal action', score: 30, icon: Scale },
];

// Updated tier structure to match pricing page exactly
const TIERS = {
  free: {
    id: 'free',
    name: 'Credit Report Analyzer',
    price: 0,
    icon: FileSearch,
    color: '#6b7280',
    maxScore: 0, // Educational only
    description: 'Understand your situation first',
    features: [
      '1 PDF analysis (read-only)',
      'Issue categorization',
      'Educational walkthrough',
      '"What you can do" checklist',
    ],
    note: 'No letter downloads or exports',
  },
  toolkit: {
    id: 'toolkit',
    name: 'Dispute Toolkit',
    price: 39,
    icon: FileText,
    color: '#3b82f6',
    maxScore: 20,
    description: 'Core dispute documentation',
    features: [
      'Full analysis export (PDF)',
      'Core bureau dispute templates',
      'Dispute tracker',
      'Certified mail checklist',
      'Educational guidance',
    ],
  },
  advanced: {
    id: 'advanced',
    name: 'Advanced Dispute Suite',
    price: 89,
    icon: Zap,
    color: '#FF6B35',
    maxScore: 50,
    description: 'Full dispute capabilities',
    features: [
      'Everything in Toolkit',
      'Full template library (62 letters)',
      'Creditor dispute templates',
      'CFPB + FTC complaint generators',
      'AI Strategist (educational)',
      'Escalation templates',
      'Audit log export',
    ],
  },
  'identity-theft': {
    id: 'identity-theft',
    name: '605B Identity Theft Toolkit',
    price: 179,
    icon: Shield,
    color: '#22c55e',
    maxScore: Infinity,
    description: 'Complete fraud documentation',
    features: [
      'Everything in Advanced Suite',
      '605B-specific workflows',
      'FTC Identity Theft Report integration',
      'Identity theft affidavits',
      'Police report templates',
      'Evidence packet builder',
      'Attorney-ready documents',
    ],
  },
};

export default function OnboardingWizard({ onComplete, onSkip }) {
  const { user } = useUser();
  const { isSignedIn } = useAuth();
  const { isBeta, loading: tierLoading } = useUserTier();
  const isMobile = useIsMobile();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({
    situation: null,
    itemCount: null,
    bureauCount: null,
    complexityFactors: [],
  });
  const [isAnimating, setIsAnimating] = useState(false);

  // Beta users bypass onboarding wizard entirely - they have full access
  useEffect(() => {
    if (!tierLoading && isBeta) {
      // Mark onboarding as complete for beta users
      localStorage.setItem('605b_onboarding_complete', 'true');
      localStorage.setItem('605b_tier', 'identity-theft');
      localStorage.setItem('605b_assessment', JSON.stringify({
        isBetaBypass: true,
        completedAt: new Date().toISOString(),
      }));
      // Skip to dashboard immediately
      onComplete?.({ isBetaBypass: true, selectedTier: 'identity-theft' });
    }
  }, [isBeta, tierLoading, onComplete]);

  // Calculate complexity score
  const calculateScore = () => {
    let score = 0;

    // Base score from situation
    const situation = SITUATIONS.find(s => s.id === answers.situation);
    if (situation) score += situation.baseScore;

    // Item count score
    const itemCount = ITEM_COUNTS.find(i => i.id === answers.itemCount);
    if (itemCount) score += itemCount.score;

    // Bureau count score
    const bureauCount = BUREAU_COUNTS.find(b => b.id === answers.bureauCount);
    if (bureauCount) score += bureauCount.score;

    // Complexity factors
    answers.complexityFactors.forEach(factorId => {
      const factor = COMPLEXITY_FACTORS.find(f => f.id === factorId);
      if (factor) score += factor.score;
    });

    return score;
  };

  const getRecommendedTier = () => {
    const score = calculateScore();

    // Identity theft situation always recommends identity theft toolkit
    if (answers.situation === 'identity-theft') {
      return TIERS['identity-theft'];
    }

    // Mixed fraud factor also suggests identity theft toolkit
    if (answers.complexityFactors.includes('mixed-fraud')) {
      return TIERS['identity-theft'];
    }

    // Score-based recommendations
    if (score <= TIERS.toolkit.maxScore) return TIERS.toolkit;
    if (score <= TIERS.advanced.maxScore) return TIERS.advanced;
    return TIERS['identity-theft'];
  };

  const goNext = () => {
    if (currentStep < STEPS.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setIsAnimating(false);
      }, 200);
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setIsAnimating(false);
      }, 200);
    }
  };

  const selectSituation = (situationId) => {
    setAnswers(prev => ({ ...prev, situation: situationId }));
    setTimeout(goNext, 300);
  };

  const selectItemCount = (countId) => {
    setAnswers(prev => ({ ...prev, itemCount: countId }));
    setTimeout(goNext, 300);
  };

  const selectBureauCount = (countId) => {
    setAnswers(prev => ({ ...prev, bureauCount: countId }));
  };

  const toggleComplexityFactor = (factorId) => {
    setAnswers(prev => ({
      ...prev,
      complexityFactors: prev.complexityFactors.includes(factorId)
        ? prev.complexityFactors.filter(f => f !== factorId)
        : [...prev.complexityFactors, factorId]
    }));
  };

  const handleSelectTier = async (tierId) => {
    // Save assessment to localStorage
    localStorage.setItem('605b_onboarding_complete', 'true');
    localStorage.setItem('605b_assessment', JSON.stringify({
      ...answers,
      score: calculateScore(),
      recommendedTier: getRecommendedTier().id,
      selectedTier: tierId,
      completedAt: new Date().toISOString(),
    }));

    // Save selected tier
    localStorage.setItem('605b_tier', tierId);

    // Sync to server if signed in
    if (isSignedIn) {
      try {
        await fetch('/api/user-data/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profile: {
              onboardingComplete: true,
              assessment: answers,
              score: calculateScore(),
              recommendedTier: getRecommendedTier().id,
              selectedTier: tierId,
            }
          }),
        });
      } catch (error) {
        console.error('Failed to sync profile:', error);
      }
    }

    // If they selected a paid tier, redirect to pricing with their tier highlighted
    if (tierId !== 'free') {
      window.location.href = `/pricing?recommended=${tierId}`;
    } else {
      onComplete?.({ ...answers, selectedTier: tierId });
    }
  };

  const handleContinueFree = () => {
    localStorage.setItem('605b_onboarding_complete', 'true');
    localStorage.setItem('605b_tier', 'free');
    
    // Save assessment even for free users
    localStorage.setItem('605b_assessment', JSON.stringify({
      ...answers,
      score: calculateScore(),
      recommendedTier: getRecommendedTier().id,
      selectedTier: 'free',
      completedAt: new Date().toISOString(),
    }));

    onComplete?.({ ...answers, selectedTier: 'free' });
  };

  const styles = {
    overlay: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(9, 9, 11, 0.97)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: isMobile ? 'flex-end' : 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: isMobile ? '0' : '20px',
    },
    container: {
      width: '100%',
      maxWidth: isMobile ? '100%' : '640px',
      maxHeight: isMobile ? '95vh' : '90vh',
      background: '#121214',
      border: '1px solid #27272a',
      borderRadius: isMobile ? '20px 20px 0 0' : '20px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
    },
    skipButton: {
      position: 'absolute',
      top: '16px',
      right: '16px',
      background: 'transparent',
      border: 'none',
      color: '#71717a',
      cursor: 'pointer',
      padding: '8px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '13px',
      zIndex: 10,
    },
    progressBar: {
      height: '4px',
      background: '#27272a',
      position: 'relative',
      flexShrink: 0,
    },
    progressFill: {
      height: '100%',
      background: 'linear-gradient(90deg, #FF6B35, #e55a2b)',
      transition: 'width 0.3s ease',
      borderRadius: '0 2px 2px 0',
    },
    content: {
      padding: isMobile ? '24px 20px' : '40px',
      opacity: isAnimating ? 0 : 1,
      transform: isAnimating ? 'translateX(20px)' : 'translateX(0)',
      transition: 'all 0.2s ease',
      overflowY: 'auto',
      flex: 1,
    },
    title: {
      fontSize: isMobile ? '22px' : '28px',
      fontWeight: 700,
      marginBottom: '8px',
      color: '#fafafa',
    },
    subtitle: {
      fontSize: isMobile ? '14px' : '15px',
      color: '#71717a',
      marginBottom: isMobile ? '24px' : '32px',
      lineHeight: 1.6,
    },
    optionGrid: {
      display: 'grid',
      gap: '12px',
    },
    option: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '16px 20px',
      background: '#1a1a1c',
      border: '2px solid #27272a',
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      textAlign: 'left',
      width: '100%',
    },
    optionIcon: {
      width: '48px',
      height: '48px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    factorOption: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '14px 16px',
      background: '#1a1a1c',
      border: '2px solid #27272a',
      borderRadius: '10px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      width: '100%',
    },
    checkbox: {
      width: '22px',
      height: '22px',
      borderRadius: '6px',
      border: '2px solid #3f3f46',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      transition: 'all 0.15s',
    },
    footer: {
      padding: isMobile ? '16px 20px 24px' : '20px 40px 32px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '12px',
      borderTop: '1px solid #1c1c1f',
      flexShrink: 0,
    },
    backButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '10px 16px',
      background: 'transparent',
      border: '1px solid #27272a',
      borderRadius: '8px',
      color: '#a1a1aa',
      fontSize: '14px',
      cursor: 'pointer',
    },
    nextButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '12px 24px',
      background: 'linear-gradient(135deg, #FF6B35 0%, #e55a2b 100%)',
      border: 'none',
      borderRadius: '10px',
      color: '#ffffff',
      fontSize: '15px',
      fontWeight: 600,
      cursor: 'pointer',
    },
    tierCard: {
      padding: '24px',
      background: '#1a1a1c',
      border: '2px solid',
      borderRadius: '16px',
      marginBottom: '16px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      position: 'relative',
    },
    tierHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      marginBottom: '16px',
    },
    tierIcon: {
      width: '52px',
      height: '52px',
      borderRadius: '14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    tierPrice: {
      fontSize: '32px',
      fontWeight: 700,
      marginBottom: '16px',
    },
    tierFeatures: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      marginBottom: '16px',
    },
    tierFeature: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      color: '#a1a1aa',
    },
  };

  const renderStep = () => {
    switch (STEPS[currentStep].id) {
      case 'welcome':
        return (
          <>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.2) 0%, rgba(255, 107, 53, 0.05) 100%)',
                border: '2px solid rgba(255, 107, 53, 0.3)',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
              }}>
                <Sparkles size={36} color="#FF6B35" />
              </div>
              <h1 style={styles.title}>Welcome{user?.firstName ? `, ${user.firstName}` : ''}!</h1>
              <p style={styles.subtitle}>
                Let's understand your situation so we can recommend the right tools for you.
                This takes about 60 seconds.
              </p>
            </div>
            <div style={{
              background: 'rgba(255, 107, 53, 0.1)',
              border: '1px solid rgba(255, 107, 53, 0.2)',
              borderRadius: '12px',
              padding: '16px 20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <HelpCircle size={20} color="#FF6B35" />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: '#fafafa' }}>
                    Quick assessment
                  </div>
                  <div style={{ fontSize: '13px', color: '#a1a1aa', marginTop: '4px' }}>
                    We'll analyze your situation and recommend the right toolkit
                  </div>
                </div>
              </div>
            </div>
          </>
        );

      case 'situation':
        return (
          <>
            <h1 style={styles.title}>What brings you here?</h1>
            <p style={styles.subtitle}>
              Select the option that best describes your situation
            </p>
            <div style={styles.optionGrid}>
              {SITUATIONS.map(situation => (
                <button
                  key={situation.id}
                  style={{
                    ...styles.option,
                    borderColor: answers.situation === situation.id ? situation.color : '#27272a',
                    background: answers.situation === situation.id ? `${situation.color}15` : '#1a1a1c',
                  }}
                  onClick={() => selectSituation(situation.id)}
                >
                  <div style={{
                    ...styles.optionIcon,
                    background: `${situation.color}20`,
                    color: situation.color,
                  }}>
                    <situation.icon size={24} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#fafafa', marginBottom: '2px' }}>
                      {situation.title}
                    </div>
                    <div style={{ fontSize: '13px', color: '#71717a' }}>
                      {situation.description}
                    </div>
                  </div>
                  <ChevronRight size={20} style={{ color: '#3f3f46' }} />
                </button>
              ))}
            </div>
          </>
        );

      case 'scope':
        return (
          <>
            <h1 style={styles.title}>How many items need attention?</h1>
            <p style={styles.subtitle}>
              Estimate the number of accounts or errors you need to address
            </p>
            <div style={styles.optionGrid}>
              {ITEM_COUNTS.map(count => (
                <button
                  key={count.id}
                  style={{
                    ...styles.option,
                    borderColor: answers.itemCount === count.id ? '#FF6B35' : '#27272a',
                    background: answers.itemCount === count.id ? 'rgba(255, 107, 53, 0.1)' : '#1a1a1c',
                    padding: '14px 20px',
                  }}
                  onClick={() => selectItemCount(count.id)}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: answers.itemCount === count.id ? 'rgba(255, 107, 53, 0.2)' : '#27272a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: answers.itemCount === count.id ? '#FF6B35' : '#71717a',
                    fontSize: '16px',
                    fontWeight: 600,
                  }}>
                    {count.id === 'unknown' ? '?' : count.id.split('-')[0]}
                  </div>
                  <span style={{
                    fontSize: '15px',
                    fontWeight: 500,
                    color: answers.itemCount === count.id ? '#fafafa' : '#a1a1aa',
                  }}>
                    {count.label}
                  </span>
                </button>
              ))}
            </div>
          </>
        );

      case 'complexity':
        return (
          <>
            <h1 style={styles.title}>Tell us more about your case</h1>
            <p style={styles.subtitle}>
              Select all that apply to your situation
            </p>

            {/* Bureau count */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#a1a1aa', marginBottom: '12px' }}>
                How many bureaus have issues?
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {BUREAU_COUNTS.map(bureau => (
                  <button
                    key={bureau.id}
                    style={{
                      padding: '12px 16px',
                      background: answers.bureauCount === bureau.id ? 'rgba(255, 107, 53, 0.1)' : '#1a1a1c',
                      border: `2px solid ${answers.bureauCount === bureau.id ? '#FF6B35' : '#27272a'}`,
                      borderRadius: '10px',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                    onClick={() => selectBureauCount(bureau.id)}
                  >
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: answers.bureauCount === bureau.id ? '#fafafa' : '#a1a1aa',
                    }}>
                      {bureau.label}
                    </div>
                    <div style={{ fontSize: '12px', color: '#52525b', marginTop: '2px' }}>
                      {bureau.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Complexity factors */}
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#a1a1aa', marginBottom: '12px' }}>
                Additional factors (select all that apply)
              </div>
              <div style={styles.optionGrid}>
                {COMPLEXITY_FACTORS.map(factor => {
                  const isSelected = answers.complexityFactors.includes(factor.id);
                  return (
                    <button
                      key={factor.id}
                      style={{
                        ...styles.factorOption,
                        borderColor: isSelected ? '#FF6B35' : '#27272a',
                        background: isSelected ? 'rgba(255, 107, 53, 0.1)' : '#1a1a1c',
                      }}
                      onClick={() => toggleComplexityFactor(factor.id)}
                    >
                      <div style={{
                        ...styles.checkbox,
                        background: isSelected ? '#FF6B35' : 'transparent',
                        borderColor: isSelected ? '#FF6B35' : '#3f3f46',
                      }}>
                        {isSelected && <Check size={14} color="#ffffff" />}
                      </div>
                      <factor.icon size={18} style={{ color: isSelected ? '#FF6B35' : '#71717a' }} />
                      <span style={{ fontSize: '14px', color: isSelected ? '#fafafa' : '#a1a1aa' }}>
                        {factor.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        );

      case 'recommendation':
        const recommendedTier = getRecommendedTier();
        const score = calculateScore();

        // Get other paid tiers (excluding free and recommended)
        const otherTiers = Object.values(TIERS)
          .filter(t => t.id !== recommendedTier.id && t.id !== 'free');

        return (
          <>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                background: `${recommendedTier.color}20`,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: recommendedTier.color,
              }}>
                <recommendedTier.icon size={32} />
              </div>
              <h1 style={styles.title}>Our Recommendation</h1>
              <p style={styles.subtitle}>
                Based on your assessment, here's what we recommend
              </p>
            </div>

            {/* Recommended Tier */}
            <div
              style={{
                ...styles.tierCard,
                borderColor: recommendedTier.color,
                background: `linear-gradient(135deg, ${recommendedTier.color}15 0%, #1a1a1c 100%)`,
              }}
            >
              <div style={{
                position: 'absolute',
                top: '-1px',
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '4px 12px',
                background: recommendedTier.color,
                color: '#09090b',
                fontSize: '11px',
                fontWeight: 700,
                borderRadius: '0 0 8px 8px',
                textTransform: 'uppercase',
              }}>
                Recommended
              </div>

              <div style={styles.tierHeader}>
                <div style={{
                  ...styles.tierIcon,
                  background: `${recommendedTier.color}20`,
                  color: recommendedTier.color,
                }}>
                  <recommendedTier.icon size={28} />
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#fafafa' }}>
                    {recommendedTier.name}
                  </div>
                  <div style={{ fontSize: '14px', color: '#71717a' }}>
                    {recommendedTier.description}
                  </div>
                </div>
              </div>

              <div style={styles.tierPrice}>
                {recommendedTier.price === 0 ? (
                  <span style={{ color: '#6b7280' }}>Free</span>
                ) : (
                  <>
                    <span style={{ color: '#71717a', fontSize: '18px' }}>$</span>
                    {recommendedTier.price}
                    <span style={{ fontSize: '14px', color: '#52525b', fontWeight: 400 }}> one-time</span>
                  </>
                )}
              </div>

              <div style={styles.tierFeatures}>
                {recommendedTier.features.map((feature, i) => (
                  <div key={i} style={styles.tierFeature}>
                    <Check size={16} color={recommendedTier.color} />
                    {feature}
                  </div>
                ))}
              </div>

              {recommendedTier.note && (
                <div style={{
                  padding: '8px 12px',
                  background: 'rgba(107, 114, 128, 0.1)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#9ca3af',
                  marginBottom: '16px',
                  textAlign: 'center',
                }}>
                  {recommendedTier.note}
                </div>
              )}

              <button
                style={{
                  width: '100%',
                  padding: '14px',
                  background: recommendedTier.price === 0 ? '#27272a' : recommendedTier.color,
                  border: 'none',
                  borderRadius: '10px',
                  color: recommendedTier.price === 0 ? '#fafafa' : '#09090b',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
                onClick={() => handleSelectTier(recommendedTier.id)}
              >
                {recommendedTier.price === 0 ? 'Start Free' : `Get ${recommendedTier.name.split(' ')[0]}`}
                <ArrowRight size={18} />
              </button>
            </div>

            {/* Other options */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '20px 0',
            }}>
              <div style={{ flex: 1, height: '1px', background: '#27272a' }} />
              <span style={{ fontSize: '13px', color: '#52525b' }}>or choose another option</span>
              <div style={{ flex: 1, height: '1px', background: '#27272a' }} />
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {otherTiers.map(tier => (
                <button
                  key={tier.id}
                  style={{
                    flex: 1,
                    minWidth: '140px',
                    padding: '14px',
                    background: '#1a1a1c',
                    border: '1px solid #27272a',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                  onClick={() => handleSelectTier(tier.id)}
                >
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#fafafa' }}>
                    {tier.name.length > 20 ? tier.name.split(' ')[0] : tier.name}
                  </div>
                  <div style={{ fontSize: '13px', color: '#71717a' }}>
                    ${tier.price}
                  </div>
                </button>
              ))}
            </div>

            <button
              style={{
                width: '100%',
                marginTop: '16px',
                padding: '12px',
                background: 'transparent',
                border: 'none',
                color: '#52525b',
                fontSize: '13px',
                cursor: 'pointer',
              }}
              onClick={handleContinueFree}
            >
              Continue with free analysis only →
            </button>
          </>
        );
    }
  };

  const canProceed = () => {
    switch (STEPS[currentStep].id) {
      case 'welcome': return true;
      case 'situation': return !!answers.situation;
      case 'scope': return !!answers.itemCount;
      case 'complexity': return !!answers.bureauCount;
      case 'recommendation': return true;
      default: return false;
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        <button style={styles.skipButton} onClick={onSkip}>
          Skip <X size={16} />
        </button>

        <div style={styles.progressBar}>
          <div
            style={{
              ...styles.progressFill,
              width: `${((currentStep + 1) / STEPS.length) * 100}%`,
            }}
          />
        </div>

        <div style={styles.content}>
          {renderStep()}
        </div>

        {STEPS[currentStep].id !== 'recommendation' && (
          <div style={styles.footer}>
            {currentStep > 0 ? (
              <button style={styles.backButton} onClick={goBack}>
                <ArrowLeft size={16} />
                Back
              </button>
            ) : (
              <div />
            )}

            <button
              style={{
                ...styles.nextButton,
                opacity: canProceed() ? 1 : 0.5,
                cursor: canProceed() ? 'pointer' : 'not-allowed',
              }}
              onClick={goNext}
              disabled={!canProceed()}
            >
              Continue
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
