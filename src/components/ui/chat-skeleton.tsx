import React from 'react';
import { cn } from '@/lib/utils';

interface ChatSkeletonProps {
  className?: string;
}

export const ChatSkeleton: React.FC<ChatSkeletonProps> = ({ className }) => {
  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header skeleton */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full skeleton"></div>
          <div className="space-y-2">
            <div className="w-32 h-4 skeleton rounded"></div>
            <div className="w-24 h-3 skeleton rounded"></div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="w-8 h-8 skeleton rounded"></div>
          <div className="w-8 h-8 skeleton rounded"></div>
        </div>
      </div>

      {/* Messages skeleton */}
      <div className="flex-1 p-4 space-y-4 overflow-hidden">
        {/* User message skeleton */}
        <div className="flex justify-end">
          <div className="max-w-xs">
            <div className="w-48 h-12 skeleton rounded-2xl rounded-br-md"></div>
          </div>
        </div>

        {/* Assistant message skeleton */}
        <div className="flex justify-start">
          <div className="max-w-xs">
            <div className="w-64 h-16 skeleton rounded-2xl rounded-bl-md"></div>
          </div>
        </div>

        {/* User message skeleton */}
        <div className="flex justify-end">
          <div className="max-w-xs">
            <div className="w-32 h-10 skeleton rounded-2xl rounded-br-md"></div>
          </div>
        </div>

        {/* Assistant message skeleton */}
        <div className="flex justify-start">
          <div className="max-w-xs">
            <div className="w-80 h-20 skeleton rounded-2xl rounded-bl-md"></div>
          </div>
        </div>
      </div>

      {/* Input skeleton */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-12 skeleton rounded-full"></div>
          <div className="w-12 h-12 skeleton rounded-full"></div>
        </div>
      </div>
    </div>
  );
};
