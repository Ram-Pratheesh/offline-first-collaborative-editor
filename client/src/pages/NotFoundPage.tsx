import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Compass } from 'lucide-react';
import { Button } from '../components/ui/Button';

const NotFoundPage: React.FC = () => {
  return (
    <div 
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        boxSizing: 'border-box',
        background: 'radial-gradient(circle at 10% 92%, #ffd7e8 0, transparent 24%), radial-gradient(circle at 88% 95%, #ded1ff 0, transparent 23%), linear-gradient(135deg, #fff7f8 0%, #fdf7ff 50%, #f3e8ff 100%)',
      }}
    >
      <div style={{ maxWidth: '520px', width: '100%', background: '#ffffff', borderRadius: '32px', padding: '64px 48px', boxSizing: 'border-box', textAlign: 'center', boxShadow: '0 24px 64px rgba(94, 55, 143, 0.12)', border: '1px solid #ebe6f0' }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring' }}
          style={{ margin: '0 auto 32px', width: '120px', height: '120px', background: '#faf7ff', borderRadius: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 4px 12px rgba(128, 60, 240, 0.1)' }}
        >
          <Compass size={64} color="#803cf0" />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ margin: '0 0 8px', fontSize: '64px', fontWeight: 900, background: 'linear-gradient(to right, #782cff, #d42ffc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.05em' }}
        >
          404
        </motion.h1>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ margin: '0 0 16px', fontSize: '28px', fontWeight: 800, color: '#171432', letterSpacing: '-0.04em' }}
        >
          Page not found
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ margin: '0 0 40px', fontSize: '16px', color: '#656180', lineHeight: 1.6 }}
        >
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Link to="/dashboard" style={{ textDecoration: 'none' }}>
            <Button
              size="lg"
              icon={<Home size={20} />}
              style={{ width: '100%' }}
            >
              Back to Dashboard
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFoundPage;
