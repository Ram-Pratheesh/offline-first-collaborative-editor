
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  Clock3,
  FileText,
  FolderOpen,
  LogOut,
  Menu,
  MoreHorizontal,
  PanelLeftClose,
  Plus,
  Search,
  Share2,
  Sparkles,
  Star,
  Trash2,
  Users,
} from 'lucide-react';
import { Avatar, AvatarGroup } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { documentService } from '../services/documentService';
import type { Document } from '../types';

type TabType = 'recent' | 'mine' | 'shared' | 'starred' | 'all';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { addToast } = useNotificationStore();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [creating, setCreating] = useState(false);

  const sidebarWidth = sidebarOpen ? 270 : 0;

  const tabs: Array<{
    id: TabType;
    label: string;
    icon: React.ReactNode;
  }> = [
      { id: 'recent', label: 'Recent', icon: <Clock3 size={21} /> },
      { id: 'mine', label: 'My Documents', icon: <FileText size={21} /> },
      { id: 'shared', label: 'Shared', icon: <Users size={21} /> },
      { id: 'starred', label: 'Starred', icon: <Star size={21} /> },
      { id: 'all', label: 'All Documents', icon: <FolderOpen size={21} /> },
    ];

  const loadDocuments = async () => {
    setLoading(true);

    try {
      const filter =
        activeTab === 'shared' || activeTab === 'starred'
          ? activeTab
          : undefined;

      let docs = await documentService.getAll(
        filter,
        searchQuery || undefined
      );

      if (activeTab === 'mine') {
        docs = docs.filter((doc) => doc.owner._id === user?._id);
      }

      if (activeTab === 'shared') {
        docs = docs.filter((doc) => doc.owner._id !== user?._id);
      }

      setDocuments(docs);
    } catch {
      addToast({
        type: 'error',
        title: 'Failed to load documents',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [activeTab]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDocuments();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const createDocument = async () => {
    setCreating(true);

    try {
      const document = await documentService.create(newDocTitle || undefined);
      addToast({
        type: 'success',
        title: 'Document created',
      });
      navigate(`/document/${document._id}`);
    } catch {
      addToast({
        type: 'error',
        title: 'Failed to create document',
      });
    } finally {
      setCreating(false);
      setShowCreateModal(false);
      setNewDocTitle('');
    }
  };

  const deleteDocument = async (
    documentId: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();

    try {
      await documentService.delete(documentId);

      setDocuments((currentDocuments) =>
        currentDocuments.filter((document) => document._id !== documentId)
      );

      addToast({
        type: 'success',
        title: 'Document deleted',
      });
    } catch {
      addToast({
        type: 'error',
        title: 'Failed to delete document',
      });
    }
  };

  const toggleStar = async (
    documentId: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();

    try {
      const isStarred = await documentService.toggleStar(documentId);

      setDocuments((currentDocuments) =>
        currentDocuments.map((document) => {
          if (document._id !== documentId) return document;

          return {
            ...document,
            isStarredBy: isStarred
              ? [...document.isStarredBy, user?._id || '']
              : document.isStarredBy.filter((id) => id !== user?._id),
          };
        })
      );
    } catch {
      addToast({
        type: 'error',
        title: 'Failed to update star',
      });
    }
  };

  const formatDate = (date: string) => {
    const hours = Math.floor(
      (Date.now() - new Date(date).getTime()) / 3600000
    );

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;

    return `${Math.floor(hours / 24)}d ago`;
  };

  const userInitials =
    user?.name
      ?.substring(0, 2)
      .toUpperCase() || 'U';

  return (
    <div
      style={{
        height: '100vh',
        overflow: 'hidden',
        background: '#fcfaff',
        color: '#171432',
        fontFamily: 'Inter, Arial, sans-serif',
      }}
    >
      <style>
        {`
          @media (max-width: 768px) {
            .dashboard-main { margin-left: 0 !important; }
            .dashboard-header { padding: 0 16px !important; gap: 10px !important; }
            .welcome-section { padding: 30px 20px !important; }
            .hide-on-mobile { display: none !important; }
            .new-doc-btn { padding: 0 14px !important; }
            .sidebar-overlay { 
              position: fixed; 
              top: 0; left: 0; right: 0; bottom: 0; 
              background: rgba(0,0,0,0.5); 
              z-index: 20; 
            }
          }
        `}
      </style>

      {sidebarOpen && window.innerWidth <= 768 && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 30,
          width: sidebarWidth,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: sidebarOpen ? '32px 16px 22px' : 0,
          boxSizing: 'border-box',
          borderRight: sidebarOpen ? '1px solid #ece8f2' : 0,
          background: '#ffffff',
          transition: 'width .25s ease, padding .25s ease',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '0 8px',
            whiteSpace: 'nowrap',
          }}
        >
          <strong
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              paddingLeft: '4px',
            }}
          >
            <span className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#782cff] to-[#d42ffc]">CollabX</span>
          </strong>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            style={{
              border: 0,
              background: 'transparent',
              color: '#77728e',
              cursor: 'pointer',
            }}
          >
            <PanelLeftClose size={20} />
          </button>
        </div>

        <nav
          style={{
            display: 'grid',
            gap: '10px',
            marginTop: '60px',
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  height: '58px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '18px',
                  padding: '0 18px',
                  border: 0,
                  borderRadius: '18px',
                  background: isActive
                    ? 'linear-gradient(90deg, #fff0f7, #f4efff)'
                    : 'transparent',
                  color: isActive ? '#ef4599' : '#211d46',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div
          style={{
            position: 'relative',
            marginTop: 'auto',
          }}
        >
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              boxSizing: 'border-box',
              border: '1px solid #eae5f0',
              borderRadius: '18px',
              background: '#ffffff',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span
              style={{
                width: '43px',
                height: '43px',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                borderRadius: '50%',
                color: '#ffffff',
                background: 'linear-gradient(135deg, #ff508a, #7147ed)',
                fontWeight: 800,
              }}
            >
              {userInitials}
            </span>

            <span
              style={{
                minWidth: 0,
                flex: 1,
              }}
            >
              <b
                style={{
                  display: 'block',
                  overflow: 'hidden',
                  color: '#171432',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user?.name || 'User'}
              </b>

              <small
                style={{
                  display: 'block',
                  marginTop: '4px',
                  overflow: 'hidden',
                  color: '#7b7694',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user?.email}
              </small>
            </span>

            <ChevronDown size={18} color="#77728e" />
          </button>

          {profileOpen && (
            <button
              type="button"
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
              style={{
                position: 'absolute',
                bottom: '76px',
                left: 0,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '13px',
                border: 0,
                borderRadius: '14px',
                background: '#ffffff',
                boxShadow: '0 12px 34px rgba(55,35,80,.2)',
                color: '#d53a4e',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <LogOut size={18} />
              Sign out
            </button>
          )}
        </div>
      </aside>

      <div
        className="dashboard-main"
        style={{
          marginLeft: sidebarWidth,
          transition: 'margin-left .25s ease',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <header
          className="dashboard-header"
          style={{
            height: '84px',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            padding: '0 34px',
            boxSizing: 'border-box',
            borderBottom: '1px solid #ece8f2',
            background: '#ffffff',
          }}
        >
          {!sidebarOpen && (
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              style={{
                width: '42px',
                height: '42px',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                border: 0,
                borderRadius: '12px',
                color: '#7c44e9',
                background: '#f4efff',
                cursor: 'pointer',
              }}
            >
              <Menu size={21} />
            </button>
          )}

          <div
            style={{
              position: 'relative',
              flex: 1,
              maxWidth: '760px',
            }}
          >
            <Search
              size={23}
              style={{
                position: 'absolute',
                top: '50%',
                left: '20px',
                transform: 'translateY(-50%)',
                color: '#77728e',
              }}
            />

            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search your documents..."
              style={{
                width: '100%',
                height: '48px',
                padding: '0 20px 0 52px',
                boxSizing: 'border-box',
                border: '1px solid #e4dfea',
                borderRadius: '16px',
                outline: 0,
                color: '#24203f',
                fontSize: '15px',
              }}
            />
          </div>

          <button
            type="button"
            className="new-doc-btn"
            onClick={() => setShowCreateModal(true)}
            style={{
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '0 22px',
              border: 0,
              borderRadius: '15px',
              color: '#ffffff',
              background: 'linear-gradient(90deg, #ff4d82, #803df0)',
              boxShadow: '0 12px 22px rgba(207,59,199,.22)',
              fontSize: '15px',
              fontWeight: 800,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
            }}
          >
            <Plus size={20} />
            <span className="hide-on-mobile">New Document</span>
          </button>

          <span
            style={{
              width: '48px',
              height: '48px',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
              borderRadius: '50%',
              color: '#ffffff',
              background: 'linear-gradient(135deg, #ff508a, #7147ed)',
              fontWeight: 800,
            }}
          >
            {userInitials}
          </span>
        </header>

        <section
          className="welcome-section"
          style={{
            position: 'relative',
            minHeight: '140px',
            flexShrink: 0,
            overflow: 'hidden',
            padding: '40px 9%',
            boxSizing: 'border-box',
            background:
              'linear-gradient(100deg, #fff5f4, #ffefe7 58%, #f0d4fc)',
          }}
        >
          <span
            className="hide-on-mobile"
            style={{
              position: 'absolute',
              top: '-190px',
              right: '-68px',
              width: '470px',
              height: '470px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #d884ff, #723be5)',
            }}
          />

          <span
            className="hide-on-mobile"
            style={{
              position: 'absolute',
              top: '32px',
              left: '45px',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 9px)',
              gap: '11px',
              opacity: 0.45,
            }}
          >
            {Array.from({ length: 24 }).map((_, index) => (
              <i
                key={index}
                style={{
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  background: '#ff6d93',
                }}
              />
            ))}
          </span>

          <span
            className="hide-on-mobile"
            style={{
              position: 'absolute',
              top: '63px',
              right: '36%',
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #ff9aa8, #ff7191)',
              transform: 'rotate(-14deg)',
              boxShadow: '0 12px 22px rgba(243,103,137,.25)',
            }}
          />

          <div style={{ position: 'relative' }}>
            <h1
              style={{
                margin: 0,
                color: '#171432',
                fontSize: 'clamp(32px, 3vw, 46px)',
                letterSpacing: '-2px',
              }}
            >
              Welcome back,{' '}
              <span
                style={{
                  background: 'linear-gradient(90deg, #f14b9c, #7248ed)',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                {user?.name?.split(' ')[0] || 'there'}
              </span>{' '}
              👋
            </h1>

            <p
              style={{
                margin: '16px 0 0',
                color: '#77728e',
                fontSize: '19px',
              }}
            >
              Pick up where you left off, or start something new.
            </p>
          </div>
        </section>

        <main
          style={{
            position: 'relative',
            flex: 1,
            overflowY: activeTab === 'all' ? 'auto' : 'hidden',
            overflowX: 'hidden',
            padding: '32px 36px',
            boxSizing: 'border-box',
            background:
              'radial-gradient(circle at 8% 92%, #f3e9ff 0, transparent 16%), radial-gradient(circle at 95% 100%, #ffd9e9 0, transparent 16%), #fcfaff',
          }}
        >
          <span
            style={{
              position: 'absolute',
              right: '32px',
              bottom: '24px',
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              opacity: 0.65,
              background: 'linear-gradient(135deg, #c9b3ff, #8b63f4)',
            }}
          />

          <span
            style={{
              position: 'absolute',
              right: '-56px',
              bottom: '-66px',
              width: '190px',
              height: '190px',
              borderRadius: '50%',
              opacity: 0.7,
              background: '#ffb6d2',
            }}
          />

          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '28px',
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: '28px',
                letterSpacing: '-1.2px',
              }}
            >
              {activeTab === 'recent'
                ? 'Recent documents'
                : tabs.find((tab) => tab.id === activeTab)?.label}
            </h2>

            <button
              type="button"
              onClick={() => setActiveTab('all')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                border: 0,
                color: '#8240f0',
                background: 'transparent',
                fontSize: '17px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              View all
              <ChevronDown
                size={20}
                style={{ transform: 'rotate(-90deg)' }}
              />
            </button>
          </div>

          {loading ? (
            <p style={{ position: 'relative', color: '#7d7895', padding: '30px' }}>
              Loading documents...
            </p>
          ) : documents.length === 0 ? (
            <div
              style={{
                position: 'relative',
                minHeight: '280px',
                display: 'grid',
                placeItems: 'center',
                border: '1px dashed #ded7eb',
                borderRadius: '24px',
                background: '#ffffff',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <FolderOpen size={48} color="#9d97ae" />
                <h3 style={{ margin: 0, color: '#161331', fontSize: '20px' }}>No documents yet</h3>

                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  style={{
                    marginTop: '8px',
                    border: 0,
                    borderRadius: '12px',
                    padding: '12px 20px',
                    color: '#ffffff',
                    background: 'linear-gradient(90deg, #ff4d82, #803df0)',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Create document
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                position: 'relative',
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fill, minmax(220px, 280px))',
                justifyContent: 'start',
                gap: '24px',
              }}
            >
              {documents.map((document) => (
                <DocumentCard
                  key={document._id}
                  document={document}
                  userId={user?._id || ''}
                  onOpen={() => navigate(`/document/${document._id}`)}
                  onStar={(event) => toggleStar(document._id, event)}
                  onDelete={(event) => deleteDocument(document._id, event)}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Document"
        size="md"
      >
        <div
          style={{
            display: 'grid',
            gap: '22px',
            paddingTop: '12px',
          }}
        >
          <Input
            label="Document title"
            placeholder="Untitled Document"
            value={newDocTitle}
            onChange={(event) => setNewDocTitle(event.target.value)}
            autoFocus
          />

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
            }}
          >
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>

            <Button onClick={createDocument} loading={creating}>
              Create document
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

type DocumentCardProps = {
  document: Document;
  userId: string;
  onOpen: () => void;
  onStar: (event: React.MouseEvent) => void;
  onDelete: (event: React.MouseEvent) => void;
  formatDate: (value: string) => string;
};

const cardColors = [
  { icon: '#8f43ea', bg: 'linear-gradient(135deg, #fff0f7, #f2ecff)' },
  { icon: '#ea438f', bg: 'linear-gradient(135deg, #fff0f7, #ffecef)' },
  { icon: '#438fea', bg: 'linear-gradient(135deg, #f0f7ff, #eaf2ff)' },
  { icon: '#ea8f43', bg: 'linear-gradient(135deg, #fff7f0, #ffecdf)' },
  { icon: '#43ea8f', bg: 'linear-gradient(135deg, #f0fff7, #eafff2)' },
];

const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  userId,
  onOpen,
  onStar,
  onDelete,
  formatDate,
}) => {
  const people = Array.from(
    new Map(
      [document.owner, ...document.collaborators.map((item) => item.user)].map(
        (item) => [item._id, item]
      )
    ).values()
  );

  const charSum = document._id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const colorTheme = cardColors[charSum % cardColors.length];

  return (
    <article
      onClick={onOpen}
      style={{
        height: '210px',
        padding: '20px',
        boxSizing: 'border-box',
        border: '1px solid #ece7f1',
        borderRadius: '26px',
        background: '#ffffff',
        boxShadow: '0 9px 24px rgba(70,42,105,.06)',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            width: '54px',
            height: '54px',
            display: 'grid',
            placeItems: 'center',
            borderRadius: '16px',
            color: colorTheme.icon,
            background: colorTheme.bg,
          }}
        >
          <FileText size={28} />
        </span>

        <div
          style={{
            display: 'flex',
            height: '34px',
          }}
        >
          <button
            type="button"
            onClick={onStar}
            style={{
              border: 0,
              background: 'transparent',
              color: '#817c98',
              cursor: 'pointer',
            }}
          >
            <Star
              size={18}
              fill={
                document.isStarredBy.includes(userId) ? '#f5bc38' : 'none'
              }
            />
          </button>

          {document.owner._id === userId && (
            <button
              type="button"
              onClick={onDelete}
              style={{
                border: 0,
                background: 'transparent',
                color: '#ef4444',
                cursor: 'pointer',
              }}
            >
              <Trash2 size={18} />
            </button>
          )}

          <MoreHorizontal
            size={19}
            style={{
              margin: '8px',
              color: '#817c98',
            }}
          />
        </div>
      </div>

      <h3
        style={{
          margin: '16px 0 6px',
          overflow: 'hidden',
          color: '#161331',
          fontSize: '18px',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {document.title}
      </h3>

      <p
        style={{
          margin: 0,
          color: '#7c7794',
          fontSize: '14px',
        }}
      >
        Edited by {document.lastEditedBy?.name || document.owner.name} ·{' '}
        {formatDate(document.updatedAt)}
      </p>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '16px',
        }}
      >
        {document.collaborators.length > 0 ? (
          <AvatarGroup users={people} max={3} />
        ) : (
          <Avatar
            src={document.owner.avatar}
            name={document.owner.name}
            size="sm"
          />
        )}

        {document.collaborators.length > 0 && (
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 10px',
              borderRadius: '20px',
              color: '#8b42ed',
              background: '#f5efff',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            <Share2 size={14} />
            Shared
          </span>
        )}
      </div>
    </article>
  );
};

export default DashboardPage;