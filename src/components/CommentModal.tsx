import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { X, MessageCircle, Send, Edit2, Trash2, Check, X as XIcon } from 'lucide-react';
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
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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
   * Handles showing delete confirmation
   * @param {string} commentId - The ID of the comment to delete
   */
  const handleDeleteComment = (commentId: string) => {
    console.log('Showing delete confirmation for comment:', commentId);
    setDeleteConfirmId(commentId);
  };

  /**
   * Handles confirming the deletion of a comment
   * @param {string} commentId - The ID of the comment to delete
   */
  const handleConfirmDelete = async (commentId: string) => {
    console.log('Confirming delete for comment:', commentId);
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) {
        console.error('Error deleting comment:', error);
        return;
      }

      // Reset delete confirmation state
      setDeleteConfirmId(null);
      
      // Refresh comments
      await fetchComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  /**
   * Handles canceling the delete confirmation
   */
  const handleCancelDelete = () => {
    console.log('Canceling delete confirmation');
    setDeleteConfirmId(null);
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

        {/* Comments List */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">
            Comments ({comments.length})
          </h3>
          
          {isLoading ? (
            <div className="text-center py-4 text-gray-500">
              Loading comments...
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-4 max-h-60 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">
                      {formatDate(comment.created_at)}
                    </span>
                    <div className="flex items-center gap-2">
                      {deleteConfirmId === comment.id ? (
                        <>
                          <button
                            onClick={() => handleConfirmDelete(comment.id)}
                            className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                            title="Confirm delete"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={handleCancelDelete}
                            className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                            title="Cancel delete"
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
                            onClick={() => handleDeleteComment(comment.id)}
                            className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                            title="Delete comment"
                          >
                            <Trash2 size={14} />
                          </button>
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
                    <p className="text-gray-700">{comment.comment}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No comments yet. Be the first to comment!
            </div>
          )}
        </div>

        {/* Add Comment Form */}
        <div className="border-t pt-4">
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
      </div>
    </div>
  );
};
