import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, CheckCircle, User, Clock, ArrowDown } from 'lucide-react';
import { Button } from '../ui/Button';
import type { ChangeSummary } from '../../types';

interface ChangeSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: ChangeSummary | null;
  loading?: boolean;
}

export const ChangeSummaryModal: React.FC<ChangeSummaryModalProps> = ({
  isOpen,
  onClose,
  summary,
  loading,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '85vh',
              overflowY: 'auto',
              background: '#ffffff',
              borderRadius: '24px',
              border: '1px solid #ebe6f0',
              boxShadow: '0 24px 64px rgba(94, 55, 143, 0.16)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 32px', borderBottom: '1px solid #ebe6f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(168, 85, 247, 0.2)' }}>
                  <Sparkles size={24} color="#ffffff" />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#171432' }}>Changes Since Your Last Sync</h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 600, color: '#8a849d' }}>AI-powered summary</p>
                </div>
              </div>
              <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', border: 0, borderRadius: '10px', background: '#faf7ff', color: '#656180', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0' }}>
                  <div style={{ width: '48px', height: '48px', border: '3px solid rgba(128, 60, 240, 0.2)', borderTopColor: '#803cf0', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
                  <p style={{ margin: 0, fontSize: '15px', color: '#8a849d', fontWeight: 600 }}>Analyzing changes...</p>
                </div>
              ) : summary ? (
                <>
                  {/* Summary */}
                  <div style={{ background: '#faf7ff', borderRadius: '16px', padding: '20px', border: '1px solid #ebe6f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '18px' }}>📝</span>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: '#171432' }}>Summary</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6', color: '#656180' }}>{summary.summary}</p>
                  </div>

                  {/* Contributor Changes */}
                  {summary.contributorChanges.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {summary.contributorChanges.map((contributor, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          style={{ background: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #ebe6f0', boxShadow: '0 4px 12px rgba(94, 55, 143, 0.03)' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #ff4d86 0%, #803cf0 100%)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff' }}>
                                {contributor.userName.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <span style={{ fontSize: '15px', fontWeight: 800, color: '#171432' }}>
                              {contributor.userName}
                            </span>
                          </div>
                          <ul style={{ margin: 0, paddingLeft: '44px', display: 'flex', flexDirection: 'column', gap: '12px', listStyle: 'none' }}>
                            {contributor.changes.map((change, cIdx) => (
                              <li key={cIdx} style={{ fontSize: '14px', color: '#656180', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                <span style={{ color: '#803cf0', marginTop: '2px', fontSize: '18px', lineHeight: 1 }}>•</span>
                                <span style={{ lineHeight: '1.6' }}>{change}</span>
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Removed Content */}
                  {summary.removedContent.length > 0 && (
                    <div style={{ background: '#fff0f2', border: '1px solid #ffe1e6', borderRadius: '16px', padding: '20px' }}>
                      <p style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 800, color: '#f43f5e' }}>🗑️ Removed Content</p>
                      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {summary.removedContent.map((item, idx) => (
                          <li key={idx} style={{ fontSize: '14px', color: '#656180', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                            <span style={{ color: '#f43f5e' }}>•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* No Edits Lost */}
                  {summary.noEditsLost && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#ecfdf5', border: '1px solid #d1fae5', borderRadius: '16px', padding: '16px 20px' }}>
                      <CheckCircle size={20} color="#10bf7a" style={{ flexShrink: 0 }} />
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#10bf7a' }}>No edits were lost.</p>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <p style={{ margin: 0, fontSize: '15px', color: '#8a849d' }}>No changes to summarize.</p>
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid #ebe6f0', padding: '20px 32px', display: 'flex', justifyContent: 'flex-end', background: '#faf7ff', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px' }}>
              <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 24px', height: '44px', borderRadius: '12px', border: 0, background: 'linear-gradient(90deg, #ff4d86, #803cf0)', color: '#ffffff', fontSize: '15px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(203, 61, 200, 0.2)' }}>
                Dismiss
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
