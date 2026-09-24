import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, WifiOff, Wifi, GitMerge, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import type { ReconnectionSummary } from '../../types';

interface ReconnectionSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: ReconnectionSummary | null;
}

export const ReconnectionSummaryModal: React.FC<ReconnectionSummaryModalProps> = ({
  isOpen,
  onClose,
  summary,
}) => {
  if (!summary) return null;

  const totalRelationships =
    summary.semanticRelationships.duplicate +
    summary.semanticRelationships.complementary +
    summary.semanticRelationships.contradictory +
    summary.semanticRelationships.independent;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(4px)',
            padding: '16px',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '440px',
              background: '#ffffff',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 24px 64px rgba(0,0,0,0.15)',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px 24px',
                background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)',
                borderBottom: '1px solid #d1fae5',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: '#dcfce7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <RefreshCw size={20} color="#22c55e" />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1f2937', margin: 0 }}>
                    Back Online!
                  </h3>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                    Your offline changes have been synchronized
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: '4px',
                  color: '#9ca3af',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Stats */}
            <div style={{ padding: '20px 24px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  marginBottom: '20px',
                }}
              >
                <div
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    background: '#f0fdf4',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#16a34a' }}>
                    {summary.changesSynchronized}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500 }}>
                    Changes Synced
                  </div>
                </div>
                <div
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    background: '#faf5ff',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#7c3aed' }}>
                    {summary.relevantObservations}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500 }}>
                    Observations Affected
                  </div>
                </div>
              </div>

              {/* Semantic relationships breakdown */}
              {totalRelationships > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <GitMerge size={14} />
                    Detected Relationships
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {summary.semanticRelationships.complementary > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          background: '#f0fdf4',
                          fontSize: '13px',
                        }}
                      >
                        <span style={{ color: '#16a34a', fontWeight: 600 }}>Complementary</span>
                        <span style={{ fontWeight: 700 }}>{summary.semanticRelationships.complementary}</span>
                      </div>
                    )}
                    {summary.semanticRelationships.contradictory > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          background: '#fef2f2',
                          fontSize: '13px',
                        }}
                      >
                        <span style={{ color: '#dc2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertCircle size={13} />
                          Contradictory — Review Required
                        </span>
                        <span style={{ fontWeight: 700 }}>{summary.semanticRelationships.contradictory}</span>
                      </div>
                    )}
                    {summary.semanticRelationships.duplicate > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          background: '#fffbeb',
                          fontSize: '13px',
                        }}
                      >
                        <span style={{ color: '#d97706', fontWeight: 600 }}>Duplicate</span>
                        <span style={{ fontWeight: 700 }}>{summary.semanticRelationships.duplicate}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '0 24px 20px' }}>
              <Button onClick={onClose} style={{ width: '100%' }}>
                Continue Working
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
