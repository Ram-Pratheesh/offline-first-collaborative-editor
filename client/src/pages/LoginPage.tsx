import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Eye, EyeOff, Lock, Mail, MousePointer2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { GoogleLogin } from '@react-oauth/google';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, googleLogin, isLoading, error, clearError } = useAuthStore();
  const { addToast } = useNotificationStore();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await login(email, password);
      addToast({ type: 'success', title: 'Welcome back!', message: 'Login successful' });
      navigate('/dashboard');
    } catch (err: any) {
      addToast({ type: 'error', title: 'Login Failed', message: err.message });
    }
  };

  const handleGoogleLogin = async (credential?: string) => {
    if (!credential) return;
    try {
      await googleLogin(credential);
      addToast({ type: 'success', title: 'Welcome!', message: 'Signed in with Google' });
      navigate('/dashboard');
    } catch (err: any) {
      addToast({ type: 'error', title: 'Google Sign-In Failed', message: err.message });
    }
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

      {/* RIGHT: sign-in card */}
      <section className="relative flex min-h-screen items-center justify-center bg-white/15 px-5 py-10 sm:px-10 lg:px-12">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: 'easeOut' }} className="w-full rounded-[2rem] bg-white shadow-[0_25px_65px_rgba(72,32,120,.18)]" style={{ maxWidth: '460px', boxSizing: 'border-box', padding: '60px 40px 40px' }}>
          <header className="mb-9 text-center">
            <div className="mx-auto mb-4 text-center">
              <span className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#782cff] to-[#d42ffc]">CollabX</span>
            </div>
            <h2 className="text-4xl font-extrabold tracking-[-.04em] text-[#15103c]">Welcome back!</h2>
            <div className="mx-auto mt-2 h-1 w-24 rounded-full bg-gradient-to-r from-[#782cff] to-[#d42ffc]" />
            <p className="mt-4 text-lg text-[#7d7996]">Sign in to continue</p>
          </header>
          {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div><label htmlFor="email" className="mb-2 block text-sm font-semibold text-[#2b2747]">Email address</label><div style={{ height: '58px', display: 'grid', gridTemplateColumns: '36px minmax(0, 1fr)', alignItems: 'center', boxSizing: 'border-box', padding: '0 20px', border: '1px solid #dedbe8', borderRadius: '14px', background: '#fff' }}><Mail size={21} style={{ color: '#7935f5' }} /><input id="email" type="email" placeholder="Enter your email" value={email} onChange={(event) => { setEmail(event.target.value); clearError(); }} required style={{ width: '100%', minWidth: 0, height: '100%', padding: 0, border: 0, outline: 'none', background: 'transparent', color: '#282441', fontSize: '15px' }} /></div></div>
            <div><label htmlFor="password" className="mb-2 block text-sm font-semibold text-[#2b2747]">Password</label><div style={{ height: '58px', display: 'grid', gridTemplateColumns: '36px minmax(0, 1fr) 40px', alignItems: 'center', boxSizing: 'border-box', padding: '0 12px 0 20px', border: '1px solid #dedbe8', borderRadius: '14px', background: '#fff' }}><Lock size={21} style={{ color: '#7935f5' }} /><input id="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={(event) => { setPassword(event.target.value); clearError(); }} required style={{ width: '100%', minWidth: 0, height: '100%', padding: 0, border: 0, outline: 'none', background: 'transparent', color: '#282441', fontSize: '15px' }} /><button type="button" onClick={() => setShowPassword(!showPassword)} style={{ display: 'grid', placeItems: 'center', width: '40px', height: '40px', padding: 0, border: 0, background: 'transparent', color: '#817c98', cursor: 'pointer' }} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={21} /> : <Eye size={21} />}</button></div></div>
            <div className="flex items-center justify-between pt-1 text-sm"><label className="flex cursor-pointer items-center gap-2 text-[#2b2747]"><input type="checkbox" className="h-5 w-5 rounded border-[#c9c5d7] accent-[#7432f6]" />Remember me</label><Link to="/forgot-password" className="font-medium text-[#7228f5] hover:text-[#5314c5]">Forgot password?</Link></div>
            <button type="submit" disabled={isLoading} style={{ width: 'calc(100% - 32px)', height: '50px', display: 'flex', alignItems: 'center', justifySelf: 'center', margin: '8px auto 0', border: 0, borderRadius: '12px', background: 'linear-gradient(90deg, #ff4c58, #ed38ae, #793bf0)', boxShadow: '0 10px 20px rgba(214, 60, 202, 0.2)', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1, padding: '0 24px', justifyContent: 'center' }}>{isLoading ? 'Signing in...' : 'Sign in'} {!isLoading && <ArrowRight size={20} style={{ marginLeft: '12px' }} />}</button>
          </form>
          <div className="relative my-9 flex items-center justify-center"><div className="absolute inset-x-0 border-t border-[#ddd9e7]" /><span className="relative bg-white px-5 text-sm font-medium text-[#4a4565]">OR</span></div>
          <div style={{ position: 'relative', width: 'calc(100% - 32px)', height: '50px', margin: '0 auto', overflow: 'hidden', borderRadius: '12px', background: '#ffffff', border: '1px solid #dedbe8', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}><div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2b2747', fontSize: '15px', fontWeight: 600, pointerEvents: 'none' }}><svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: '11px' }} aria-hidden="true"><path fill="#4285F4" d="M21.35 12.27c0-.79-.07-1.55-.21-2.27H12v4.3h5.23a4.47 4.47 0 0 1-1.94 2.93v2.77h3.14c1.84-1.69 2.92-4.19 2.92-7.73Z" /><path fill="#34A853" d="M12 21.5c2.7 0 4.97-.9 6.63-2.5l-3.14-2.77c-.87.58-1.98.92-3.49.92-2.61 0-4.82-1.76-5.61-4.13H3.15v2.86A10 10 0 0 0 12 21.5Z" /><path fill="#FBBC05" d="M6.39 13.02A6 6 0 0 1 6.08 12c0-.35.06-.69.12-1.02V8.12H3.15A10 10 0 0 0 2 12c0 1.61.39 3.13 1.08 4.47l3.31-3.45Z" /><path fill="#EA4335" d="M12 6.85c1.6 0 3.03.55 4.16 1.62l3.12-3.12C16.96 3.19 14.7 2.5 12 2.5A10 10 0 0 0 3.15 8.12l3.05 2.86C7.01 8.61 9.39 6.85 12 6.85Z" /></svg>Continue with Google<ArrowRight size={20} style={{ marginLeft: '12px', color: '#817c98' }} /></div><div style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}><GoogleLogin onSuccess={(response) => handleGoogleLogin(response.credential)} onError={() => addToast({ type: 'error', title: 'Google Sign-In Failed', message: 'Could not authenticate with Google' })} theme="outline" shape="rectangular" size="large" text="continue_with" width="400" /></div></div>
          <p className="mt-10 text-center text-[#77728e]">Don’t have an account? <Link to="/register" className="font-semibold text-[#7228f5] hover:text-[#5314c5]">Create one</Link></p>
        </motion.div>
      </section>
    </main>
  );
};

export default LoginPage;