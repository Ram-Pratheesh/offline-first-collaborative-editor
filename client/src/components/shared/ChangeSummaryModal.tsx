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
            className="relative glass-strong rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 gradient-purple-blue rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">Changes Since Your Last Sync</h2>
                  <p className="text-xs text-text-muted">AI-powered summary</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-card transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {loading ? (
                <div className="flex flex-col items-center py-8">
                  <div className="w-12 h-12 border-2 border-purple-primary/30 border-t-purple-primary rounded-full animate-spin mb-4" />
                  <p className="text-text-secondary">Analyzing changes...</p>
                </div>
              ) : summary ? (
                <>
                  {/* Summary */}
                  <div className="bg-bg-tertiary rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">📝</span>
                      <span className="text-sm font-medium text-text-primary">Summary</span>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed">{summary.summary}</p>
                  </div>

                  {/* Contributor Changes */}
                  {summary.contributorChanges.length > 0 && (
                    <div className="space-y-3">
                      {summary.contributorChanges.map((contributor, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="bg-bg-tertiary rounded-xl p-4"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-7 h-7 gradient-indigo rounded-full flex items-center justify-center">
                              <User className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="text-sm font-medium text-text-primary">
                              {contributor.userName}
                            </span>
                          </div>
                          <ul className="space-y-1 ml-9">
                            {contributor.changes.map((change, cIdx) => (
                              <li key={cIdx} className="text-sm text-text-secondary flex items-start gap-2">
                                <span className="text-purple-light mt-1.5">•</span>
                                <span>{change}</span>
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Important Additions */}
                  {summary.importantAdditions.length > 0 && (
                    <div className="bg-success/5 border border-success/20 rounded-xl p-4">
                      <p className="text-sm font-medium text-success mb-2">✨ Important Additions</p>
                      <ul className="space-y-1">
                        {summary.importantAdditions.map((item, idx) => (
                          <li key={idx} className="text-sm text-text-secondary">• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Removed Content */}
                  {summary.removedContent.length > 0 && (
                    <div className="bg-warning/5 border border-warning/20 rounded-xl p-4">
                      <p className="text-sm font-medium text-warning mb-2">🗑️ Removed Content</p>
                      <ul className="space-y-1">
                        {summary.removedContent.map((item, idx) => (
                          <li key={idx} className="text-sm text-text-secondary">• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* No Edits Lost */}
                  {summary.noEditsLost && (
                    <div className="flex items-center gap-3 bg-success/10 rounded-xl px-4 py-3">
                      <CheckCircle className="w-5 h-5 text-success shrink-0" />
                      <p className="text-sm font-medium text-success">No edits were lost.</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-text-secondary">No changes to summarize.</p>
                </div>
              )}
            </div>

            <div className="border-t border-border-subtle flex justify-end" style={{ padding: '1rem 1.5rem' }}>
              <Button onClick={onClose} style={{ padding: '0.625rem 1.5rem' }}>Dismiss</Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
