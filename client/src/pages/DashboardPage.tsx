import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Star, StarOff, Clock, Users, FileText,
  MoreHorizontal, Trash2, Share2, Sparkles, LogOut,
  ChevronDown, FolderOpen
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Avatar, AvatarGroup } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { DocumentCardSkeleton } from '../components/ui/Skeleton';
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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [activeTab]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      let filterParam = activeTab === 'recent' || activeTab === 'mine' || activeTab === 'all' ? undefined : activeTab;
      let docs = await documentService.getAll(filterParam, searchQuery || undefined);

      // Enforce strict frontend filtering for 'mine' and 'shared'
      if (activeTab === 'mine') {
        docs = docs.filter(d => d.owner._id === user?._id);
      } else if (activeTab === 'shared') {
        docs = docs.filter(d => d.owner._id !== user?._id);
      }

      setDocuments(docs);
    } catch (error) {
      addToast({ type: 'error', title: 'Failed to load documents' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDocuments();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const doc = await documentService.create(newDocTitle || undefined);
      addToast({ type: 'success', title: 'Document Created' });
      setShowCreateModal(false);
      setNewDocTitle('');
      navigate(`/document/${doc._id}`);
    } catch (error) {
      addToast({ type: 'error', title: 'Failed to create document' });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await documentService.delete(id);
      setDocuments(documents.filter((d) => d._id !== id));
      addToast({ type: 'success', title: 'Document deleted' });
    } catch (error) {
      addToast({ type: 'error', title: 'Failed to delete document' });
    }
  };

  const handleStar = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const isStarred = await documentService.toggleStar(id);
      setDocuments(
        documents.map((d) => {
          if (d._id === id) {
            return {
              ...d,
              isStarredBy: isStarred
                ? [...d.isStarredBy, user?._id || '']
                : d.isStarredBy.filter((uid) => uid !== user?._id),
            };
          }
          return d;
        })
      );
    } catch (error) {
      addToast({ type: 'error', title: 'Failed to update star' });
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'recent', label: 'Recent', icon: <Clock className="w-4 h-4" /> },
    { id: 'mine', label: 'My Documents', icon: <FileText className="w-4 h-4" /> },
    { id: 'shared', label: 'Shared', icon: <Users className="w-4 h-4" /> },
    { id: 'starred', label: 'Starred', icon: <Star className="w-4 h-4" /> },
    { id: 'all', label: 'All', icon: <FolderOpen className="w-4 h-4" /> },
  ];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border-subtle">
        <div className="w-full px-4 sm:px-8">
          <div className="flex items-center h-16 w-full">
            {/* Logo (Left 25%) */}
            <div className="flex items-center gap-3 w-1/4">
              <div className="w-9 h-9 gradient-purple-blue rounded-xl flex items-center justify-center shadow-md shadow-purple-primary/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold gradient-text hidden sm:block">CollabEdit</h1>
            </div>

            {/* Search (Center 50%) */}
            <div className="hidden md:flex w-1/2 justify-center px-4">
              <div className="relative w-full max-w-2xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search your documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-bg-tertiary border border-border-default rounded-xl text-base text-text-primary placeholder-text-muted focus:outline-none focus:border-indigo-primary transition-colors"
                  style={{ paddingLeft: '3rem', paddingRight: '1.25rem', paddingTop: '0.625rem', paddingBottom: '0.625rem' }}
                />
              </div>
            </div>

            {/* Actions (Right 25%) */}
            <div className="flex items-center justify-end w-1/4">
              {/* Mobile New Document Button */}
              <div className="md:hidden mr-4">
                <Button onClick={() => setShowCreateModal(true)} style={{ padding: '0.5rem 1rem' }}>
                  <Plus className="w-5 h-5" />
                </Button>
              </div>

              {/* Desktop New Document Button (Centered in the right section) */}
              <div className="hidden md:flex flex-1 justify-center">
                <Button onClick={() => setShowCreateModal(true)} style={{ padding: '0.5rem 1rem', flexShrink: 0 }}>
                  <Plus className="w-5 h-5" />
                  <span className="font-semibold">New Document</span>
                </Button>
              </div>

              {/* Profile (Far Right) */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-bg-card transition-colors cursor-pointer"
                >
                  <Avatar src={user?.avatar} name={user?.name || 'U'} size="md" />
                  <ChevronDown className="w-4 h-4 text-text-muted hidden sm:block" />
                </button>

                <AnimatePresence>
                  {showProfileMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-56 glass-strong rounded-xl shadow-2xl z-50 py-2"
                      >
                        <div className="px-4 py-3 border-b border-border-subtle">
                          <p className="text-sm font-medium text-text-primary">{user?.name}</p>
                          <p className="text-xs text-text-muted">{user?.email}</p>
                        </div>
                        <button onClick={() => { setShowProfileMenu(false); navigate('/profile'); }} className="w-full px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-card text-left transition-colors cursor-pointer">
                          Profile
                        </button>
                        <button onClick={() => { setShowProfileMenu(false); navigate('/settings'); }} className="w-full px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-card text-left transition-colors cursor-pointer">
                          Settings
                        </button>
                        <div className="border-t border-border-subtle my-1" />
                        <button onClick={handleLogout} className="w-full px-4 py-2.5 text-sm text-error hover:bg-error/10 text-left transition-colors flex items-center gap-2 cursor-pointer">
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Full-width Welcome Banner */}
      <div className="w-full bg-purple-primary/10 border-b border-purple-primary/20" style={{ marginBottom: '1rem' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-3xl font-bold text-purple-light mb-1.5">
              Welcome back, {user?.name?.split(' ')[0] || 'there'} 👋
            </h2>
            <p className="text-purple-light/80 text-base">
              Pick up where you left off, or start something new.
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ paddingBottom: '3rem' }}>
        {/* Mobile Search */}
        <div className="md:hidden" style={{ marginBottom: '1rem' }}>
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              placeholder="Search your documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bg-tertiary border border-border-default rounded-xl text-base text-text-primary placeholder-text-muted focus:outline-none focus:border-indigo-primary transition-colors"
              style={{ paddingLeft: '3rem', paddingRight: '1.25rem', paddingTop: '0.625rem', paddingBottom: '0.625rem' }}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide" style={{ paddingBottom: '0.5rem', marginBottom: '1.25rem' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 rounded-xl text-sm font-medium whitespace-nowrap
                transition-all duration-200 cursor-pointer
                ${activeTab === tab.id
                  ? 'bg-indigo-primary/15 text-indigo-light border border-indigo-primary/30'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-card'
                }
              `}
              style={{ padding: '0.5rem 1rem' }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Documents Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <DocumentCardSkeleton key={i} />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full min-h-[520px] flex items-center justify-center translate-x-[95px]"
          >
            <div className="flex w-full max-w-md flex-col items-center text-center">

              {/* Icon */}
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-bg-card mb-12">
                <FolderOpen className="h-10 w-10 text-text-muted" />
              </div>

              {/* Title */}
              <h3 className="mb-3 text-xl font-semibold leading-tight text-text-primary">
                {searchQuery ? 'No documents found' : 'No documents yet'}
              </h3>

              {/* Description */}
              <p className="mb-7 text-base text-text-secondary">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Create your first document to get started'}
              </p>

              {/* Create Document Button */}
              {!searchQuery && (
                <Button
                  onClick={() => setShowCreateModal(true)}
                  icon={<Plus className="h-5 w-5" />}
                  className="w-52 translate-y-3 justify-center rounded-xl py-3 shadow-xl shadow-purple-500/20"
                >
                  Create Document
                </Button>
              )}

            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {documents.map((doc, index) => (
                <motion.div
                  key={doc._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  onClick={() => navigate(`/document/${doc._id}`)}
                  className="group bg-bg-card hover:bg-bg-card-hover border border-border-subtle hover:border-border-accent rounded-3xl cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-primary/10 flex flex-col justify-between"
                  style={{ padding: '1.5rem', minHeight: '13rem' }}
                >
                  <div>
                    <div className="flex items-start justify-between mb-5">
                      <div className="w-14 h-14 bg-bg-elevated rounded-2xl flex items-center justify-center text-4xl shadow-sm">
                        {doc.icon}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleStar(doc._id, e)}
                          className="p-2.5 rounded-xl hover:bg-bg-elevated transition-colors cursor-pointer"
                        >
                          {doc.isStarredBy.includes(user?._id || '') ? (
                            <Star className="w-5 h-5 text-warning fill-warning" />
                          ) : (
                            <StarOff className="w-5 h-5 text-text-muted hover:text-text-primary" />
                          )}
                        </button>
                        {doc.owner._id === user?._id && (
                          <button
                            onClick={(e) => handleDelete(doc._id, e)}
                            className="p-2.5 rounded-xl hover:bg-error/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-5 h-5 text-text-muted hover:text-error" />
                          </button>
                        )}
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-text-primary mb-2 line-clamp-1 group-hover:text-white transition-colors">
                      {doc.title}
                    </h3>
                    <p className="text-sm text-text-muted mb-6">
                      {doc.lastEditedBy?.name && `Edited by ${doc.lastEditedBy.name} · `}
                      {formatDate(doc.updatedAt)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border-subtle/50 mt-auto">
                    <div className="flex items-center gap-2">
                      {doc.collaborators.length > 0 ? (
                        <AvatarGroup
                          users={Array.from(
                            new Map(
                              [doc.owner, ...doc.collaborators.map((c) => c.user)].map((u) => [u._id, u])
                            ).values()
                          )}
                          max={3}
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <Avatar src={doc.owner.avatar} name={doc.owner.name} size="sm" />
                          <span className="text-sm text-text-muted font-medium">Just you</span>
                        </div>
                      )}
                    </div>
                    {doc.collaborators.length > 0 && (
                      <Badge variant="purple">
                        <Share2 className="w-4 h-4" />
                        Shared
                      </Badge>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Create Document Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Document"
        size="md"
      >
        <div className="w-full pt-4 pb-4">

          {/* Input Section */}
          <div className="w-full">
            <Input
              label="Document Title"
              placeholder="Untitled Document"
              value={newDocTitle}
              onChange={(e) => setNewDocTitle(e.target.value)}
              autoFocus
              className="w-full text-base"
            />
          </div>

          {/* Actions Section */}
          <div
            className="flex w-full items-center justify-end gap-4"
            style={{ marginTop: '28px' }}
          >
            <Button
              variant="ghost"
              onClick={() => setShowCreateModal(false)}
              className="px-6 py-2.5 font-medium"
            >
              Cancel
            </Button>

            <Button
              onClick={handleCreate}
              loading={creating}
              className="min-w-[120px] px-8 py-2.5 font-semibold shadow-lg shadow-purple-500/20"
            >
              Create
            </Button>
          </div>

        </div>
      </Modal>

      {/* FAB for mobile */}
      <div className="fixed bottom-6 right-6 sm:hidden">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreateModal(true)}
          className="w-14 h-14 gradient-purple-blue rounded-full flex items-center justify-center shadow-xl shadow-purple-primary/30 cursor-pointer"
        >
          <Plus className="w-6 h-6 text-white" />
        </motion.button>
      </div>
    </div>
  );
};

export default DashboardPage;
