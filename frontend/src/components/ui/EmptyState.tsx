import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  message,
  actionText,
  onAction
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-md max-w-md mx-auto my-8 space-y-4 shadow-glass"
    >
      <div className="p-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl shadow-neon-glow">
        <Icon className="w-8 h-8" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-sm font-bold text-white tracking-wide">{title}</h3>
        <p className="text-xs text-gray-400 max-w-xs leading-relaxed">{message}</p>
      </div>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-indigo-gradient hover:opacity-90 active:scale-95 text-white text-xs font-semibold rounded-xl transition-all shadow-neon-glow"
        >
          {actionText}
        </button>
      )}
    </motion.div>
  );
};
