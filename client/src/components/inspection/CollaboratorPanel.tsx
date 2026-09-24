import React from 'react';
import { Users, UserPlus, Shield } from 'lucide-react';
import type { CollaboratorStatus } from '../../store/inspectionStore';

interface CollaboratorPanelProps {
  collaborators: CollaboratorStatus[];
  onOpenShare?: () => void;
}

export const CollaboratorPanel: React.FC<CollaboratorPanelProps> = ({
  collaborators,
  onOpenShare,
}) => {
  const online = collaborators.filter((c) => c.isOnline);

  return (
    <div
      style={{
        padding: '16px',
        border: '1px solid #ebe6f0',
        borderRadius: '16px',
        background: 'rgba(255,255,255,0.95)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#8a849d',
          }}
        >
          <Users size={14} />
          <span>Collaborators ({collaborators.length})</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', fontSize: '12px' }}>
        <span
          style={{
            display: 'inline-block',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: online.length > 0 ? '#22c55e' : '#9ca3af',
          }}
        />
        <span style={{ color: '#6b7280', fontWeight: 500 }}>
          {online.length} online · {collaborators.length - online.length} offline
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {collaborators.map((c) => (
          <div
            key={c.userId}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 10px',
              borderRadius: '10px',
              background: c.isOnline ? '#f0fdf4' : '#fafafa',
              border: c.isOnline ? '1px solid #dcfce7' : '1px solid #f3f4f6',
            }}
          >
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: c.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 800,
                }}
              >
                {c.userName.substring(0, 2).toUpperCase()}
              </div>
              <div
                style={{
                  position: 'absolute',
                  bottom: '-1px',
                  right: '-1px',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  border: '2px solid #ffffff',
                  background: c.isOnline ? '#22c55e' : '#9ca3af',
                }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#374151',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {c.userName}
                </span>
                {c.isOwner && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '2px',
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: '4px',
                      background: '#f3e8ff',
                      color: '#7c3aed',
                    }}
                  >
                    <Shield size={10} />
                    Owner
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  color: c.isOnline ? '#16a34a' : '#9ca3af',
                }}
              >
                {c.isOnline ? 'Online' : 'Offline'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {collaborators.length === 0 && (
        <div style={{ textAlign: 'center', padding: '12px', color: '#9ca3af', fontSize: '13px' }}>
          No collaborators yet
        </div>
      )}
    </div>
  );
};
