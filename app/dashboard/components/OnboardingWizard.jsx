"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  Shield, FileText, Scale, Zap, ArrowRight, ArrowLeft,
  Check, Target, Clock, AlertTriangle, Sparkles, Upload,
  ChevronRight, X
} from 'lucide-react';

const STEPS = [
  { id: 'welcome', title: 'Welcome' },
  { id: 'situation', title: 'Your Situation' },
  { id: 'goals', title: 'Your Goals' },
  { id: 'timeline', title: 'Timeline' },
  { id: 'gameplan', title: 'Your Game Plan' },
];

const SITUATIONS = [
  {
    id: 'identity-theft',
    icon: Shield,
    title: "I'm a victim of identity theft",
    description: "Fraudulent accounts were opened in my name",
    color: '#ef4444',
  },
  {
    id: 'collections',
    icon: AlertTriangle,
    title: "I have collections to dispute",
    description: "Debt collectors are reporting inaccurate info",
    color: '#f59e0b',
  },
  {
    id: 'errors',
    icon: FileText,
    title: "I found errors on my report",
    description: "Incorrect balances, dates, or account info",
    color: '#3b82f6',
  },
  {
    id: 'rebuild',
    icon: Zap,
    title: "I want to rebuild my credit",
    description: "Starting fresh and need guidance",
    color: '#22c55e',
  },
];

const GOALS = [
  { id: 'remove-fraud', label: 'Remove fraudulent accounts', icon: Shield },
  { id: 'remove-collections', label: 'Remove collection accounts', icon: AlertTriangle },
  { id: 'fix-errors', label: 'Fix reporting errors', icon: FileText },
  { id: 'improve-score', label: 'Improve my credit score', icon: Zap },
  { id: 'qualify-loan', label: 'Qualify for a loan/mortgage', icon: Target },
  { id: 'understand-rights', label: 'Understand my legal rights', icon: Scale },
];

const TIMELINES = [
  { id: 'urgent', label: 'Urgent - Need results ASAP', description: 'Active fraud or immediate need', icon: '🚨' },
  { id: 'months', label: '1-3 months', description: 'Working toward a specific goal', icon: '📅' },
  { id: 'flexible', label: 'Flexible timeline', description: 'No rush, doing it right', icon: '⏳' },
];

