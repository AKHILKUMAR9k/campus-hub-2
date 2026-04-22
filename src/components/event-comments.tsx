'use client';

import { useMemo, useState } from 'react';
import { useCollection, useDoc } from '@/supabase';
import { useAuth } from '@/supabase';
import { supabase } from '@/supabase/client';
import type { User } from '@/lib/types';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/supabase/non-blocking-updates';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Loader2, ThumbsUp, Reply as ReplyIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent } from './ui/card';

interface EventCommentsProps {
  eventId: string;
  eventTitle: string;
}

function ReplyItem({ reply }: { reply: any }) {
  return (
    <div className="flex items-start gap-4 ml-12 border-l-2 border-muted pl-4">
      <Avatar className="h-8 w-8">
        <AvatarFallback>{(reply.user_display_name || 'U')?.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm">{reply.user_display_name || 'User'}</p>
          <p className="text-xs text-muted-foreground">
            {reply.created_at ? formatDistanceToNow(new Date(reply.created_at), { addSuffix: true }) : 'just now'}
          </p>
        </div>
        <p className="text-sm text-foreground mt-1">{reply.content}</p>
        <div className="flex items-center gap-4 mt-2">
          <Button variant="ghost" size="sm" className="flex items-center gap-1 text-muted-foreground" disabled>
            <ThumbsUp className="h-3 w-3" />
            <span className="text-xs">{reply.likes || 0}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

function CommentItem({ comment, onReply, onLike }: { comment: any; onReply: (parentId: string, text: string) => Promise<void>; onLike: (commentId: string, currentLikes: number) => Promise<void> }): JSX.Element {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const handleSubmitReply = async () => {
    if (!replyText.trim()) return;
    setIsSubmittingReply(true);
    try {
      await onReply(comment.id, replyText);
      setReplyText('');
      setShowReplyForm(false);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        <Avatar className="h-10 w-10">
          <AvatarFallback>{(comment.user_display_name || 'U')?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold">{comment.user_display_name || 'User'}</p>
            <p className="text-xs text-muted-foreground">
              {comment.created_at ? formatDistanceToNow(new Date(comment.created_at), { addSuffix: true }) : 'just now'}
            </p>
          </div>
          <p className="text-sm text-foreground mt-1">{comment.content}</p>
          <div className="flex items-center gap-4 mt-2">
            <Button variant="ghost" size="sm" className="flex items-center gap-1 text-muted-foreground" onClick={() => onLike(comment.id, comment.likes || 0)}>
              <ThumbsUp className="h-4 w-4" />
              <span>{(comment.liked_by || []).length}</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center gap-1 text-muted-foreground" onClick={() => setShowReplyForm(!showReplyForm)}>
              <ReplyIcon className="h-4 w-4" />
              Reply
            </Button>
          </div>
          {showReplyForm && (
            <div className="mt-4 space-y-2">
              <Textarea
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                disabled={isSubmittingReply}
                className="min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSubmitReply} disabled={isSubmittingReply || !replyText.trim()}>
                  {isSubmittingReply && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                  Reply
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowReplyForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-3">
          {comment.replies.map((reply: any) => (
            <ReplyItem key={reply.id} reply={reply} />
          ))}
        </div>
      )}
    </div>
  );
}


export default function EventComments({ eventId, eventTitle }: EventCommentsProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { data: userProfile } = useDoc<User>('users', user?.id);

  const { data: allComments, isLoading, error } = useCollection<any>('comments', {
    filters: { event_id: eventId },
    orderBy: { column: 'created_at', ascending: false }
  });

  const topLevel = useMemo(() => (allComments || []).filter(c => !c.parent_comment), [allComments]);
  const repliesByParent = useMemo(() => {
    const map = new Map<string, any[]>();
    (allComments || []).forEach(c => {
      if (c.parent_comment) {
        const list = map.get(c.parent_comment) || [];
        list.push(c);
        map.set(c.parent_comment, list);
      }
    });
    return map;
  }, [allComments]);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user) return;
    setIsSubmitting(true);
    const displayName = userProfile ? `${userProfile.first_name} ${userProfile.last_name}` : 'User';
    try {
      await addDocumentNonBlocking('comments', {
        event_id: eventId,
        user_id: user.id,
        content: newComment,
        parent_comment: null,
        liked_by: [],
        disliked_by: [],
        user_display_name: displayName,
      });

      // Create notification for event organizer
      const { notifyEventComment } = await import('@/lib/notification-service');
      await notifyEventComment(supabase, eventId, eventTitle, displayName, newComment);

      // Send email notification if enabled (Currently handled server-side or requires specific implementation)

      setNewComment('');
    } catch (e) {
      console.error('Failed to post comment', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (parentId: string, text: string) => {
    if (!user) return;
    const displayName = userProfile ? `${userProfile.first_name} ${userProfile.last_name}` : 'User';
    await addDocumentNonBlocking('comments', {
      event_id: eventId,
      user_id: user.id,
      content: text,
      parent_comment: parentId,
      liked_by: [],
      disliked_by: [],
      user_display_name: displayName,
    });
  };

  const handleLike = async (commentId: string, currentLikes: number) => {
    if (!user) return;

    // Get current comment data to check if user already liked it
    const { data: comment } = await supabase
      .from('comments')
      .select('liked_by, disliked_by')
      .eq('id', commentId)
      .single();

    if (!comment) return;

    const userId = user.id;
    const hasLiked = comment.liked_by?.includes(userId);
    const hasDisliked = comment.disliked_by?.includes(userId);

    let updateData: any = {};

    if (hasLiked) {
      // Remove like
      updateData.liked_by = comment.liked_by.filter((id: string) => id !== userId);
    } else {
      // Add like and remove dislike if exists
      updateData.liked_by = [...(comment.liked_by || []), userId];
      if (hasDisliked) {
        updateData.disliked_by = comment.disliked_by.filter((id: string) => id !== userId);
      }
    }

    await updateDocumentNonBlocking('comments', updateData, commentId);
  };

  return (
    <div className="space-y-6">
      {user && (
        <div className="space-y-2">
          <Textarea
            placeholder="Share your thoughts on the event..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={isSubmitting}
          />
          <Button onClick={handleSubmitComment} disabled={isSubmitting || !newComment.trim()}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Post Comment
          </Button>
        </div>
      )}

      {isLoading && <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>}
      {error && <p className="text-destructive">Error loading comments: {error.message}</p>}
      
      {!isLoading && !error && (
        topLevel && topLevel.length > 0 ? (
          <div className="space-y-6">
            {topLevel.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={{ ...comment, replies: repliesByParent.get(comment.id) || [] }}
                onReply={handleReply}
                onLike={handleLike}
              />
            ))}
          </div>
        ) : (
          <Card className="text-center">
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Be the first to comment on this event!</p>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}
