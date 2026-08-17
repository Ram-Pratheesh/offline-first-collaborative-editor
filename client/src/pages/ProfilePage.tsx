import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Mail, Camera, Lock, Save, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Avatar } from '../components/ui/Avatar';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { authService } from '../services/authService';

const ProfilePage: React.FC = () => {
  const { user, updateProfile, logout } = useAuthStore();
  const { addToast } = useNotificationStore();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const handleUpdateProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({ name });
      addToast({ type: 'success', title: 'Profile updated' });
    } catch (err: any) {
      addToast({ type: 'error', title: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      addToast({ type: 'error', title: 'Passwords do not match' });
      return;
    }
    if (newPassword.length < 6) {
      addToast({ type: 'error', title: 'Password must be at least 6 characters' });
      return;
    }
    setChangingPassword(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      addToast({ type: 'success', title: 'Password changed successfully' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      addToast({ type: 'error', title: err.response?.data?.message || 'Failed to change password' });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <header className="sticky top-0 z-40 glass border-b border-border-subtle">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-card transition-colors cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-text-primary">Profile</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-bg-card rounded-2xl border border-border-subtle p-6">
          <div className="flex items-center gap-6 mb-6">
            <div className="relative">
              <Avatar src={user?.avatar} name={user?.name || 'U'} size="lg" />
              <button className="absolute -bottom-1 -right-1 w-7 h-7 gradient-purple-blue rounded-full flex items-center justify-center shadow-lg cursor-pointer">
                <Camera className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">{user?.name}</h2>
              <p className="text-sm text-text-muted">{user?.email}</p>
              {user?.googleId && (
                <span className="inline-flex items-center gap-1 text-xs text-text-muted mt-1 bg-bg-tertiary px-2 py-0.5 rounded-full">
                  <svg className="w-3 h-3" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" /></svg>
                  Google Account
                </span>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} icon={<User className="w-4 h-4" />} />
            <Input label="Email" value={user?.email || ''} disabled icon={<Mail className="w-4 h-4" />} />
            <Button onClick={handleUpdateProfile} loading={saving}>
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        </motion.div>

        {/* Change Password */}
        {!user?.googleId && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-bg-card rounded-2xl border border-border-subtle p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Change Password
            </h3>
            <div className="space-y-4">
              <Input label="Current Password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              <Input label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              <Input label="Confirm New Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} error={confirmPassword && newPassword !== confirmPassword ? 'Passwords do not match' : undefined} />
              <Button onClick={handleChangePassword} loading={changingPassword} variant="secondary">Change Password</Button>
            </div>
          </motion.div>
        )}

        {/* Danger Zone */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-bg-card rounded-2xl border border-error/20 p-6">
          <h3 className="text-lg font-semibold text-error mb-2">Danger Zone</h3>
          <p className="text-sm text-text-secondary mb-4">Once you sign out, you'll need to sign in again.</p>
          <Button variant="danger" onClick={async () => { await logout(); navigate('/login'); }}>Sign Out</Button>
        </motion.div>
      </main>
    </div>
  );
};

export default ProfilePage;
