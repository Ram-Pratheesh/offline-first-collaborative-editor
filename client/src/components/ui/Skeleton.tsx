import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`
        bg-gradient-to-r from-bg-card via-bg-elevated to-bg-card
        bg-[length:200%_100%] animate-shimmer rounded-xl
        ${className}
      `}
    />
  );
};

export const DocumentCardSkeleton: React.FC = () => (
  <div className="bg-bg-card rounded-2xl p-5 border border-border-subtle">
    <div className="flex items-start justify-between mb-3">
      <Skeleton className="w-10 h-10 rounded-xl" />
      <Skeleton className="w-5 h-5 rounded" />
    </div>
    <Skeleton className="h-5 w-3/4 mb-2" />
    <Skeleton className="h-4 w-1/2 mb-4" />
    <div className="flex items-center justify-between">
      <div className="flex -space-x-2">
        <Skeleton className="w-7 h-7 rounded-full" />
        <Skeleton className="w-7 h-7 rounded-full" />
      </div>
      <Skeleton className="h-3 w-20" />
    </div>
  </div>
);

export const EditorSkeleton: React.FC = () => (
  <div className="max-w-4xl mx-auto p-8 space-y-4">
    <Skeleton className="h-10 w-2/3 mb-8" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-5/6" />
    <Skeleton className="h-4 w-4/5" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-3/4" />
    <div className="pt-4" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-5/6" />
    <Skeleton className="h-4 w-2/3" />
  </div>
);
