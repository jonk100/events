import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { X, MessageCircle, Send, Edit2, Archive, Check, X as XIcon, Eye, EyeOff } from 'lucide-react';
import type { Comment, EventOccurrence } from '../types';

interface CommentModalProps {
  eventOccurrence: EventOccurrence & { country: { name: string } };
  eventName: string;
  isOpen: boolean;
  onClose: () => void;
  onCommentAdded: () => void;
}

/**
 * Modal component for viewing and adding comments to event occurrences
 * @param {CommentModalProps} props - The props for the comment modal
 * @returns {JSX.Element | null} The rendered comment modal or null if not open
 */
export const CommentModal: React.FC<CommentModalProps> = ({
  eventOccurrence,
  eventName,
  isOpen,
  onClose,
  onCommentAdded
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [archiveConfirmId, setArchiveConfirmId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);


  /**
   * Fetches comments for the current event occurrence
   */
  const fetchComments = useCallback(async () => {
    if (!eventOccurrence?.id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('event_occurrence_id', eventOccurrence.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching comments:', error);
        return;
      }

      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [eventOccurrence?.id]);

  /**
   * Handles submitting a new comment
   */
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim() || !eventOccurrence?.id) {
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          event_occurrence_id: eventOccurrence.id,
          comment: newComment.trim()
        });

      if (error) {
        console.error('Error adding comment:', error);
        return;
      }

      // Reset form
      setNewComment('');
      
      // Refresh comments
      await fetchComments();
      
      // Notify parent component
      onCommentAdded();
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handles starting the edit mode for a comment
   * @param {Comment} comment - The comment to edit
   */
  const handleEditComment = (comment: Comment) => {
    console.log('Starting edit for comment:', comment.id);
    setEditingCommentId(comment.id);
    setEditingText(comment.comment);
  };

  /**
   * Handles saving the edited comment
   * @param {string} commentId - The ID of the comment to update
   */
  const handleSaveEdit = async (commentId: string) => {
    if (!editingText.trim()) {
      console.log('Edit text is empty, canceling edit');
      return;
    }

    console.log('Saving edit for comment:', commentId);
    try {
      const { error } = await supabase
        .from('comments')
        .update({ comment: editingText.trim() })
        .eq('id', commentId);

      if (error) {
        console.error('Error updating comment:', error);
        return;
      }

      // Reset editing state
      setEditingCommentId(null);
      setEditingText('');
      
      // Refresh comments
      await fetchComments();
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  /**
   * Handles canceling the edit mode
   */
  const handleCancelEdit = () => {
    console.log('Canceling edit');
    setEditingCommentId(null);
    setEditingText('');
  };

  /**
   * Handles showing archive confirmation
   * @param {string} commentId - The ID of the comment to archive
   */
  const handleArchiveComment = (commentId: string) => {
    console.log('Showing archive confirmation for comment:', commentId);
    setArchiveConfirmId(commentId);
  };

  /**
   * Handles confirming the archive of a comment and updates parent badge counts
   * @param {string} commentId - The ID of the comment to archive
   */
  const handleConfirmArchive = async (commentId: string) => {
    console.log('Confirming archive for comment:', commentId);
    try {
      const { error } = await supabase
        .from('comments')
        .update({ archived: true })
        .eq('id', commentId);

      if (error) {
        console.error('Error archiving comment:', error);
        return;
      }

      // Reset archive confirmation state
      setArchiveConfirmId(null);
      
      // Refresh comments and update parent badge counts
      await fetchComments();
      onCommentAdded(); // Trigger badge count refresh
    } catch (error) {
      console.error('Error archiving comment:', error);
    }
  };

  /**
   * Handles unarchiving a comment and updates parent badge counts
   * @param {string} commentId - The ID of the comment to unarchive
   */
  const handleUnarchiveComment = async (commentId: string) => {
    console.log('Unarchiving comment:', commentId);
    try {
      const { error } = await supabase
        .from('comments')
        .update({ archived: false })
        .eq('id', commentId);

      if (error) {
        console.error('Error unarchiving comment:', error);
        return;
      }
      
      // Refresh comments and update parent badge counts
      await fetchComments();
      onCommentAdded(); // Trigger badge count refresh
    } catch (error) {
      console.error('Error unarchiving comment:', error);
    }
  };

  /**
   * Handles canceling the archive confirmation
   */
  const handleCancelArchive = () => {
    console.log('Canceling archive confirmation');
    setArchiveConfirmId(null);
  };

  /**
   * Formats a date string for display
   * @param {string} dateString - The date string to format
   * @returns {string} The formatted date string
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter comments based on archived visibility and calculate counts
  const activeCommentsCount = comments.filter(c => !c.archived).length;
  const archivedCommentsCount = comments.filter(c => c.archived).length;
  
  const displayedComments = showArchived 
    ? comments // Show all comments when archived are visible
    : comments.filter(c => !c.archived); // Show only active comments when archived are hidden

  // Fetch comments when modal opens or event occurrence changes
  useEffect(() => {
    if (isOpen && eventOccurrence?.id) {
      fetchComments();
    }
  }, [isOpen, eventOccurrence?.id, fetchComments]);

  // Don't render if modal is not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <MessageCircle size={20} />
              Comments
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {eventName} - {eventOccurrence.country.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {/* Add Comment Form */}
        <div className="mb-6 border-b pb-4">
          <h3 className="text-lg font-medium mb-3">Add a Comment</h3>
          <form onSubmit={handleSubmitComment} className="space-y-4">
            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
                Comment
              </label>
              <textarea
                id="comment"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Share your thoughts about this event..."
                required
                disabled={isSubmitting}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !newComment.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Post Comment
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Comments List */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium">
              Comments ({showArchived ? comments.length : activeCommentsCount})
              {showArchived && archivedCommentsCount > 0 && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({activeCommentsCount} active, {archivedCommentsCount} archived)
                </span>
              )}
            </h3>
            
            {archivedCommentsCount > 0 && (
              <button
                onClick={() => setShowArchived(!showArchived)}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                {showArchived ? (
                  <>
                    <EyeOff size={14} />
                    Hide Archived
                  </>
                ) : (
                  <>
                    <Eye size={14} />
                    Show Archived ({archivedCommentsCount})
                  </>
                )}
              </button>
            )}
          </div>
          {isLoading ? (
            <div className="text-center py-4 text-gray-500">
              Loading comments...
            </div>
          ) : displayedComments.length > 0 ? (
            <div className="space-y-4 max-h-60 overflow-y-auto">
              {displayedComments.map((comment) => (
                <div key={comment.id} className={`rounded-lg p-4 ${comment.archived ? 'bg-gray-100 border-l-4 border-gray-400' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {formatDate(comment.created_at)}
                        {comment.updated_at !== comment.created_at && (
                          <span className="ml-1 text-gray-400">
                            (edited {formatDate(comment.updated_at)})
                          </span>
                        )}
                      </span>
                      {comment.archived && (
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                          Archived
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {comment.archived ? (
                        <button
                          onClick={() => handleUnarchiveComment(comment.id)}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                          title="Unarchive comment"
                        >
                          <Archive size={14} />
                        </button>
                      ) : (
                        <>
                          {archiveConfirmId === comment.id ? (
                            <>
                              <button
                                onClick={() => handleConfirmArchive(comment.id)}
                                className="p-1 text-orange-600 hover:bg-orange-100 rounded transition-colors"
                                title="Confirm archive"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                onClick={handleCancelArchive}
                                className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                title="Cancel archive"
                              >
                                <XIcon size={14} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditComment(comment)}
                                className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                title="Edit comment"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleArchiveComment(comment.id)}
                                className="p-1 text-orange-600 hover:bg-orange-100 rounded transition-colors"
                                title="Archive comment"
                              >
                                <Archive size={14} />
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  {editingCommentId === comment.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Edit your comment..."
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(comment.id)}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className={`${comment.archived ? 'text-gray-600' : 'text-gray-700'}`}>
                      {comment.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              {showArchived 
                ? (comments.length === 0 ? 'No comments yet. Be the first to comment!' : 'No archived comments.')
                : 'No comments yet. Be the first to comment!'
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
