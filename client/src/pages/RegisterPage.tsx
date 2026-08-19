import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Sparkles,
  User,
} from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';

const EditorPreview = () => (
  <div className="relative mt-7 h-[300px] w-full max-w-[660px]">
    <div className="absolute inset-0 overflow-hidden rounded-[1.7rem] border border-white/80 bg-white/95 shadow-[0_22px_42px_rgba(82,42,120,.16)]">
      <div className="flex h-11 items-center justify-between border-b border-[#e9e8f0] px-5">
        <div className="flex gap-2">
          <span className="h-3 w-3 rounded-full bg-[#ff625c]" />
          <span className="h-3 w-3 rounded-full bg-[#ffbd3d]" />
          <span className="h-3 w-3 rounded-full bg-[#30c76d]" />
        </div>

        <div className="flex gap-2">
          <span className="h-7 w-7 rounded-md bg-[#f9d8e6]" />
          <span className="h-7 w-7 rounded-md bg-[#e6ddfe]" />
          <span className="h-7 w-7 rounded-md bg-[#d6f7e8]" />
        </div>
      </div>

      <div className="flex h-[256px]">
        <aside className="w-16 border-r border-[#eeeef4] bg-[#fbfbfe] p-3">
          <div className="h-9 rounded-lg bg-[#fbe0e9]" />
          <div className="mt-4 h-9 rounded-lg bg-[#e3d8fe]" />
          <div className="mt-4 h-9 rounded-lg bg-[#c9f3df]" />
          <div className="mt-4 h-9 rounded-lg bg-[#fee8b9]" />
        </aside>

        <div className="flex-1">
          <div className="flex h-10 items-center gap-5 border-b border-[#eeeef4] px-6 text-sm text-[#77748d]">
            <b>B</b>
            <i>I</i>
            <u>U</u>
            <span>☷</span>
            <span>☰</span>
            <span>▧</span>
            <span className="ml-auto text-xs font-semibold text-[#18b985]">● SYNCED</span>
          </div>

          <div className="px-7 py-5">
            <div className="h-3 w-28 rounded-full bg-[#262b47]" />
            <div className="mt-3 h-3 w-24 rounded-full bg-[#e5e5ec]" />

            <div className="relative mt-5 rounded-md border-l-2 border-[#f65083] bg-[#fff7fa] px-3 py-2 text-[10px] text-[#625e76]">
              Define the final onboarding message for new team members.
              <span className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center">
                <span className="rounded bg-[#f65083] px-1.5 py-0.5 text-[9px] font-semibold text-white">Arjun</span>
              </span>
            </div>

            <div className="relative mt-3 rounded-md border-l-2 border-[#ff9900] bg-[#fffaf0] px-3 py-2 text-[10px] text-[#625e76]">
              Add owners and due dates for each Q4 project milestone.
              <span className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center">
                <span className="rounded bg-[#ff9900] px-1.5 py-0.5 text-[9px] font-semibold text-white">You</span>
              </span>
            </div>

            <div className="relative mt-3 rounded-md border-l-2 border-[#18b68a] bg-[#f2fcf8] px-3 py-2 text-[10px] text-[#625e76]">
              Review success metrics before sharing the launch plan.
              <span className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center">
                <span className="rounded bg-[#18b68a] px-1.5 py-0.5 text-[9px] font-semibold text-white">Meera</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, googleLogin, isLoading, error, clearError } = useAuthStore();
  const { addToast } = useNotificationStore();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      addToast({
        type: 'error',
        title: 'Passwords do not match',
        message: 'Please enter the same password in both fields.',
      });
      return;
    }

    if (password.length < 6) {
      addToast({
        type: 'error',
        title: 'Password too short',
        message: 'Password must contain at least 6 characters.',
      });
      return;
    }

    try {
      await register(fullName, email, password);

      addToast({
        type: 'success',
        title: 'Account created!',
        message: 'Welcome to CollabEdit.',
      });

      navigate('/dashboard');
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Registration Failed',
        message: err.message,
      });
    }
  };

  const handleGoogleLogin = async (credential?: string) => {
    if (!credential) return;

    try {
      await googleLogin(credential);

      addToast({
        type: 'success',
        title: 'Welcome!',
        message: 'Signed up with Google.',
      });

      navigate('/dashboard');
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Google Sign-Up Failed',
        message: err.message,
      });
    }
  };

  return (
    <main className="grid h-screen overflow-hidden bg-[#f9e8ef] font-sans text-[#17113f] lg:grid-cols-[minmax(0,1.08fr)_minmax(560px,.92fr)]">
      {/* Left panel */}
      <section className="relative hidden h-screen overflow-hidden bg-[radial-gradient(circle_at_43%_20%,#fff8e8_0,transparent_30%),radial-gradient(circle_at_22%_72%,#ffd9e7_0,transparent_34%),linear-gradient(135deg,#fff3f5_0%,#fdeeda_53%,#f6bfdb_100%)] px-12 py-8 lg:block xl:px-28">
        <div className="absolute -right-24 -top-16 h-96 w-96 rounded-full bg-[#7438e8]" />
        <div className="absolute -bottom-24 -left-24 h-72 w-[125%] rounded-[50%] bg-gradient-to-r from-[#9a5cf3] via-[#6d39df] to-[#9b48e9]" />
        <div className="absolute bottom-[-50px] right-[-40px] h-60 w-60 rounded-full bg-gradient-to-br from-[#ffb72f] to-[#ff672e]" />

        {/* Only decorative dots on the right, not behind text */}
        <div className="absolute right-12 top-20 grid grid-cols-5 gap-3 opacity-70">
          {Array.from({ length: 30 }).map((_, index) => (
            <i key={index} className="h-1.5 w-1.5 rounded-full bg-white" />
          ))}
        </div>

        <div className="absolute left-[63%] top-14 h-10 w-10 rotate-[-16deg] rounded-lg bg-gradient-to-br from-[#ff9da7] to-[#ff7388] shadow-lg shadow-rose-400/40" />

        <div className="relative z-10 flex h-full max-w-2xl flex-col justify-center">
          <div className="max-w-[620px]">
            <p className="mb-4 ml-1 text-sm font-bold tracking-wide text-[#fa4c74]">
              COLLABORATIVE WORKSPACE
            </p>

            <h1 className="text-[clamp(3rem,4.6vw,5.2rem)] font-black leading-[.92] tracking-[-.065em]">
              Create
              <br />
              <span className="bg-gradient-to-r from-[#ee3c8d] via-[#c742e7] to-[#7044f4] bg-clip-text text-transparent">
                together.
              </span>
              <br />
              From anywhere.
            </h1>

            <p className="mt-6 text-lg leading-7 text-[#535071]">
              Real-time collaborative editor
              <br />
              with an offline-first experience.
            </p>
          </div>

          <EditorPreview />
        </div>
      </section>

      {/* Right sign-up panel */}
      <section
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: '24px',
          boxSizing: 'border-box',
          background: 'rgba(255,255,255,0.1)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          style={{
            width: '100%',
            maxWidth: '600px',
            boxSizing: 'border-box',
            padding: '24px 28px 26px',
            borderRadius: '28px',
            background: '#ffffff',
            boxShadow: '0 22px 55px rgba(72, 32, 120, 0.17)',
          }}
        >
          <header style={{ textAlign: 'center', marginBottom: '19px' }}>
            <div className="mx-auto mb-4 text-center">
              <span className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#782cff] to-[#d42ffc]">CollabX</span>
            </div>

            <h2
              style={{
                margin: 0,
                color: '#17113f',
                fontSize: '27px',
                lineHeight: 1.15,
                fontWeight: 800,
                letterSpacing: '-0.7px',
              }}
            >
              Create your account
            </h2>

            <p style={{ margin: '8px 0 0', color: '#817c98', fontSize: '14px' }}>
              Start collaborating in seconds
            </p>
          </header>

          {error && (
            <div
              style={{
                marginBottom: '13px',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid #fecaca',
                background: '#fff1f2',
                color: '#dc2626',
                fontSize: '12px',
              }}
            >
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '13px',
            }}
          >
            <div>
              <label htmlFor="fullName" style={{ display: 'block', marginBottom: '7px', color: '#282441', fontSize: '13px', fontWeight: 600 }}>
                Full Name
              </label>

              <div style={{ height: '48px', display: 'grid', gridTemplateColumns: '34px minmax(0, 1fr)', alignItems: 'center', padding: '0 16px', border: '1px solid #dedbe8', borderRadius: '12px', background: '#fff' }}>
                <User size={19} style={{ color: '#737b98' }} />
                <input id="fullName" type="text" placeholder="John Doe" value={fullName} onChange={(event) => { setFullName(event.target.value); clearError(); }} required style={{ width: '100%', minWidth: 0, height: '100%', padding: 0, border: 0, outline: 'none', background: 'transparent', color: '#282441', fontSize: '14px' }} />
              </div>
            </div>

            <div>
              <label htmlFor="email" style={{ display: 'block', marginBottom: '7px', color: '#282441', fontSize: '13px', fontWeight: 600 }}>
                Email Address
              </label>

              <div style={{ height: '48px', display: 'grid', gridTemplateColumns: '34px minmax(0, 1fr)', alignItems: 'center', padding: '0 16px', border: '1px solid #dedbe8', borderRadius: '12px', background: '#fff' }}>
                <Mail size={19} style={{ color: '#737b98' }} />
                <input id="email" type="email" placeholder="you@example.com" value={email} onChange={(event) => { setEmail(event.target.value); clearError(); }} required style={{ width: '100%', minWidth: 0, height: '100%', padding: 0, border: 0, outline: 'none', background: 'transparent', color: '#282441', fontSize: '14px' }} />
              </div>
            </div>

            <div>
              <label htmlFor="password" style={{ display: 'block', marginBottom: '7px', color: '#282441', fontSize: '13px', fontWeight: 600 }}>
                Password
              </label>

              <div style={{ height: '48px', display: 'grid', gridTemplateColumns: '34px minmax(0, 1fr) 36px', alignItems: 'center', padding: '0 10px 0 16px', border: '1px solid #dedbe8', borderRadius: '12px', background: '#fff' }}>
                <Lock size={19} style={{ color: '#737b98' }} />
                <input id="password" type={showPassword ? 'text' : 'password'} placeholder="Min 6 characters" value={password} onChange={(event) => { setPassword(event.target.value); clearError(); }} required style={{ width: '100%', minWidth: 0, height: '100%', padding: 0, border: 0, outline: 'none', background: 'transparent', color: '#282441', fontSize: '14px' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ display: 'grid', placeItems: 'center', width: '36px', height: '36px', padding: 0, border: 0, background: 'transparent', color: '#817c98', cursor: 'pointer' }}>
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '7px', color: '#282441', fontSize: '13px', fontWeight: 600 }}>
                Confirm Password
              </label>

              <div style={{ height: '48px', display: 'grid', gridTemplateColumns: '34px minmax(0, 1fr) 36px', alignItems: 'center', padding: '0 10px 0 16px', border: '1px solid #dedbe8', borderRadius: '12px', background: '#fff' }}>
                <Lock size={19} style={{ color: '#737b98' }} />
                <input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} placeholder="Re-enter your password" value={confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); clearError(); }} required style={{ width: '100%', minWidth: 0, height: '100%', padding: 0, border: 0, outline: 'none', background: 'transparent', color: '#282441', fontSize: '14px' }} />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ display: 'grid', placeItems: 'center', width: '36px', height: '36px', padding: 0, border: 0, background: 'transparent', color: '#817c98', cursor: 'pointer' }}>
                  {showConfirmPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                height: '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: '3px',
                border: 0,
                borderRadius: '12px',
                background: 'linear-gradient(90deg, #ff4c58, #ed38ae, #793bf0)',
                boxShadow: '0 10px 20px rgba(214, 60, 202, 0.2)',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: 700,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
              {!isLoading && <ArrowRight size={20} style={{ marginLeft: '12px' }} />}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '13px', margin: '20px 0 17px' }}>
            <div style={{ flex: 1, height: '1px', background: '#dedbe8' }} />
            <span style={{ color: '#77728e', fontSize: '10px', fontWeight: 700 }}>
              OR REGISTER WITH
            </span>
            <div style={{ flex: 1, height: '1px', background: '#dedbe8' }} />
          </div>

          <div
            style={{
              position: 'relative',
              height: '50px',
              overflow: 'hidden',
              borderRadius: '12px',
              background: '#ffffff',
              border: '1px solid #dedbe8',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
          >
            {/* Visible colored design */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2b2747',
                fontSize: '15px',
                fontWeight: 600,
                pointerEvents: 'none',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: '11px' }} aria-hidden="true"><path fill="#4285F4" d="M21.35 12.27c0-.79-.07-1.55-.21-2.27H12v4.3h5.23a4.47 4.47 0 0 1-1.94 2.93v2.77h3.14c1.84-1.69 2.92-4.19 2.92-7.73Z" /><path fill="#34A853" d="M12 21.5c2.7 0 4.97-.9 6.63-2.5l-3.14-2.77c-.87.58-1.98.92-3.49.92-2.61 0-4.82-1.76-5.61-4.13H3.15v2.86A10 10 0 0 0 12 21.5Z" /><path fill="#FBBC05" d="M6.39 13.02A6 6 0 0 1 6.08 12c0-.35.06-.69.12-1.02V8.12H3.15A10 10 0 0 0 2 12c0 1.61.39 3.13 1.08 4.47l3.31-3.45Z" /><path fill="#EA4335" d="M12 6.85c1.6 0 3.03.55 4.16 1.62l3.12-3.12C16.96 3.19 14.7 2.5 12 2.5A10 10 0 0 0 3.15 8.12l3.05 2.86C7.01 8.61 9.39 6.85 12 6.85Z" /></svg>
              Sign up with Google
              <ArrowRight size={20} style={{ marginLeft: '12px', color: '#817c98' }} />
            </div>

            {/* Invisible real Google button — handles Google authentication */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                opacity: 0,
                cursor: 'pointer',
              }}
            >
              <GoogleLogin
                onSuccess={(response) => handleGoogleLogin(response.credential)}
                onError={() =>
                  addToast({
                    type: 'error',
                    title: 'Google Sign-Up Failed',
                    message: 'Could not authenticate with Google',
                  })
                }
                theme="outline"
                shape="rectangular"
                size="large"
                text="signup_with"
                width="400"
              />
            </div>
          </div>

          <p style={{ margin: '19px 0 0', color: '#817c98', fontSize: '13px', textAlign: 'center' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#732bf3', fontWeight: 700, textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </motion.div>
      </section>
    </main>
  );
};

export default RegisterPage;