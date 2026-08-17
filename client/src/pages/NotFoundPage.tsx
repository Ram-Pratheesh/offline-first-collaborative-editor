import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-6 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-primary/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-blue-primary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="mb-8"
        >
          <span className="text-[10rem] font-bold gradient-text leading-none tracking-tighter">404</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-3xl font-bold text-text-primary mb-4"
        >
          Page not found
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-text-secondary text-lg mb-8 max-w-md mx-auto"
        >
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Link to="/dashboard">
            <Button size="lg">
              <Home className="w-5 h-5" />
              Back to Dashboard
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;
