import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      addToast({ type: 'success', title: 'Welcome back!', message: 'Login successful' });
      navigate('/dashboard');
    } catch (err: any) {
      addToast({ type: 'error', title: 'Login Failed', message: err.message });
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-bg-primary to-bg-primary" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-primary/20 rounded-full blur-[100px] mix-blend-screen animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-primary/20 rounded-full blur-[100px] mix-blend-screen animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-lg z-10"
      >
        <div className="glass-strong rounded-3xl p-10 sm:p-12 shadow-2xl border border-white/10 relative overflow-hidden">
          {/* Decorative subtle border top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-primary via-blue-primary to-cyan-accent opacity-80" />

          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 gradient-purple-blue rounded-2xl flex items-center justify-center shadow-lg shadow-purple-primary/30 mb-6">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-text-primary text-center tracking-tight">Welcome back</h2>
            <p className="text-text-secondary mt-3 text-center">Sign in to continue to CollabEdit</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-error/10 border border-error/20 rounded-xl px-4 py-4 mb-8"
            >
              <p className="text-sm text-error font-medium">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col" style={{ gap: '1.25rem', marginBottom: '2rem' }}>
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearError(); }}
              icon={<Mail className="w-5 h-5" />}
              required
            />

            <div className="relative flex flex-col">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearError(); }}
                icon={<Lock className="w-5 h-5" />}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 bottom-3 text-text-muted hover:text-text-primary transition-colors cursor-pointer p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-border-default bg-bg-tertiary checked:bg-purple-primary focus:ring-purple-primary focus:ring-offset-bg-primary transition-colors cursor-pointer" />
                <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-purple-light hover:text-purple-primary transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" loading={isLoading} className="w-full h-12 text-base font-semibold">
              Sign In
            </Button>
          </form>

          <div className="relative" style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-default/50" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-[#1f2937] px-4 text-text-muted text-xs uppercase tracking-wider font-semibold">or continue with</span>
            </div>
          </div>

          <div className="flex justify-center w-full" style={{ paddingBottom: '1rem' }}>
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                if (credentialResponse.credential) {
                  try {
                    await googleLogin(credentialResponse.credential);
                    addToast({ type: 'success', title: 'Welcome!', message: 'Signed in with Google' });
                    navigate('/dashboard');
                  } catch (err: any) {
                    addToast({ type: 'error', title: 'Google Sign-In Failed', message: err.message });
                  }
                }
              }}
              onError={() => {
                addToast({ type: 'error', title: 'Google Sign-In Failed', message: 'Could not authenticate with Google' });
              }}
              theme="filled_black"
              shape="pill"
              size="large"
              text="continue_with"
            />
          </div>
        </div>

        <p className="text-center text-sm text-text-secondary" style={{ marginTop: '2rem' }}>
          Don't have an account?{' '}
          <Link to="/register" className="text-purple-light hover:text-purple-primary font-semibold transition-colors">
            Create an account
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
