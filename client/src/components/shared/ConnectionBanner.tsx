import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, Loader2, CheckCircle } from 'lucide-react';
import { useEditorStore, type SyncStatus } from '../../store/editorStore';

export const ConnectionBanner: React.FC = () => {
  const { syncStatus, isOnline, isWebSocketConnected } = useEditorStore();
  const [showSyncedMessage, setShowSyncedMessage] = useState(false);
  const [prevStatus, setPrevStatus] = useState<SyncStatus>(syncStatus);

  // Show "All changes synchronized" briefly when transitioning from offline/syncing to synced
  useEffect(() => {
    if (
      syncStatus === 'synced' &&
      (prevStatus === 'offline' || prevStatus === 'syncing')
    ) {
      setShowSyncedMessage(true);
      const timer = setTimeout(() => setShowSyncedMessage(false), 3000);
      return () => clearTimeout(timer);
    }
    setPrevStatus(syncStatus);
  }, [syncStatus]);

  // Determine what to show
  const showBanner =
    !isOnline ||
    (isOnline && !isWebSocketConnected) ||
    syncStatus === 'syncing' ||
    showSyncedMessage;

  if (!showBanner) return null;

  let bgClass = '';
  let icon: React.ReactNode = null;
  let text = '';

  if (!isOnline) {
    bgClass = 'bg-warning/10 border-b border-warning/20';
    icon = <WifiOff className="w-3.5 h-3.5 text-warning" />;
    text = 'You are offline — changes are saved locally';
  } else if (syncStatus === 'syncing') {
    bgClass = 'bg-info/10 border-b border-info/20';
    icon = <Loader2 className="w-3.5 h-3.5 text-info animate-spin" />;
    text = 'Synchronizing changes...';
  } else if (!isWebSocketConnected) {
    bgClass = 'bg-warning/10 border-b border-warning/20';
    icon = <Loader2 className="w-3.5 h-3.5 text-warning animate-spin" />;
    text = 'Reconnecting to server...';
  } else if (showSyncedMessage) {
    bgClass = 'bg-success/10 border-b border-success/20';
    icon = <CheckCircle className="w-3.5 h-3.5 text-success" />;
    text = 'All changes synchronized';
  }

  return (
    <div
      className={`flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-medium ${bgClass} transition-all duration-300`}
    >
      {icon}
      <span className="text-text-secondary">{text}</span>
    </div>
  );
};
