import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle, MousePointer2, ArrowRight } from 'lucide-react';
import { useNotificationStore } from '../store/notificationStore';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { addToast } = useNotificationStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setSent(true);
      setLoading(false);
      addToast({ type: 'success', title: 'Email Sent', message: 'Check your inbox for reset instructions' });
    }, 1500);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f8e9ef] font-sans text-[#17113f] lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(560px,.95fr)]">
      {/* LEFT: collaborative-editor scene */}
      <section className="relative isolate hidden min-h-screen overflow-hidden bg-[radial-gradient(circle_at_44%_25%,#fff9e9_0,transparent_31%),radial-gradient(circle_at_20%_78%,#ffd8e5_0,transparent_32%),linear-gradient(135deg,#fff2f5_0%,#fdecd9_48%,#f9b8d8_100%)] px-10 py-12 lg:block xl:px-20">
        <div className="absolute -right-24 -top-16 h-96 w-96 rounded-full bg-[#7438e8]" />
        <div className="absolute -bottom-20 -left-20 h-72 w-[125%] rounded-[50%] bg-gradient-to-r from-[#9a5cf3] via-[#6d39df] to-[#9b48e9]" />
        <div className="absolute bottom-8 right-[-60px] h-64 w-64 rounded-full bg-gradient-to-br from-[#ffb72f] to-[#ff672e]" />
        <div className="absolute right-12 top-16 grid grid-cols-5 gap-3 opacity-70">{Array.from({ length: 30 }).map((_, index) => <i key={index} className="h-1.5 w-1.5 rounded-full bg-white" />)}</div>
        <div className="absolute left-[56%] top-24 h-10 w-10 rotate-[28deg] rounded-lg bg-gradient-to-br from-[#ff9a9e] to-[#ff506e] shadow-lg shadow-rose-400/40" />
        <div className="absolute right-14 top-[27%] h-12 w-24 rounded-full border-[5px] border-[#c87df7] border-l-transparent border-b-transparent rotate-[10deg]" />

        <div className="relative z-10 flex min-h-[calc(100vh-6rem)] w-full max-w-2xl flex-col justify-center pl-3">
          <div className="max-w-[620px]">
            <h1 className="text-[clamp(3.1rem,4.5vw,5.25rem)] font-black leading-[.94] tracking-[-.065em]">
              Create<br />
              <span className="bg-gradient-to-r from-[#ec3da0] via-[#f84d86] to-[#ff624d] bg-clip-text text-transparent">together.</span><br />
              From anywhere.
            </h1>
            <p className="ml-1 mt-7 max-w-md text-[1.18rem] leading-8 text-[#4f4a70]">Real-time collaborative editor<br />with offline-first experience.</p>
          </div>

          <div className="relative mt-10 h-[390px] w-full max-w-[570px]">
            <div className="absolute bottom-0 left-8 h-[350px] w-[calc(100%-2rem)] max-w-[460px] overflow-hidden rounded-[1.6rem] border border-white/90 bg-[#f8f8fc] shadow-[0_28px_42px_rgba(81,42,121,.2)]">
              <div className="flex items-center justify-between border-b border-[#e8e8f0] bg-white px-5 py-3.5">
                <div className="flex gap-2"><span className="h-3 w-3 rounded-full bg-[#ff625c]" /><span className="h-3 w-3 rounded-full bg-[#ffbd3d]" /><span className="h-3 w-3 rounded-full bg-[#30c76d]" /></div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#504d6d]"><span className="grid h-5 w-5 place-items-center rounded bg-[#7667ed] text-[11px] text-white">✦</span> Project proposal</div>
                <div className="flex -space-x-2"><span className="grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-[#f65083] text-[9px] font-bold text-white">A</span><span className="grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-[#ff9900] text-[9px] font-bold text-white">Y</span><span className="grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-[#18b68a] text-[9px] font-bold text-white">M</span></div>
              </div>
              <div className="flex items-center gap-4 border-b border-[#e8e8f0] bg-white px-6 py-2.5 text-sm text-[#8884a0]"><span className="rounded bg-[#f0effb] px-1.5 font-semibold text-[#574fc5]">Normal</span><b>B</b><i>I</i><u>U</u><span className="border-l border-[#deddea] pl-4">☷</span><span>☰</span><span>▧</span><span className="ml-auto rounded-md bg-[#f0effb] px-2 py-0.5 text-xs font-medium text-[#574fc5]">Share</span></div>
              <div className="flex h-[268px]">
                <aside className="w-10 border-r border-[#e8e8f0] bg-[#f2f1f8] pt-5 text-center text-[10px] text-[#aaa6bb]"><div className="mx-auto mb-4 grid h-5 w-5 place-items-center rounded bg-white text-[#625bd5] shadow-sm">☰</div><div className="mx-auto grid h-5 w-5 place-items-center rounded bg-[#e4e1ff] text-[#625bd5]">⌘</div></aside>
                <div className="relative flex-1 bg-white px-7 py-6">
                  <p className="text-[10px] font-bold uppercase tracking-[.17em] text-[#7d73d8]">Executive summary</p>
                  <h3 className="mt-2 text-[19px] font-bold tracking-[-.03em] text-[#2b2944]">Launch plan for Q4</h3>
                  <div className="mt-4 space-y-2 text-[10px] leading-4 text-[#7f7c91]"><p>Our focus is to build a collaborative workspace that helps distributed teams move faster.</p><p>By combining shared documents, comments and presence, every decision stays in context.</p></div>
                  <div className="mt-4 rounded-lg border border-[#e7e4f5] bg-[#fbfaff] p-3"><div className="flex items-center justify-between"><span className="text-[10px] font-semibold text-[#4a4664]">Key milestones</span><span className="text-[9px] text-[#857ee1]">View timeline →</span></div><div className="mt-2 flex gap-1.5"><span className="h-1.5 flex-1 rounded-full bg-[#7967ee]" /><span className="h-1.5 flex-1 rounded-full bg-[#c9c4f8]" /><span className="h-1.5 flex-1 rounded-full bg-[#e5e2f5]" /></div></div>
                  <div className="mt-3 space-y-2">
                    <div className="relative rounded-md border-l-2 border-[#f65083] bg-[#fff7fa] px-2.5 py-1.5 text-[9px] text-[#625e76]">Refine the onboarding message for the launch announcement.<span className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center"><MousePointer2 className="h-3.5 w-3.5 -rotate-45 fill-[#f65083] text-white" /><span className="rounded rounded-tl-none bg-[#f65083] px-1 py-0.5 text-[8px] font-semibold text-white">Arjun</span></span></div>
                    <div className="relative rounded-md border-l-2 border-[#ff9900] bg-[#fffaf0] px-2.5 py-1.5 text-[9px] text-[#625e76]">Add owners and dates to the Q4 milestone timeline.<span className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center"><MousePointer2 className="h-3.5 w-3.5 -rotate-45 fill-[#ff9900] text-white" /><span className="rounded rounded-tl-none bg-[#ff9900] px-1 py-0.5 text-[8px] font-semibold text-white">You</span></span></div>
                    <div className="relative rounded-md border-l-2 border-[#18b68a] bg-[#f2fcf8] px-2.5 py-1.5 text-[9px] text-[#625e76]">Review success metrics before sharing with the team.<span className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center"><MousePointer2 className="h-3.5 w-3.5 -rotate-45 fill-[#18b68a] text-white" /><span className="rounded rounded-tl-none bg-[#18b68a] px-1 py-0.5 text-[8px] font-semibold text-white">Meera</span></span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RIGHT: forgot password card */}
      <section className="relative flex min-h-screen items-center justify-center bg-white/15 px-5 py-10 sm:px-10 lg:px-12">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: 'easeOut' }} className="w-full rounded-[2rem] bg-white shadow-[0_25px_65px_rgba(72,32,120,.18)]" style={{ maxWidth: '460px', boxSizing: 'border-box', padding: '72px 48px 56px' }}>
          
          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-[#ecfdf5]">
                <CheckCircle size={48} color="#10bf7a" />
              </div>
              <h2 className="mb-4 text-[32px] font-extrabold tracking-[-.04em] text-[#15103c]">Check your email</h2>
              <p className="mb-10 text-[16px] leading-relaxed text-[#7d7996]">
                We've sent a password reset link to <br/><strong className="text-[#2b2747]">{email}</strong>
              </p>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <button type="button" style={{ width: 'calc(100% - 32px)', height: '54px', display: 'flex', alignItems: 'center', justifySelf: 'center', margin: '0 auto', border: 0, borderRadius: '14px', background: '#f8f8fc', color: '#15103c', fontSize: '16px', fontWeight: 700, cursor: 'pointer', padding: '0 24px', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)' }}>
                  <ArrowLeft size={20} style={{ marginRight: '10px', color: '#7d7996' }} />
                  Back to Sign In
                </button>
              </Link>
            </div>
          ) : (
            <>
              <header style={{ marginBottom: '48px', textAlign: 'center' }}>
                <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                  <span style={{ fontSize: '40px', fontWeight: 900, letterSpacing: '-0.025em', background: 'linear-gradient(to right, #782cff, #d42ffc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>CollabX</span>
                </div>
                <h2 style={{ margin: 0, fontSize: '36px', fontWeight: 800, letterSpacing: '-0.04em', color: '#15103c' }}>Forgot password?</h2>
                <div style={{ margin: '16px auto 0', height: '4px', width: '96px', borderRadius: '9999px', background: 'linear-gradient(to right, #782cff, #d42ffc)' }} />
                <p style={{ marginTop: '24px', marginBottom: 0, fontSize: '16px', color: '#7d7996' }}>No worries, we'll send you reset instructions.</p>
              </header>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div>
                  <label htmlFor="email" style={{ display: 'block', marginBottom: '12px', fontSize: '15px', fontWeight: 600, color: '#2b2747' }}>Email address</label>
                  <div style={{ height: '64px', display: 'grid', gridTemplateColumns: '40px minmax(0, 1fr)', alignItems: 'center', boxSizing: 'border-box', padding: '0 24px', border: '1px solid #dedbe8', borderRadius: '16px', background: '#fff' }}>
                    <Mail size={22} style={{ color: '#7935f5' }} />
                    <input id="email" type="email" placeholder="Enter your email" value={email} onChange={(event) => setEmail(event.target.value)} required style={{ width: '100%', minWidth: 0, height: '100%', padding: 0, border: 0, outline: 'none', background: 'transparent', color: '#282441', fontSize: '16px' }} />
                  </div>
                </div>
                <button type="submit" disabled={loading} style={{ width: 'calc(100% - 32px)', height: '56px', display: 'flex', alignItems: 'center', justifySelf: 'center', margin: '16px auto 0', border: 0, borderRadius: '14px', background: 'linear-gradient(90deg, #ff4c58, #ed38ae, #793bf0)', boxShadow: '0 10px 20px rgba(214, 60, 202, 0.2)', color: '#fff', fontSize: '16px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, padding: '0 24px', justifyContent: 'center' }}>
                  {loading ? 'Sending link...' : 'Send reset link'} {!loading && <ArrowRight size={22} style={{ marginLeft: '12px' }} />}
                </button>
              </form>
              <div style={{ marginTop: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 600, color: '#7228f5', textDecoration: 'none' }}>
                  <ArrowLeft size={18} />
                  Back to Sign In
                </Link>
              </div>
            </>
          )}
        </motion.div>
      </section>
    </main>
  );
};

export default ForgotPasswordPage;
