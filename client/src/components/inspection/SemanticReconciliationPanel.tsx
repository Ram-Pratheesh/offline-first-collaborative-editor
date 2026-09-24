import React from 'react';
import {
  AlertTriangle,
  Check,
  Copy,
  Minus,
  ThumbsUp,
  ThumbsDown,
  Edit3,
  Loader2,
} from 'lucide-react';
import { Button } from '../ui/Button';
import type { SemanticRelation, ObservationMeta } from '../../types';

interface SemanticReconciliationPanelProps {
  results: SemanticRelation[];
  observations: ObservationMeta[];
  isAnalyzing: boolean;
  onDecision: (resultId: string, decision: string) => void;
  onTriggerAnalysis: () => void;
  isFinalized: boolean;
}

const RELATIONSHIP_CONFIG = {
  DUPLICATE: {
    icon: Copy,
    color: '#f59e0b',
    bg: '#fffbeb',
    border: '#fde68a',
    label: 'Duplicate',
    symbol: '✓',
  },
  COMPLEMENTARY: {
    icon: Check,
    color: '#22c55e',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    label: 'Complementary',
    symbol: '✓',
  },
  CONTRADICTORY: {
    icon: AlertTriangle,
    color: '#ef4444',
    bg: '#fef2f2',
    border: '#fecaca',
    label: 'Potential Contradiction',
    symbol: '⚠️',
  },
  INDEPENDENT: {
    icon: Minus,
    color: '#6b7280',
    bg: '#f9fafb',
    border: '#e5e7eb',
    label: 'Independent',
    symbol: '—',
  },
};

export const SemanticReconciliationPanel: React.FC<SemanticReconciliationPanelProps> = ({
  results,
  observations,
  isAnalyzing,
  onDecision,
  onTriggerAnalysis,
  isFinalized,
}) => {
  const pending = results.filter(
    (r) => r.humanDecision === 'PENDING' && r.relationship !== 'INDEPENDENT'
  );
  const resolved = results.filter(
    (r) => r.humanDecision !== 'PENDING' || r.relationship === 'INDEPENDENT'
  );

  const getObservationText = (obsId: string) => {
    const obs = observations.find((o) => o.observationId === obsId);
    return obs;
  };

  return (
    <div
      style={{
        border: '1px solid #ebe6f0',
        borderRadius: '16px',
        background: 'rgba(255,255,255,0.95)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          borderBottom: '1px solid #f3f4f6',
          background: '#faf7ff',
        }}
      >
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1f2937', margin: 0 }}>
            Semantic Analysis
          </h3>
          <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0' }}>
            {pending.length > 0
              ? `${pending.length} relationship(s) need review`
              : results.length > 0
                ? 'All reviews completed'
                : 'Results will appear here automatically'}
          </p>
        </div>
        {!isFinalized && (
          <Button
            size="sm"
            onClick={onTriggerAnalysis}
            disabled={isAnalyzing}
            variant="secondary"
            style={{ fontSize: '13px' }}
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                Analyzing...
              </>
            ) : (
              'Re-analyze'
            )}
          </Button>
        )}
      </div>

      <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
        {results.length === 0 && !isAnalyzing && (
          <div
            style={{
              padding: '32px',
              textAlign: 'center',
              color: '#9ca3af',
              fontSize: '13px',
            }}
          >
            No semantic analysis results yet.
            <br />
            Analysis runs automatically after observations sync.

          </div>
        )}

        {isAnalyzing && results.length === 0 && (
          <div
            style={{
              padding: '32px',
              textAlign: 'center',
              color: '#7c3aed',
              fontSize: '13px',
            }}
          >
            <Loader2
              size={24}
              style={{ margin: '0 auto 8px', animation: 'spin 1s linear infinite' }}
            />
            Analyzing observations...
          </div>
        )}

        {results.map((result) => {
          const config = RELATIONSHIP_CONFIG[result.relationship];
          const Icon = config.icon;
          const obs1 = getObservationText(result.observationIds[0]);
          const obs2 = getObservationText(result.observationIds[1]);
          const isPending = result.humanDecision === 'PENDING' && result.relationship !== 'INDEPENDENT';

          return (
            <div
              key={result._id}
              style={{
                padding: '16px',
                borderBottom: '1px solid #f3f4f6',
              }}
            >
              {/* Relationship badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    background: config.bg,
                    border: `1px solid ${config.border}`,
                    color: config.color,
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  <Icon size={13} />
                  {config.label}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    color: '#9ca3af',
                    fontWeight: 500,
                  }}
                >
                  {Math.round(result.confidence * 100)}% confidence
                </span>
                {result.humanDecision !== 'PENDING' && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#22c55e',
                      background: '#f0fdf4',
                      padding: '2px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    ✓ {result.humanDecision.replace('_', ' ')}
                  </span>
                )}
              </div>

              {/* Observation excerpts */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                {obs1 && (
                  <div
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: '#f9fafb',
                      fontSize: '13px',
                      color: '#374151',
                      borderLeft: '3px solid #a78bfa',
                    }}
                  >
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#7c3aed' }}>
                      {obs1.authorName}:
                    </span>
                    <br />
                    <em style={{ color: '#6b7280' }}>(See observation card above)</em>
                  </div>
                )}
                {obs2 && (
                  <div
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: '#f9fafb',
                      fontSize: '13px',
                      color: '#374151',
                      borderLeft: '3px solid #60a5fa',
                    }}
                  >
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#3b82f6' }}>
                      {obs2.authorName}:
                    </span>
                    <br />
                    <em style={{ color: '#6b7280' }}>(See observation card above)</em>
                  </div>
                )}
              </div>

              {/* AI Reason */}
              <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 10px', lineHeight: 1.5 }}>
                {result.reason}
              </p>

              {/* Suggested text for COMPLEMENTARY */}
              {result.suggestedText && result.relationship === 'COMPLEMENTARY' && (
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    fontSize: '13px',
                    color: '#166534',
                    marginBottom: '10px',
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                    Suggested combined text:
                  </div>
                  "{result.suggestedText}"
                </div>
              )}

              {/* Action buttons */}
              {isPending && !isFinalized && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {result.relationship === 'COMPLEMENTARY' && result.suggestedText && (
                    <button
                      onClick={() => onDecision(result._id, 'ACCEPTED')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: '1px solid #bbf7d0',
                        background: '#f0fdf4',
                        color: '#16a34a',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <ThumbsUp size={12} />
                      Accept Suggestion
                    </button>
                  )}
                  {result.relationship === 'DUPLICATE' && (
                    <button
                      onClick={() => onDecision(result._id, 'KEPT_ONE')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: '1px solid #fde68a',
                        background: '#fffbeb',
                        color: '#d97706',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Keep One
                    </button>
                  )}
                  <button
                    onClick={() => onDecision(result._id, 'KEPT_BOTH')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      background: '#ffffff',
                      color: '#374151',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Keep Both
                  </button>
                  <button
                    onClick={() => onDecision(result._id, 'REJECTED')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1px solid #fecaca',
                      background: '#fef2f2',
                      color: '#dc2626',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <ThumbsDown size={12} />
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