export default function OnboardingWizard({ onComplete, onSkip }) {
  const { user } = useUser();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({
    situation: null,
    goals: [],
    timeline: null,
  });
  const [isAnimating, setIsAnimating] = useState(false);

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

  const toggleGoal = (goalId) => {
    setAnswers(prev => ({
      ...prev,
      goals: prev.goals.includes(goalId)
        ? prev.goals.filter(g => g !== goalId)
        : [...prev.goals, goalId]
    }));
  };

  const selectTimeline = (timelineId) => {
    setAnswers(prev => ({ ...prev, timeline: timelineId }));
    setTimeout(goNext, 300);
  };

  const handleComplete = () => {
    localStorage.setItem('605b_onboarding_complete', 'true');
    localStorage.setItem('605b_user_profile', JSON.stringify(answers));
    onComplete?.(answers);
  };

  const getGamePlan = () => {
    const plan = [];

    if (answers.situation === 'identity-theft') {
      plan.push({
        step: 1,
        title: 'File an Identity Theft Report',
        description: 'Get your FTC Identity Theft Report at IdentityTheft.gov',
        action: 'Go to IdentityTheft.gov',
        link: 'https://www.identitytheft.gov',
        priority: 'high',
      });
      plan.push({
        step: 2,
        title: 'Upload Your Credit Reports',
        description: 'Upload reports from all 3 bureaus for analysis',
        action: 'Upload Reports',
        href: '/dashboard',
        priority: 'high',
      });
      plan.push({
        step: 3,
        title: 'Send 605B Identity Theft Blocks',
        description: 'Use our templates to demand fraudulent accounts be blocked',
        action: 'View Templates',
        href: '/dashboard/templates',
        priority: 'high',
      });
    } else if (answers.situation === 'collections') {
      plan.push({
        step: 1,
        title: 'Upload Your Credit Reports',
        description: 'We\'ll identify all collection accounts',
        action: 'Upload Reports',
        href: '/dashboard',
        priority: 'high',
      });
      plan.push({
        step: 2,
        title: 'Send Debt Validation Letters',
        description: 'Force collectors to prove the debt is valid',
        action: 'View Templates',
        href: '/dashboard/templates',
        priority: 'medium',
      });
      plan.push({
        step: 3,
        title: 'Track Response Deadlines',
        description: 'Collectors have 30 days to validate',
        action: 'View Tracker',
        href: '/dashboard/tracker',
        priority: 'medium',
      });
    } else {
      plan.push({
        step: 1,
        title: 'Upload Your Credit Reports',
        description: 'Get your free reports from AnnualCreditReport.com',
        action: 'Upload Reports',
        href: '/dashboard',
        priority: 'high',
      });
      plan.push({
        step: 2,
        title: 'Talk to AI Strategist',
        description: 'Get personalized guidance for your situation',
        action: 'Start Chat',
        href: '/dashboard/ai-strategist',
        priority: 'medium',
      });
      plan.push({
        step: 3,
        title: 'Review Dispute Templates',
        description: 'Browse our library of FCRA-compliant letters',
        action: 'View Templates',
        href: '/dashboard/templates',
        priority: 'medium',
      });
    }

    return plan;
  };

  const styles = {
    overlay: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(9, 9, 11, 0.95)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    },
    container: {
      width: '100%',
      maxWidth: '600px',
      background: '#121214',
      border: '1px solid #27272a',
      borderRadius: '20px',
      overflow: 'hidden',
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
    },
    progressFill: {
      height: '100%',
      background: 'linear-gradient(90deg, #f7d047, #d4b840)',
      transition: 'width 0.3s ease',
      borderRadius: '0 2px 2px 0',
    },
    content: {
      padding: '40px',
      opacity: isAnimating ? 0 : 1,
      transform: isAnimating ? 'translateX(20px)' : 'translateX(0)',
      transition: 'all 0.2s ease',
    },
    title: {
      fontSize: '28px',
      fontWeight: 700,
      marginBottom: '8px',
      color: '#fafafa',
    },
    subtitle: {
      fontSize: '15px',
      color: '#71717a',
      marginBottom: '32px',
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
    goalOption: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '14px 16px',
      background: '#1a1a1c',
      border: '2px solid #27272a',
      borderRadius: '10px',
      cursor: 'pointer',
      transition: 'all 0.2s',
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
      padding: '20px 40px 32px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
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
      background: 'linear-gradient(135deg, #f7d047 0%, #d4b840 100%)',
      border: 'none',
      borderRadius: '10px',
      color: '#09090b',
      fontSize: '15px',
      fontWeight: 600,
      cursor: 'pointer',
    },
    planCard: {
      padding: '16px 20px',
      background: '#1a1a1c',
      border: '1px solid #27272a',
      borderRadius: '12px',
      marginBottom: '12px',
    },
    planStep: {
      width: '28px',
      height: '28px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '13px',
      fontWeight: 600,
      flexShrink: 0,
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
                background: 'linear-gradient(135deg, rgba(247, 208, 71, 0.2) 0%, rgba(247, 208, 71, 0.05) 100%)',
                border: '2px solid rgba(247, 208, 71, 0.3)',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
              }}>
                <Sparkles size={36} color="#f7d047" />
              </div>
              <h1 style={styles.title}>Welcome, {user?.firstName || 'there'}!</h1>
              <p style={styles.subtitle}>
                Let's set up your credit repair strategy. This takes about 2 minutes
                and helps us personalize your experience.
              </p>
            </div>
            <div style={{
              background: 'rgba(247, 208, 71, 0.1)',
              border: '1px solid rgba(247, 208, 71, 0.2)',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '24px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Scale size={20} color="#f7d047" />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: '#fafafa' }}>
                    We'll guide you through:
                  </div>
                  <div style={{ fontSize: '13px', color: '#a1a1aa', marginTop: '4px' }}>
                    Your situation → Your goals → A personalized game plan
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
              Select the option that best describes your current situation
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
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#fafafa', marginBottom: '2px' }}>
                      {situation.title}
                    </div>
                    <div style={{ fontSize: '13px', color: '#71717a' }}>
                      {situation.description}
                    </div>
                  </div>
                  <ChevronRight size={20} style={{ color: '#3f3f46', marginLeft: 'auto' }} />
                </button>
              ))}
            </div>
          </>
        );

      case 'goals':
        return (
          <>
            <h1 style={styles.title}>What are your goals?</h1>
            <p style={styles.subtitle}>
              Select all that apply - we'll prioritize your game plan accordingly
            </p>
            <div style={styles.optionGrid}>
              {GOALS.map(goal => {
                const isSelected = answers.goals.includes(goal.id);
                return (
                  <button
                    key={goal.id}
                    style={{
                      ...styles.goalOption,
                      borderColor: isSelected ? '#f7d047' : '#27272a',
                      background: isSelected ? 'rgba(247, 208, 71, 0.1)' : '#1a1a1c',
                    }}
                    onClick={() => toggleGoal(goal.id)}
                  >
                    <div style={{
                      ...styles.checkbox,
                      background: isSelected ? '#f7d047' : 'transparent',
                      borderColor: isSelected ? '#f7d047' : '#3f3f46',
                    }}>
                      {isSelected && <Check size={14} color="#09090b" />}
                    </div>
                    <goal.icon size={18} style={{ color: isSelected ? '#f7d047' : '#71717a' }} />
                    <span style={{ fontSize: '14px', color: isSelected ? '#fafafa' : '#a1a1aa' }}>
                      {goal.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        );

      case 'timeline':
        return (
          <>
            <h1 style={styles.title}>What's your timeline?</h1>
            <p style={styles.subtitle}>
              This helps us prioritize your next steps
            </p>
            <div style={styles.optionGrid}>
              {TIMELINES.map(timeline => (
                <button
                  key={timeline.id}
                  style={{
                    ...styles.option,
                    borderColor: answers.timeline === timeline.id ? '#f7d047' : '#27272a',
                    background: answers.timeline === timeline.id ? 'rgba(247, 208, 71, 0.1)' : '#1a1a1c',
                  }}
                  onClick={() => selectTimeline(timeline.id)}
                >
                  <div style={{
                    ...styles.optionIcon,
                    background: '#27272a',
                    fontSize: '24px',
                  }}>
                    {timeline.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#fafafa', marginBottom: '2px' }}>
                      {timeline.label}
                    </div>
                    <div style={{ fontSize: '13px', color: '#71717a' }}>
                      {timeline.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        );

      case 'gameplan':
        const plan = getGamePlan();
        return (
          <>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <Check size={32} color="white" />
              </div>
              <h1 style={styles.title}>Your Game Plan</h1>
              <p style={styles.subtitle}>
                Here's your personalized roadmap based on your situation
              </p>
            </div>
            <div>
              {plan.map((item, index) => (
                <div key={index} style={styles.planCard}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                    <div style={{
                      ...styles.planStep,
                      background: item.priority === 'high' ? '#f7d047' : '#27272a',
                      color: item.priority === 'high' ? '#09090b' : '#a1a1aa',
                    }}>
                      {item.step}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: '#fafafa', marginBottom: '4px' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '13px', color: '#71717a', marginBottom: '12px' }}>
                        {item.description}
                      </div>
                      {item.href ? (
                        <a
                          href={item.href}
                          onClick={handleComplete}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '13px',
                            color: '#f7d047',
                            textDecoration: 'none',
                          }}
                        >
                          {item.action}
                          <ArrowRight size={14} />
                        </a>
                      ) : (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '13px',
                            color: '#f7d047',
                            textDecoration: 'none',
                          }}
                        >
                          {item.action}
                          <ArrowRight size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        );
    }
  };

  const canProceed = () => {
    switch (STEPS[currentStep].id) {
      case 'welcome': return true;
      case 'situation': return !!answers.situation;
      case 'goals': return answers.goals.length > 0;
      case 'timeline': return !!answers.timeline;
      case 'gameplan': return true;
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

        <div style={styles.footer}>
          {currentStep > 0 ? (
            <button style={styles.backButton} onClick={goBack}>
              <ArrowLeft size={16} />
              Back
            </button>
          ) : (
            <div />
          )}

          {STEPS[currentStep].id === 'gameplan' ? (
            <button style={styles.nextButton} onClick={handleComplete}>
              Let's Go!
              <ArrowRight size={18} />
            </button>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}
