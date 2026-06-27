import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap, BookOpen, Users, BarChart3, ShieldCheck, Zap,
  Star, ChevronRight, Play, ArrowRight, CheckCircle2, Globe,
  Award, Clock, TrendingUp, MessageSquare, Layers, Sparkles,
  Code2, Heart, Rocket
} from 'lucide-react';

/* ───────────────────────────────────────────
   Animated counter hook
─────────────────────────────────────────── */
function useCounter(target: number, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

/* ───────────────────────────────────────────
   Data
─────────────────────────────────────────── */
const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how' },
  { label: 'Testimonials', href: '#testimonials' },
];

const FEATURES = [
  { icon: BookOpen,    color: '#4361f0', bg: 'rgba(67,97,240,0.1)',  title: 'Rich Course Builder',     desc: 'Create stunning courses with videos, quizzes, assignments, and live sessions in minutes.' },
  { icon: Users,       color: '#10b981', bg: 'rgba(16,185,129,0.1)', title: 'Multi-Role Platform',     desc: 'Seamless portals for Students, Teachers, Admins, and Parents — all in one system.' },
  { icon: BarChart3,   color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', title: 'Deep Analytics',          desc: 'Track progress, engagement, and outcomes with real-time dashboards and reports.' },
  { icon: ShieldCheck, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', title: 'Enterprise Security',     desc: 'OAuth 2.0, role-based access, encrypted data, and GDPR-compliant by design.' },
  { icon: MessageSquare,color:'#06b6d4', bg: 'rgba(6,182,212,0.1)',  title: 'Live Communication',      desc: 'Built-in live classrooms, chat, announcements, and parent-teacher messaging.' },
  { icon: Globe,       color: '#ec4899', bg: 'rgba(236,72,153,0.1)', title: 'Open Source',             desc: 'Fully open-source and self-hostable. Own your data and customize everything.' },
];

const STEPS = [
  { num: '01', icon: Rocket,       title: 'Set up in minutes',    desc: 'Deploy on your infrastructure or use our cloud. No technical expertise required.' },
  { num: '02', icon: Layers,       title: 'Build your courses',   desc: 'Upload videos, create assignments, and structure content with our intuitive builder.' },
  { num: '03', icon: Users,        title: 'Invite your team',     desc: 'Add teachers, enroll students, and set roles with granular permission controls.' },
  { num: '04', icon: TrendingUp,   title: 'Track & grow',         desc: 'Monitor learning outcomes, celebrate milestones, and continuously improve.' },
];

const TESTIMONIALS = [
  { name: 'Dr. Priya Sharma',   role: 'Dean, IIT Bombay',         avatar: 'PS', color: '#4361f0', text: 'OpenLearnX transformed our department. Students are more engaged than ever, and the analytics help us identify at-risk learners instantly.', rating: 5 },
  { name: 'Marcus Johnson',      role: 'CS Teacher, MIT Academy',  avatar: 'MJ', color: '#10b981', text: 'The course builder is a dream. I created a full semester curriculum with quizzes and live sessions in just two days. Simply outstanding!', rating: 5 },
  { name: 'Ananya Desai',        role: 'Student, 12th Grade',      avatar: 'AD', color: '#8b5cf6', text: 'I can track my progress, attend live classes, and submit assignments — all in one place. My grades improved by 40% this semester!', rating: 5 },
];

const STATS = [
  { value: 50000, suffix: 'K+', label: 'Active Learners',    icon: Users,    color: '#4361f0' },
  { value: 12000, suffix: '+',  label: 'Courses Created',    icon: BookOpen, color: '#10b981' },
  { value: 98,    suffix: '%',  label: 'Satisfaction Rate',  icon: Heart,    color: '#8b5cf6' },
  { value: 200,   suffix: '+',  label: 'Institutions',       icon: Award,    color: '#f59e0b' },
];

const PLANS = [
  { name: 'Free',       price: '0',  period: 'forever', color: '#94a3b8', features: ['Up to 50 students', '5 courses', 'Basic analytics', 'Community support'], cta: 'Get Started', popular: false },
  { name: 'Pro',        price: '29', period: '/month',  color: '#4361f0', features: ['Unlimited students', 'Unlimited courses', 'Advanced analytics', 'Live classes', 'Priority support', 'Custom domain'], cta: 'Start Free Trial', popular: true },
  { name: 'Enterprise', price: '99', period: '/month',  color: '#8b5cf6', features: ['Everything in Pro', 'White-label', 'SSO / SAML', 'Dedicated support', 'SLA guarantee', 'Custom integrations'], cta: 'Contact Sales', popular: false },
];

/* ───────────────────────────────────────────
   Component
─────────────────────────────────────────── */
const LandingPage: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const c0 = useCounter(STATS[0].value, 2000, statsVisible);
  const c1 = useCounter(STATS[1].value, 2000, statsVisible);
  const c2 = useCounter(STATS[2].value, 2000, statsVisible);
  const c3 = useCounter(STATS[3].value, 2000, statsVisible);
  const counters = [c0, c1, c2, c3];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#080d18', color: '#f1f5f9', overflowX: 'hidden' }}>

      {/* ── Navbar ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: scrolled ? 'rgba(8,13,24,0.9)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : '1px solid transparent',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg,#4361f0,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(67,97,240,0.4)' }}>
              <GraduationCap size={20} color="white" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 18, color: 'white', letterSpacing: '-0.02em' }}>OpenLearnX</span>
          </Link>

          {/* Nav Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="hidden md:flex">
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, fontWeight: 500, padding: '8px 14px', borderRadius: 8, textDecoration: 'none', transition: 'all 0.15s' }}
                onMouseEnter={e => { (e.target as HTMLElement).style.color = 'white'; (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.65)'; (e.target as HTMLElement).style.background = 'transparent'; }}>
                {l.label}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link to="/login" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 500, textDecoration: 'none', padding: '8px 16px' }}
              className="hidden sm:block">Sign In</Link>
            <Link to="/login" style={{ background: 'linear-gradient(135deg,#4361f0,#6366f1)', color: 'white', fontSize: 14, fontWeight: 700, padding: '10px 22px', borderRadius: 10, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 16px rgba(67,97,240,0.4)', transition: 'all 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(67,97,240,0.5)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(67,97,240,0.4)'; }}>
              Get Started <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        {/* Background */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(67,97,240,0.3) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', top: '20%', left: '-10%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(67,97,240,0.12)', filter: 'blur(80px)', animation: 'float 6s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '-5%', width: 350, height: 350, borderRadius: '50%', background: 'rgba(139,92,246,0.12)', filter: 'blur(80px)', animation: 'float 8s ease-in-out infinite reverse' }} />
        
        {/* Grid pattern overlay */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '40px 40px', maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)' }} />

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '120px 24px 80px', width: '100%', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }} className="hero-grid">

            {/* Left */}
            <div>
              {/* Badge */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(67,97,240,0.15)', border: '1px solid rgba(67,97,240,0.3)', borderRadius: 999, padding: '6px 16px', marginBottom: 28 }}>
                <Sparkles size={14} color="#818cf8" />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#a5b4fc' }}>Open Source • Free Forever • No Vendor Lock-in</span>
              </div>

              <h1 style={{ fontSize: 'clamp(40px, 5vw, 68px)', fontWeight: 900, lineHeight: 1.06, letterSpacing: '-0.03em', marginBottom: 24, color: 'white' }}>
                The Modern LMS<br />
                <span style={{ background: 'linear-gradient(135deg, #6183fb 0%, #a78bfa 50%, #ec4899 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  Built for Everyone
                </span>
              </h1>

              <p style={{ fontSize: 19, lineHeight: 1.7, color: 'rgba(255,255,255,0.55)', marginBottom: 40, maxWidth: 480 }}>
                Create, deliver, and track world-class learning experiences. OpenLearnX powers schools, universities, and enterprises with a platform that's powerful yet beautifully simple.
              </p>

              {/* CTA Buttons */}
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 48 }}>
                <Link to="/login" style={{ background: 'linear-gradient(135deg,#4361f0,#6366f1)', color: 'white', fontSize: 15, fontWeight: 700, padding: '14px 28px', borderRadius: 12, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 24px rgba(67,97,240,0.4)', transition: 'all 0.2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 32px rgba(67,97,240,0.5)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(67,97,240,0.4)'; }}>
                  Start for Free <ArrowRight size={16} />
                </Link>
                <a href="#how" style={{ background: 'rgba(255,255,255,0.07)', color: 'white', fontSize: 15, fontWeight: 600, padding: '14px 28px', borderRadius: 12, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, border: '1px solid rgba(255,255,255,0.12)', transition: 'all 0.2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'; }}>
                  <Play size={16} /> Watch Demo
                </a>
              </div>

              {/* Trust Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                {['No credit card required', 'Free forever plan', 'Open source'].map(t => (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
                    <CheckCircle2 size={14} color="#10b981" />
                    {t}
                  </div>
                ))}
              </div>
            </div>

            {/* Right – Dashboard Mockup */}
            <div style={{ position: 'relative' }} className="hero-right">
              {/* Glow */}
              <div style={{ position: 'absolute', inset: '-20px', background: 'radial-gradient(ellipse at center, rgba(67,97,240,0.2) 0%, transparent 70%)', borderRadius: '50%' }} />

              {/* Mock Window */}
              <div style={{ background: 'rgba(17,24,39,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', position: 'relative', zIndex: 2, animation: 'float 5s ease-in-out infinite' }}>
                {/* Title Bar */}
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['#ff5f57','#febc2e','#28c840'].map(c => <div key={c} style={{ width: 11, height: 11, borderRadius: '50%', background: c }} />)}
                  </div>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 6, padding: '4px 12px', fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
                    app.openlearnx.org/dashboard
                  </div>
                </div>

                {/* Dashboard Preview */}
                <div style={{ padding: 20 }}>
                  {/* Stats Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
                    {[{ label:'Courses', val:'24', clr:'#4361f0' },{ label:'Students', val:'1,842', clr:'#10b981' },{ label:'Completion', val:'86%', clr:'#8b5cf6' }].map(s => (
                      <div key={s.label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '14px', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: s.clr }}>{s.val}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Chart Area */}
                  <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 16, marginBottom: 16, border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>Enrollment Trend</div>
                    <svg viewBox="0 0 300 80" style={{ width: '100%', height: 80 }}>
                      <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4361f0" stopOpacity="0.5" />
                          <stop offset="100%" stopColor="#4361f0" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path d="M0,60 C40,50 60,20 100,25 C140,30 160,55 200,40 C240,25 260,15 300,10 L300,80 L0,80 Z" fill="url(#chartGrad)" />
                      <path d="M0,60 C40,50 60,20 100,25 C140,30 160,55 200,40 C240,25 260,15 300,10" fill="none" stroke="#4361f0" strokeWidth="2.5" strokeLinecap="round" />
                      {[[100,25],[200,40],[300,10]].map(([x,y],i) => <circle key={i} cx={x} cy={y} r="4" fill="#4361f0" stroke="rgba(17,24,39,0.8)" strokeWidth="2" />)}
                    </svg>
                  </div>

                  {/* Course List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { title: 'Advanced React', prog: 78, clr: '#4361f0' },
                      { title: 'Data Science 101', prog: 54, clr: '#10b981' },
                      { title: 'UI/UX Design', prog: 92, clr: '#8b5cf6' },
                    ].map(c => (
                      <div key={c.title} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 12px' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.clr, flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{c.title}</span>
                        <div style={{ width: 80, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 999, overflow: 'hidden' }}>
                          <div style={{ width: `${c.prog}%`, height: '100%', background: c.clr, borderRadius: 999 }} />
                        </div>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', width: 30, textAlign: 'right' }}>{c.prog}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <div style={{ position: 'absolute', top: -16, right: -20, background: '#10b981', color: 'white', borderRadius: 12, padding: '10px 16px', fontSize: 13, fontWeight: 700, boxShadow: '0 8px 20px rgba(16,185,129,0.4)', animation: 'float 4s ease-in-out infinite', zIndex: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Star size={14} fill="white" /> 4.9 Rating
              </div>
              <div style={{ position: 'absolute', bottom: 30, left: -24, background: '#1e2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '12px 18px', fontSize: 13, fontWeight: 600, color: 'white', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', animation: 'float 5s ease-in-out infinite 1s', zIndex: 3, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#4361f0,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={16} color="white" />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>+248 joined today</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>New learners onboarded</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
          <div style={{ width: 1, height: 48, background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.2))', animation: 'float 2s ease-in-out infinite' }} />
          <span>Scroll to explore</span>
        </div>
      </section>

      {/* ── Stats ── */}
      <section ref={statsRef} style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '64px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 32 }} className="stats-grid">
          {STATS.map((s, i) => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: 16, background: `${s.color}18`, marginBottom: 12 }}>
                <s.icon size={22} color={s.color} />
              </div>
              <div style={{ fontSize: 40, fontWeight: 900, color: 'white', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {counters[i].toLocaleString()}{s.suffix}
              </div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginTop: 6, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ padding: '120px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          {/* Section Header */}
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(67,97,240,0.12)', border: '1px solid rgba(67,97,240,0.25)', borderRadius: 999, padding: '5px 14px', marginBottom: 20 }}>
              <Zap size={13} color="#818cf8" />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Features</span>
            </div>
            <h2 style={{ fontSize: 48, fontWeight: 900, color: 'white', letterSpacing: '-0.03em', marginBottom: 16 }}>
              Everything you need to<br />
              <span style={{ background: 'linear-gradient(135deg,#6183fb,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>deliver great learning</span>
            </h2>
            <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)', maxWidth: 520, margin: '0 auto' }}>
              A complete learning management system packed with every tool you need to create, manage, and scale your educational programs.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }} className="features-grid">
            {FEATURES.map((f, i) => (
              <div key={f.title}
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 28, transition: 'all 0.25s', cursor: 'default', animationDelay: `${i * 0.08}s` }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.06)'; el.style.borderColor = 'rgba(255,255,255,0.12)'; el.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.03)'; el.style.borderColor = 'rgba(255,255,255,0.07)'; el.style.transform = 'translateY(0)'; }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 14, background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18, border: `1px solid ${f.color}30` }}>
                  <f.icon size={22} color={f.color} />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: 'white', marginBottom: 10 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how" style={{ padding: '120px 24px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 999, padding: '5px 14px', marginBottom: 20 }}>
              <Clock size={13} color="#10b981" />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>How It Works</span>
            </div>
            <h2 style={{ fontSize: 48, fontWeight: 900, color: 'white', letterSpacing: '-0.03em', marginBottom: 16 }}>
              Up and running in{' '}
              <span style={{ background: 'linear-gradient(135deg,#10b981,#34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>4 simple steps</span>
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24, position: 'relative' }} className="steps-grid">
            {/* Connector line */}
            <div style={{ position: 'absolute', top: 36, left: '12.5%', right: '12.5%', height: 1, background: 'linear-gradient(90deg, rgba(67,97,240,0.5), rgba(139,92,246,0.5))', zIndex: 0 }} className="hidden lg:block" />

            {STEPS.map((s, i) => (
              <div key={s.num} style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: `linear-gradient(135deg, rgba(67,97,240,0.2), rgba(139,92,246,0.2))`, border: '2px solid rgba(67,97,240,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', position: 'relative' }}>
                  <s.icon size={28} color="#6183fb" />
                  <div style={{ position: 'absolute', top: -8, right: -8, width: 24, height: 24, borderRadius: '50%', background: '#4361f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: 'white' }}>{i + 1}</div>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" style={{ padding: '120px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 999, padding: '5px 14px', marginBottom: 20 }}>
              <Star size={13} color="#f59e0b" fill="#f59e0b" />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#fcd34d', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Testimonials</span>
            </div>
            <h2 style={{ fontSize: 48, fontWeight: 900, color: 'white', letterSpacing: '-0.03em', marginBottom: 16 }}>
              Loved by{' '}
              <span style={{ background: 'linear-gradient(135deg,#f59e0b,#fb923c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>thousands worldwide</span>
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }} className="testimonials-grid">
            {TESTIMONIALS.map(t => (
              <div key={t.name} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 28, transition: 'all 0.2s' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(255,255,255,0.15)'; el.style.background = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(255,255,255,0.07)'; el.style.background = 'rgba(255,255,255,0.03)'; }}
              >
                {/* Stars */}
                <div style={{ display: 'flex', gap: 3, marginBottom: 16 }}>
                  {[...Array(t.rating)].map((_, i) => <Star key={i} size={14} color="#f59e0b" fill="#f59e0b" />)}
                </div>
                <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 1.75, marginBottom: 24, fontStyle: 'italic' }}>"{t.text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: `${t.color}25`, border: `2px solid ${t.color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: t.color, flexShrink: 0 }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* ── CTA Banner ── */}
      <section style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center', background: 'linear-gradient(135deg, rgba(67,97,240,0.15) 0%, rgba(139,92,246,0.15) 100%)', border: '1px solid rgba(67,97,240,0.2)', borderRadius: 28, padding: '72px 48px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-40%', left: '-10%', width: '60%', height: '150%', background: 'radial-gradient(ellipse, rgba(67,97,240,0.15), transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-40%', right: '-10%', width: '60%', height: '150%', background: 'radial-gradient(ellipse, rgba(139,92,246,0.15), transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
            <h2 style={{ fontSize: 44, fontWeight: 900, color: 'white', letterSpacing: '-0.03em', marginBottom: 16 }}>
              Ready to transform your learning?
            </h2>
            <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.55)', marginBottom: 36, maxWidth: 480, margin: '0 auto 36px' }}>
              Join 50,000+ learners and educators who use OpenLearnX to deliver exceptional education.
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/login" style={{ background: 'linear-gradient(135deg,#4361f0,#6366f1)', color: 'white', fontSize: 16, fontWeight: 700, padding: '16px 36px', borderRadius: 14, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 24px rgba(67,97,240,0.45)', transition: 'all 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
                Start for Free <ArrowRight size={18} />
              </Link>
              <a href="#features" style={{ background: 'rgba(255,255,255,0.08)', color: 'white', fontSize: 16, fontWeight: 600, padding: '16px 36px', borderRadius: 14, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.15)', transition: 'all 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; }}>
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '48px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#4361f0,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraduationCap size={18} color="white" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 16, color: 'white' }}>OpenLearnX</span>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
            The open-source LMS for modern education. Built with ❤️ for learners everywhere.
          </p>
          <div style={{ display: 'flex', gap: 24 }}>
            {['Privacy Policy', 'Terms of Service', 'GitHub', 'Support'].map(l => (
              <a key={l} href="#" style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => { (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.7)'; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.35)'; }}>
                {l}
              </a>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>© 2026 OpenLearnX. All rights reserved.</p>
        </div>
      </footer>

      {/* Responsive styles */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @media (max-width: 1024px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .hero-right { display: none; }
          .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
          .features-grid { grid-template-columns: repeat(2,1fr) !important; }
          .steps-grid { grid-template-columns: repeat(2,1fr) !important; }
          .testimonials-grid { grid-template-columns: 1fr !important; }
          .pricing-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .steps-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
