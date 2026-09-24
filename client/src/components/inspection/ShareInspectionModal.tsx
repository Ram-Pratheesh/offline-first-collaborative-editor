import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Link2,
  Check,
  Copy,
  Shield,
  Trash2,
  Globe,
  UserPlus,
  Loader2,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useNotificationStore } from '../../store/notificationStore';
import { inspectionService } from '../../services/inspectionService';
import type { Inspection } from '../../types';

interface ShareInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspection: Inspection;
  currentUserId: string;
  onUpdate: (inspection: Inspection) => void;
}

const COLLABORATOR_COLORS = [
  '#f87171', '#fb923c', '#4ade80', '#22d3ee',
  '#60a5fa', '#a78bfa', '#f472b6', '#e879f9',
];

export const ShareInspectionModal: React.FC<ShareInspectionModalProps> = ({
  isOpen,
  onClose,
  inspection,
  currentUserId,
  onUpdate,
}) => {
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [permission, setPermission] = useState<'editor' | 'viewer'>('editor');
  const [isInviting, setIsInviting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const { addToast } = useNotificationStore();

  const shareableLink = `${window.location.origin}/inspection/${inspection._id}`;
  const isOwner = inspection.owner._id === currentUserId;

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareableLink);
      setCopied(true);
      addToast({
        type: 'success',
        title: 'Link copied!',
        message: 'Share it with your team members to join.',
        duration: 2500,
      });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = shareableLink;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      addToast({ type: 'success', title: 'Link copied!' });
      setTimeout(() => setCopied(false), 2500);
    }
  }, [shareableLink, addToast]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = inviteEmail.trim();
    if (!email) return;

    setIsInviting(true);
    try {
      const updated = await inspectionService.share(inspection._id, email, permission);
      onUpdate(updated);
      setInviteEmail('');
      addToast({
        type: 'success',
        title: 'Collaborator added!',
        message: `${email} can now collaborate on this inspection.`,
      });
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Failed to add collaborator',
        message: error.response?.data?.message || 'Please check the email address and try again.',
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemove = async (userId: string) => {
    setRemovingId(userId);
    try {
      const updated = await inspectionService.removeCollaborator(inspection._id, userId);
      onUpdate(updated);
      addToast({
        type: 'success',
        title: 'Collaborator removed',
      });
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Failed to remove collaborator',
        message: error.response?.data?.message || 'Could not remove collaborator.',
      });
    } finally {
      setRemovingId(null);
    }
  };

  const uniqueCollaborators = (inspection.collaborators || []).filter(
    (collab, index, self) =>
      index === self.findIndex((c) => c.user?._id === collab.user?._id)
  );

  const totalCollaborators = uniqueCollaborators.length + 1; // +1 for owner

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(6px)',
            padding: '16px',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: 'spring', duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '520px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              background: '#ffffff',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.25)',
              border: '1px solid #ede8f5',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px 24px',
                borderBottom: '1px solid #f1ecf7',
                background: 'linear-gradient(135deg, #fbfaff 0%, #f4f0ff 100%)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: '#ede5ff',
                    color: '#7c3aed',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <Globe size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#171432', margin: 0 }}>
                    Share Inspection
                  </h3>
                  <p style={{ fontSize: '13px', color: '#7c7794', margin: '2px 0 0' }}>
                    {totalCollaborators} collaborator{totalCollaborators !== 1 ? 's' : ''} on this inspection
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'rgba(0,0,0,0.04)',
                  color: '#656180',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Area */}
            <div style={{ padding: '22px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Copy Link Section */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>
                  Inspection Link
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 8px 6px 14px',
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                  }}
                >
                  <Link2 size={16} color="#9ca3af" style={{ flexShrink: 0 }} />
                  <input
                    readOnly
                    value={shareableLink}
                    style={{
                      flex: 1,
                      border: 'none',
                      background: 'transparent',
                      fontSize: '13px',
                      color: '#4b5563',
                      outline: 'none',
                      textOverflow: 'ellipsis',
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={handleCopyLink}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied' : 'Copy link'}
                  </Button>
                </div>
              </div>


              {/* Collaborators List */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '10px' }}>
                  Current People ({totalCollaborators})
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Owner Row */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: '#fbfaff',
                      border: '1px solid #f0e9fa',
                      borderRadius: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                          color: '#ffffff',
                          display: 'grid',
                          placeItems: 'center',
                          fontSize: '13px',
                          fontWeight: 800,
                          flexShrink: 0,
                        }}
                      >
                        {inspection.owner?.name?.substring(0, 2).toUpperCase() || 'OW'}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {inspection.owner?.name || 'Owner'}
                          {inspection.owner?._id === currentUserId && (
                            <span style={{ fontSize: '11px', color: '#7c3aed', marginLeft: '6px', fontWeight: 600 }}>
                              (You)
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {inspection.owner?.email}
                        </div>
                      </div>
                    </div>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        background: '#f3e8ff',
                        color: '#7c3aed',
                        fontSize: '11px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      <Shield size={12} />
                      Owner
                    </span>
                  </div>

                  {/* Collaborators Rows */}
                  {uniqueCollaborators.map((collab, index) => {
                    const color = COLLABORATOR_COLORS[index % COLLABORATOR_COLORS.length];
                    const isRemoving = removingId === collab.user._id;

                    return (
                      <div
                        key={collab.user._id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          background: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '12px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: color,
                              color: '#ffffff',
                              display: 'grid',
                              placeItems: 'center',
                              fontSize: '13px',
                              fontWeight: 800,
                              flexShrink: 0,
                            }}
                          >
                            {collab.user?.name?.substring(0, 2).toUpperCase() || 'CO'}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {collab.user?.name}
                              {collab.user?._id === currentUserId && (
                                <span style={{ fontSize: '11px', color: '#7c3aed', marginLeft: '6px', fontWeight: 600 }}>
                                  (You)
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {collab.user?.email}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              padding: '4px 8px',
                              borderRadius: '6px',
                              background: collab.permission === 'editor' ? '#eff6ff' : '#f3f4f6',
                              color: collab.permission === 'editor' ? '#2563eb' : '#4b5563',
                              fontSize: '11px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                            }}
                          >
                            {collab.permission}
                          </span>

                          {isOwner && (
                            <button
                              type="button"
                              onClick={() => handleRemove(collab.user._id)}
                              disabled={isRemoving}
                              title="Remove collaborator"
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: '#ef4444',
                                cursor: 'pointer',
                                padding: '6px',
                                borderRadius: '6px',
                                display: 'grid',
                                placeItems: 'center',
                              }}
                            >
                              {isRemoving ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                padding: '16px 24px',
                borderTop: '1px solid #f1ecf7',
                background: '#fafafa',
              }}
            >
              <Button variant="ghost" onClick={onClose}>
                Done
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
