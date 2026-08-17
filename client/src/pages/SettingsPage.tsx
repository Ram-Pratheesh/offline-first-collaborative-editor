import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Bell, Type, Palette, Monitor } from 'lucide-react';
import { Button } from '../components/ui/Button';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();

  const settings = [
    {
      icon: <Bell className="w-5 h-5" />,
      title: 'Notifications',
      description: 'Configure how you receive notifications',
      items: [
        { label: 'Document shared with you', enabled: true },
        { label: 'Collaborator joins document', enabled: true },
        { label: 'Sync completed', enabled: false },
      ],
    },
    {
      icon: <Type className="w-5 h-5" />,
      title: 'Editor',
      description: 'Customize your editing experience',
      items: [
        { label: 'Show line numbers', enabled: false },
        { label: 'Word wrap', enabled: true },
        { label: 'Spell check', enabled: true },
      ],
    },
    {
      icon: <Palette className="w-5 h-5" />,
      title: 'Appearance',
      description: 'Theme and display settings',
      items: [
        { label: 'Dark mode', enabled: true },
        { label: 'Reduce animations', enabled: false },
        { label: 'Compact mode', enabled: false },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-bg-primary">
      <header className="sticky top-0 z-40 glass border-b border-border-subtle">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-card transition-colors cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-text-primary">Settings</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {settings.map((section, idx) => (
          <motion.div key={section.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="bg-bg-card rounded-2xl border border-border-subtle p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-bg-tertiary rounded-xl flex items-center justify-center text-text-secondary">
                {section.icon}
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">{section.title}</h3>
                <p className="text-xs text-text-muted">{section.description}</p>
              </div>
            </div>

            <div className="space-y-3">
              {section.items.map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2">
                  <span className="text-sm text-text-secondary">{item.label}</span>
                  <button
                    className={`
                      relative w-10 h-5.5 rounded-full transition-colors cursor-pointer
                      ${item.enabled ? 'bg-indigo-primary' : 'bg-bg-elevated'}
                    `}
                    style={{ height: '22px' }}
                  >
                    <span
                      className={`
                        absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full transition-transform shadow-sm
                        ${item.enabled ? 'translate-x-5' : 'translate-x-0.5'}
                      `}
                      style={{ width: '18px', height: '18px' }}
                    />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </main>
    </div>
  );
};

export default SettingsPage;
