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
            className="
              relative
              glass-strong
              rounded-2xl
              shadow-2xl
              overflow-hidden
            "
            style={{
              width: '760px',
              maxWidth: 'calc(100vw - 48px)',
            }}
          >

            {/* ==================================================== */}
            {/* HEADER */}
            {/* ==================================================== */}

            <div
              className="
                flex
                items-center
                justify-between
                border-b
                border-border-subtle
              "
              style={{
                minHeight: '68px',
                padding: '0 28px',
              }}
            >
              <h2
                className="text-xl font-semibold text-text-primary"
                style={{
                  margin: 0,
                }}
              >
                Share Document
              </h2>

              <button
                onClick={onClose}
                className="
                  rounded-lg
                  text-text-muted
                  hover:text-text-primary
                  hover:bg-bg-card
                  transition-colors
                  cursor-pointer
                "
                style={{
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
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
                    className="text-sm font-semibold text-text-secondary"
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

                  {/* Link box */}
                  <div
                    className="
                      flex
                      items-center
                      bg-bg-tertiary
                      border
                      border-border-default
                      rounded-xl
                    "
                    style={{
                      height: '52px',
                      flex: 1,
                      minWidth: 0,
                      padding: '0 16px',
                    }}
                  >
                    <Link2
                      className="text-text-muted"
                      style={{
                        width: '18px',
                        height: '18px',
                        flexShrink: 0,
                        marginRight: '10px',
                      }}
                    />

                    <span
                      className="
                        text-sm
                        text-text-secondary
                        font-mono
                        truncate
                      "
                    >
                      {shareableLink}
                    </span>
                  </div>

                  {/* COPY BUTTON */}
                  <button
                    onClick={handleCopyLink}
                    className="
                      flex
                      items-center
                      justify-center
                      rounded-xl
                      text-white
                      font-semibold
                      transition-all
                      cursor-pointer
                      hover:brightness-110
                    "
                    style={{
                      height: '52px',
                      minWidth: '112px',
                      padding: '0 20px',
                      gap: '8px',

                      /* Primary purple/blue */
                      background:
                        'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',

                      boxShadow:
                        '0 8px 22px rgba(139, 92, 246, 0.22)',
                    }}
                  >
                    {copied ? (
                      <>
                        <Check
                          style={{
                            width: '18px',
                            height: '18px',
                          }}
                        />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy
                          style={{
                            width: '18px',
                            height: '18px',
                          }}
                        />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Description */}
                <p
                  className="text-xs text-text-muted"
                  style={{
                    margin: '14px 0 0 0',
                    lineHeight: '1.7',
                    maxWidth: '680px',
                  }}
                >
                  Send this link to collaborators through WhatsApp,
                  Telegram, email, or any messaging app. They'll need
                  to sign in to access the document.
                </p>
              </div>

              {/* ================================================== */}
              {/* PEOPLE WITH ACCESS */}
              {/* ================================================== */}

              <div>

                {/* Section heading */}
                <div
                  className="flex items-center justify-between"
                  style={{
                    marginBottom: '14px',
                  }}
                >
                  <p
                    className="
                      text-sm
                      font-semibold
                      text-text-secondary
                    "
                    style={{
                      margin: 0,
                    }}
                  >
                    People with access
                  </p>

                  {doc.collaborators.length === 0 ? (
                    <span className="text-xs text-text-muted">
                      Only you
                    </span>
                  ) : (
                    <span className="text-xs text-text-muted">
                      {doc.collaborators.length}{' '}
                      {doc.collaborators.length === 1
                        ? 'collaborator'
                        : 'collaborators'}
                    </span>
                  )}
                </div>

                {/* ================================================= */}
                {/* OWNER */}
                {/* ================================================= */}

                <div
                  className="
                    flex
                    items-center
                    justify-between
                    bg-bg-card
                    border
                    border-border-subtle
                    rounded-xl
                  "
                  style={{
                    minHeight: '78px',
                    padding: '16px 18px',
                    marginBottom:
                      doc.collaborators.length === 0 ? '12px' : '12px',
                  }}
                >
                  {/* Owner information */}
                  <div
                    className="flex items-center min-w-0"
                    style={{
                      gap: '14px',
                    }}
                  >
                    <Avatar
                      src={doc.owner.avatar}
                      name={doc.owner.name}
                      size="sm"
                    />

                    <div
                      className="min-w-0"
                    >
                      <p
                        className="
                          text-sm
                          font-medium
                          text-text-primary
                          truncate
                        "
                        style={{
                          margin: 0,
                        }}
                      >
                        {doc.owner.name}
                      </p>

                      <p
                        className="
                          text-xs
                          text-text-muted
                          truncate
                        "
                        style={{
                          margin: '5px 0 0 0',
                        }}
                      >
                        {doc.owner.email}
                      </p>
                    </div>
                  </div>

                  {/* Owner badge */}
                  <Badge variant="purple">
                    <Shield
                      className="w-3 h-3"
                      style={{
                        marginRight: '5px',
                      }}
                    />
                    Owner
                  </Badge>
                </div>

                {/* ================================================= */}
                {/* COLLABORATORS */}
                {/* ================================================= */}

                {doc.collaborators.map((collab) => (
                  <div
                    key={collab.user._id}
                    className="
                      flex
                      items-center
                      justify-between
                      bg-bg-card
                      border
                      border-border-subtle
                      rounded-xl
                    "
                    style={{
                      minHeight: '78px',
                      padding: '16px 18px',
                      marginBottom: '12px',
                    }}
                  >
                    {/* User */}
                    <div
                      className="flex items-center min-w-0"
                      style={{
                        gap: '14px',
                      }}
                    >
                      <Avatar
                        src={collab.user.avatar}
                        name={collab.user.name}
                        size="sm"
                      />

                      <div className="min-w-0">
                        <p
                          className="
                            text-sm
                            font-medium
                            text-text-primary
                            truncate
                          "
                          style={{
                            margin: 0,
                          }}
                        >
                          {collab.user.name}
                        </p>

                        <p
                          className="
                            text-xs
                            text-text-muted
                            truncate
                          "
                          style={{
                            margin: '5px 0 0 0',
                          }}
                        >
                          {collab.user.email}
                        </p>
                      </div>
                    </div>

                    {/* Permission */}
                    <div
                      className="flex items-center"
                      style={{
                        gap: '12px',
                      }}
                    >
                      <Badge
                        variant={
                          collab.permission === 'editor'
                            ? 'blue'
                            : 'default'
                        }
                      >
                        {collab.permission === 'editor' ? (
                          <Edit3
                            className="w-3 h-3"
                            style={{
                              marginRight: '5px',
                            }}
                          />
                        ) : (
                          <Eye
                            className="w-3 h-3"
                            style={{
                              marginRight: '5px',
                            }}
                          />
                        )}

                        {collab.permission === 'editor'
                          ? 'Editor'
                          : 'Viewer'}
                      </Badge>

                      <button
                        onClick={() =>
                          handleRemove(collab.user._id)
                        }
                        className="
                          rounded-lg
                          text-text-muted
                          hover:text-error
                          hover:bg-bg-tertiary
                          transition-colors
                          cursor-pointer
                        "
                        style={{
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        aria-label={`Remove ${collab.user.name}`}
                      >
                        <Trash2
                          style={{
                            width: '16px',
                            height: '16px',
                          }}
                        />
                      </button>
                    </div>
                  </div>
                ))}

                {/* ================================================= */}
                {/* EMPTY STATE */}
                {/* ================================================= */}

                {doc.collaborators.length === 0 && (
                  <div
                    className="
                      flex
                      flex-col
                      items-center
                      justify-center
                      rounded-xl
                      border
                      border-dashed
                      border-border-default
                    "
                    style={{
                      minHeight: '86px',
                      padding: '16px 20px',
                      textAlign: 'center',
                    }}
                  >
                    <p
                      className="text-sm text-text-muted"
                      style={{
                        margin: 0,
                      }}
                    >
                      No collaborators yet
                    </p>

                    <p
                      className="text-xs text-text-muted"
                      style={{
                        margin: '6px 0 0 0',
                      }}
                    >
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