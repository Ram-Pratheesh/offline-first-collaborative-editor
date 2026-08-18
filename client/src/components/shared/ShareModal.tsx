import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Link2,
  Check,
  Copy,
  Shield,
  Eye,
  Edit3,
  Trash2,
  Globe,
} from 'lucide-react';

import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { useNotificationStore } from '../../store/notificationStore';
import { documentService } from '../../services/documentService';
import type { Document } from '../../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document;
  onUpdate: (doc: Document) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  document: doc,
  onUpdate,
}) => {
  const [copied, setCopied] = useState(false);
  const { addToast } = useNotificationStore();

  const shareableLink = `${window.location.origin}/document/${doc._id}`;
  const uniqueCollaborators = Array.from(
    new Map(doc.collaborators.map((c) => [c.user._id, c])).values()
  );

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareableLink);

      setCopied(true);

      addToast({
        type: 'success',
        title: 'Link copied!',
        message: 'Share it via WhatsApp, Telegram, etc.',
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

      addToast({
        type: 'success',
        title: 'Link copied!',
      });

      setTimeout(() => setCopied(false), 2500);
    }
  }, [shareableLink, addToast]);

  const handleRemove = async (userId: string) => {
    try {
      await documentService.removeCollaborator(doc._id, userId);

      onUpdate({
        ...doc,
        collaborators: doc.collaborators.filter(
          (c) => c.user._id !== userId
        ),
      });

      addToast({
        type: 'success',
        title: 'Collaborator removed',
      });
    } catch {
      addToast({
        type: 'error',
        title: 'Failed to remove collaborator',
      });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            padding: '24px',
          }}
        >
          {/* ====================================================== */}
          {/* BACKDROP */}
          {/* ====================================================== */}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* ====================================================== */}
          {/* MODAL */}
          {/* ====================================================== */}

          <motion.div
            initial={{
              opacity: 0,
              scale: 0.96,
              y: 10,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.96,
              y: 10,
            }}
            transition={{
              duration: 0.2,
              ease: 'easeOut',
            }}
            style={{
              width: '760px',
              maxWidth: 'calc(100vw - 48px)',
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(20px)',
              border: '1px solid #ebe6f0',
              borderRadius: '24px',
              boxShadow: '0 24px 50px rgba(94, 55, 143, 0.12)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >

            {/* ==================================================== */}
            {/* HEADER */}
            {/* ==================================================== */}

            <div
              className="flex items-center justify-between"
              style={{
                minHeight: '74px',
                padding: '0 28px',
                borderBottom: '1px solid #ebe6f0',
                background: '#ffffff',
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: '22px',
                  fontWeight: 800,
                  color: '#171432',
                }}
              >
                Share Document
              </h2>

              <button
                onClick={onClose}
                style={{
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 0,
                  borderRadius: '12px',
                  background: '#faf7ff',
                  color: '#656180',
                  cursor: 'pointer',
                }}
                aria-label="Close"
              >
                <X size={22} />
              </button>
            </div>

            {/* ==================================================== */}
            {/* MAIN CONTENT */}
            {/* ==================================================== */}

            <div
              style={{
                padding: '28px',
              }}
            >

              {/* ================================================== */}
              {/* SHARE LINK SECTION */}
              {/* ================================================== */}

              <div
                style={{
                  marginBottom: '30px',
                }}
              >

                {/* Label */}
                <div
                  className="flex items-center"
                  style={{
                    gap: '10px',
                    marginBottom: '14px',
                  }}
                >
                  <Globe
                    className="text-text-muted"
                    style={{
                      width: '20px',
                      height: '20px',
                      flexShrink: 0,
                    }}
                  />

                  <span
                    style={{
                      fontSize: '15px',
                      fontWeight: 700,
                      color: '#656180',
                    }}
                  >
                    Anyone with this link can join
                  </span>
                </div>

                {/* LINK + COPY */}
                <div
                  className="flex items-center"
                  style={{
                    gap: '14px',
                    width: '100%',
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      height: '56px',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 18px',
                      background: '#faf7ff',
                      border: '1px solid #ebe6f0',
                      borderRadius: '14px',
                      minWidth: 0,
                    }}
                  >
                    <Link2
                      style={{
                        width: '20px',
                        height: '20px',
                        color: '#a19cb5',
                        flexShrink: 0,
                        marginRight: '12px',
                      }}
                    />
                    <span
                      style={{
                        fontSize: '15px',
                        color: '#656180',
                        fontFamily: 'monospace',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {shareableLink}
                    </span>
                  </div>

                  <button
                    onClick={handleCopyLink}
                    style={{
                      height: '56px',
                      minWidth: '120px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '0 24px',
                      border: 0,
                      borderRadius: '14px',
                      color: '#ffffff',
                      background: 'linear-gradient(90deg, #ff4d86, #803cf0)',
                      boxShadow: '0 8px 20px rgba(203, 61, 200, 0.2)',
                      fontSize: '16px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {copied ? (
                      <>
                        <Check size={20} />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={20} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <p
                  style={{
                    margin: '16px 0 0 0',
                    fontSize: '14px',
                    color: '#8a849d',
                    lineHeight: '1.6',
                    maxWidth: '680px',
                  }}
                >
                  Send this link to collaborators through WhatsApp, Telegram, email, or any messaging app. They'll need to sign in to access the document.
                </p>
              </div>

              <div>
                <div
                  className="flex items-center justify-between"
                  style={{ marginBottom: '16px' }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: '16px',
                      fontWeight: 800,
                      color: '#171432',
                    }}
                  >
                    People with access
                  </p>

                  {uniqueCollaborators.length === 0 ? (
                    <span style={{ fontSize: '14px', color: '#8a849d', fontWeight: 600 }}>
                      Only you
                    </span>
                  ) : (
                    <span style={{ fontSize: '14px', color: '#8a849d', fontWeight: 600 }}>
                      {uniqueCollaborators.length}{' '}
                      {uniqueCollaborators.length === 1 ? 'collaborator' : 'collaborators'}
                    </span>
                  )}
                </div>

                {/* ================================================= */}
                {/* OWNER */}
                {/* ================================================= */}

                <div
                  className="flex items-center justify-between"
                  style={{
                    minHeight: '80px',
                    padding: '16px 20px',
                    marginBottom: '14px',
                    background: '#ffffff',
                    border: '1px solid #ebe6f0',
                    borderRadius: '16px',
                    boxShadow: '0 4px 14px rgba(94, 55, 143, 0.03)',
                  }}
                >
                  <div className="flex items-center min-w-0" style={{ gap: '16px' }}>
                    <Avatar src={doc.owner.avatar} name={doc.owner.name} size="sm" />
                    <div className="min-w-0">
                      <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#171432', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {doc.owner.name}
                      </p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#8a849d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {doc.owner.email}
                      </p>
                    </div>
                  </div>

                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 12px',
                      borderRadius: '20px',
                      background: '#f5efff',
                      color: '#8b42ed',
                      fontSize: '13px',
                      fontWeight: 800,
                    }}
                  >
                    <Shield size={14} />
                    Owner
                  </span>
                </div>

                {/* ================================================= */}
                {/* COLLABORATORS */}
                {/* ================================================= */}

                {uniqueCollaborators.map((collab) => (
                  <div
                    key={collab.user._id}
                    className="flex items-center justify-between"
                    style={{
                      minHeight: '80px',
                      padding: '16px 20px',
                      marginBottom: '14px',
                      background: '#ffffff',
                      border: '1px solid #ebe6f0',
                      borderRadius: '16px',
                      boxShadow: '0 4px 14px rgba(94, 55, 143, 0.03)',
                    }}
                  >
                    <div className="flex items-center min-w-0" style={{ gap: '16px' }}>
                      <Avatar src={collab.user.avatar} name={collab.user.name} size="sm" />
                      <div className="min-w-0">
                        <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#171432', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {collab.user.name}
                        </p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#8a849d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {collab.user.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center" style={{ gap: '16px' }}>
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '7px 12px',
                          borderRadius: '20px',
                          background: collab.permission === 'editor' ? '#eef6ff' : '#f4f4f5',
                          color: collab.permission === 'editor' ? '#2563eb' : '#52525b',
                          fontSize: '13px',
                          fontWeight: 800,
                        }}
                      >
                        {collab.permission === 'editor' ? <Edit3 size={14} /> : <Eye size={14} />}
                        {collab.permission === 'editor' ? 'Editor' : 'Viewer'}
                      </span>

                      <button
                        onClick={() => handleRemove(collab.user._id)}
                        style={{
                          width: '36px',
                          height: '36px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: 0,
                          borderRadius: '10px',
                          background: '#fff0f3',
                          color: '#f43f5e',
                          cursor: 'pointer',
                        }}
                        aria-label={`Remove ${collab.user.name}`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* ================================================= */}
                {/* EMPTY STATE */}
                {/* ================================================= */}

                {uniqueCollaborators.length === 0 && (
                  <div
                    style={{
                      minHeight: '100px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#faf7ff',
                      border: '1px dashed #d1cadd',
                      borderRadius: '16px',
                      textAlign: 'center',
                      padding: '24px',
                    }}
                  >
                    <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#656180' }}>
                      No collaborators yet
                    </p>
                    <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#8a849d' }}>
                      Share the link above to invite people.
                    </p>
                  </div>
                )}

              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};