import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { GoogleLogin } from '@react-oauth/google';

const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { register, googleLogin, isLoading, error, clearError } = useAuthStore();
  const { addToast } = useNotificationStore();
  const navigate = useNavigate();

  const passwordStrength = React.useMemo(() => {
    if (password.length === 0) return { level: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { level: 1, label: 'Weak', color: 'bg-error' };
    if (score <= 2) return { level: 2, label: 'Fair', color: 'bg-warning' };
    if (score <= 3) return { level: 3, label: 'Good', color: 'bg-info' };
    return { level: 4, label: 'Strong', color: 'bg-success' };
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      addToast({ type: 'error', title: 'Passwords do not match' });
      return;
    }
    if (password.length < 6) {
      addToast({ type: 'error', title: 'Password must be at least 6 characters' });
      return;
    }
    try {
      await register(name, email, password);
      addToast({ type: 'success', title: 'Account created!', message: 'Welcome to CollabEdit' });
      navigate('/dashboard');
    } catch (err: any) {
      addToast({ type: 'error', title: 'Registration Failed', message: err.message });
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center relative overflow-hidden py-6 px-4 sm:px-6 lg:px-8">
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
        <div className="glass-strong rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10 relative overflow-hidden">
          {/* Decorative subtle border top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-primary via-blue-primary to-cyan-accent opacity-80" />

          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 gradient-purple-blue rounded-2xl flex items-center justify-center shadow-lg shadow-purple-primary/30 mb-4">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary text-center tracking-tight">Create your account</h2>
            <p className="text-text-secondary mt-2 text-sm text-center">Start collaborating in seconds</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-error/10 border border-error/20 rounded-xl px-4 py-3 mb-6"
            >
              <p className="text-sm text-error font-medium">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col" style={{ gap: '0.875rem', marginBottom: '1.25rem' }}>
            <Input
              label="Full Name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => { setName(e.target.value); clearError(); }}
              icon={<User className="w-5 h-5" />}
              required
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearError(); }}
              icon={<Mail className="w-5 h-5" />}
              required
            />

            <div className="flex flex-col gap-1.5">
              <div className="relative flex flex-col">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 6 characters"
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
              {password && (
                <div className="space-y-1.5 pt-1 px-1">
                  <div className="flex gap-1 h-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`h-full flex-1 rounded-full transition-colors duration-300 ${i <= passwordStrength.level ? passwordStrength.color : 'bg-bg-elevated'}`} />
                    ))}
                  </div>
                  <p className={`text-[10px] font-medium tracking-wide uppercase ${passwordStrength.level <= 1 ? 'text-error' : passwordStrength.level <= 2 ? 'text-warning' : 'text-success'}`}>
                    {passwordStrength.label} Password
                  </p>
                </div>
              )}
            </div>

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={<Lock className="w-5 h-5" />}
              error={confirmPassword && password !== confirmPassword ? 'Passwords do not match' : undefined}
              required
            />

            <Button type="submit" loading={isLoading} className="w-full h-11 text-base font-semibold">
              Create Account
            </Button>
          </form>

          <div className="relative" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-default/50" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-[#1f2937] px-4 text-text-muted text-[10px] uppercase tracking-wider font-semibold">or register with</span>
            </div>
          </div>

          <div className="flex justify-center w-full" style={{ paddingBottom: '0.5rem' }}>
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                if (credentialResponse.credential) {
                  try {
                    await googleLogin(credentialResponse.credential);
                    addToast({ type: 'success', title: 'Welcome!', message: 'Registration successful via Google' });
                    navigate('/dashboard');
                  } catch (err: any) {
                    addToast({ type: 'error', title: 'Google Registration Failed', message: err.message });
                  }
                }
              }}
              onError={() => {
                addToast({ type: 'error', title: 'Google Registration Failed', message: 'Could not authenticate with Google' });
              }}
              theme="filled_black"
              shape="pill"
              size="large"
              text="signup_with"
            />
          </div>
        </div>

        <p className="text-center text-sm text-text-secondary" style={{ marginTop: '1.25rem' }}>
          Already have an account?{' '}
          <Link to="/login" className="text-purple-light hover:text-purple-primary font-semibold transition-colors">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
