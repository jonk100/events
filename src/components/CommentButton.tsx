import React from 'react';
import { MessageCircle } from 'lucide-react';

interface CommentButtonProps {
  commentCount: number;
  onClick: () => void;
  size?: number;
}

/**
 * Comment button component that displays a comment icon with optional badge
 * @param {CommentButtonProps} props - The props for the comment button
 * @returns {JSX.Element} The rendered comment button
 */
export const CommentButton: React.FC<CommentButtonProps> = ({
  commentCount,
  onClick,
  size = 14
}) => {
  const hasComments = commentCount > 0;

  return (
    <button
      onClick={onClick}
      className={`relative p-1 rounded transition-colors ${
        hasComments
          ? 'text-blue-600 hover:bg-blue-50 bg-blue-50/50'
          : 'text-green-600 hover:bg-green-50'
      }`}
      title={hasComments ? `View ${commentCount} comment${commentCount !== 1 ? 's' : ''}` : 'Add comment'}
    >
      <MessageCircle 
        size={size} 
        fill={hasComments ? 'currentColor' : 'none'}
        className={hasComments ? 'opacity-90' : ''}
      />
      {hasComments && (
        <span className="absolute -top-0.5 -right-0.5 bg-orange-500 text-white text-[10px] rounded-full min-w-[14px] h-3.5 flex items-center justify-center px-0.5 font-semibold leading-none">
          {commentCount > 99 ? '99+' : commentCount}
        </span>
      )}
    </button>
  );
};
