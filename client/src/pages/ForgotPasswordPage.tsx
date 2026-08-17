import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
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
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-6 py-12">
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-primary/10 rounded-full blur-3xl" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 gradient-purple-blue rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold gradient-text">CollabEdit</h1>
        </div>

        {sent ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <div className="w-16 h-16 bg-success/15 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Check your email</h2>
            <p className="text-text-secondary mb-8">
              We've sent a password reset link to <strong className="text-text-primary">{email}</strong>
            </p>
            <Link to="/login">
              <Button variant="secondary" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sign In
              </Button>
            </Link>
          </motion.div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Forgot password?</h2>
            <p className="text-text-secondary mb-8">No worries, we'll send you reset instructions.</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} icon={<Mail className="w-4 h-4" />} required />
              <Button type="submit" loading={loading} className="w-full">Send Reset Link</Button>
            </form>

            <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-text-secondary hover:text-text-primary mt-6 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </Link>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
