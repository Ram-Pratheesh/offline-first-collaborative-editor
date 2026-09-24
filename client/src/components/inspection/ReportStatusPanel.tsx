import React from 'react';
import { Shield, CheckCircle2, Clock, Lock, FileDown, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import type { ReportStatus } from '../../types';

interface ReportStatusPanelProps {
  status: ReportStatus | null;
  pendingReviews: number;
  onFinalize: () => void;
  onExportPdf: () => void;
  isExporting: boolean;
}

const STATUS_ICONS = {
  WAITING: { icon: Clock, color: '#f59e0b', bg: '#fffbeb' },
  COMPLETE: { icon: CheckCircle2, color: '#22c55e', bg: '#f0fdf4' },
  NOT_REQUIRED: { icon: CheckCircle2, color: '#6b7280', bg: '#f9fafb' },
  LOCKED: { icon: Lock, color: '#9ca3af', bg: '#f9fafb' },
  READY: { icon: Shield, color: '#22c55e', bg: '#f0fdf4' },
  FINALIZED: { icon: CheckCircle2, color: '#22c55e', bg: '#f0fdf4' },
  AVAILABLE: { icon: FileDown, color: '#7c3aed', bg: '#faf5ff' },
};

function StatusRow({
  label,
  value,
  customValueText,
}: {
  label: string;
  value: keyof typeof STATUS_ICONS;
  customValueText?: string;
}) {
  const cfg = STATUS_ICONS[value] || STATUS_ICONS.LOCKED;
  const Icon = cfg.icon;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 12px',
        borderRadius: '10px',
        background: cfg.bg,
      }}
    >
      <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{label}</span>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          fontSize: '12px',
          fontWeight: 700,
          color: cfg.color,
        }}
      >
        <Icon size={14} />
        {customValueText || value.replace('_', ' ')}
      </span>
    </div>
  );
}

export const ReportStatusPanel: React.FC<ReportStatusPanelProps> = ({
  status,
  pendingReviews,
  onFinalize,
  onExportPdf,
  isExporting,
}) => {
  if (!status) return null;

  const canFinalize = status.finalization === 'READY';
  const isFinalized = status.finalization === 'FINALIZED';
  const canExport = status.pdfExport === 'AVAILABLE';

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
          padding: '16px',
          borderBottom: '1px solid #f3f4f6',
          background: isFinalized ? '#f0fdf4' : '#faf7ff',
        }}
      >
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1f2937', margin: 0 }}>
          Report Status
        </h3>
        {pendingReviews > 0 && (
          <p style={{ fontSize: '12px', color: '#dc2626', margin: '4px 0 0', fontWeight: 500 }}>
            {pendingReviews} review(s) still pending
          </p>
        )}
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <StatusRow 
          label="Finalization" 
          value={status.finalization} 
          customValueText={
            status.totalUsers 
              ? `${status.finalizedUsers || 0} / ${status.totalUsers} Finalized` 
              : undefined
          }
        />
        <StatusRow label="PDF Export" value={status.pdfExport} />
      </div>

      <div style={{ padding: '8px 16px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {!isFinalized && (
          <Button
            onClick={onFinalize}
            disabled={!canFinalize}
            style={{
              width: '100%',
              opacity: canFinalize ? 1 : 0.5,
            }}
          >
            <Shield size={16} />
            {canFinalize ? 'Finalize Report' : 'Cannot Finalize Yet'}
          </Button>
        )}
        {isFinalized && (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: '10px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              textAlign: 'center',
              fontSize: '13px',
              fontWeight: 600,
              color: '#16a34a',
            }}
          >
            <CheckCircle2 size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            All collaborators finalized — PDF ready!
          </div>
        )}
        <Button
          variant="secondary"
          onClick={onExportPdf}
          disabled={!canExport || isExporting}
          style={{
            width: '100%',
            opacity: canExport ? 1 : 0.45,
          }}
        >
          {isExporting ? (
            <>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              Generating...
            </>
          ) : (
            <>
              <FileDown size={16} />
              {canExport ? 'Export PDF' : 'Export PDF (Locked)'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
