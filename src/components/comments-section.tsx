'use client';

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Send, Heart, Reply } from "lucide-react";
import { postComment, toggleCommentLike } from "@/app/dashboard/events/actions";
import { useToast } from "@/hooks/use-toast";
import type { Comment } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CommentsSectionProps {
    eventId: string;
    userId: string;
    comments: Comment[];
    onCommentPosted: () => void;
}

export function CommentsSection({ eventId, userId, comments, onCommentPosted }: CommentsSectionProps) {
    const [newComment, setNewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    // Organize comments into threads
    const rootComments = comments.filter(c => !c.parent_id);
    const getReplies = (parentId: string) => comments.filter(c => c.parent_id === parentId);

    const handleSubmit = async (content: string, parentId?: string) => {
        if (!content.trim()) return;

        setIsSubmitting(true);
        const result = await postComment(eventId, userId, content, parentId);
        setIsSubmitting(false);

        if (result.error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: result.error,
            });
        } else {
            setNewComment("");
            onCommentPosted();
            toast({
                title: "Comment posted!",
            });
        }
    };

    return (
        <div className="space-y-6 mt-8">
            <h3 className="text-xl font-bold flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Comments ({comments.length})
            </h3>

            <div className="space-y-6">
                {rootComments.map((comment) => (
                    <CommentItem 
                        key={comment.id} 
                        comment={comment} 
                        replies={getReplies(comment.id)}
                        userId={userId}
                        onReply={(content) => handleSubmit(content, comment.id)}
                        onLike={() => toggleCommentLike(comment.id, userId)}
                    />
                ))}

                {comments.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                        No comments yet. Be the first to share your thoughts!
                    </p>
                )}
            </div>

            <div className="flex gap-4">
                <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[100px]"
                />
            </div>
            <div className="flex justify-end">
                <Button onClick={() => handleSubmit(newComment)} disabled={isSubmitting || !newComment.trim()}>
                    {isSubmitting ? (
                        "Posting..."
                    ) : (
                        <>
                            <Send className="w-4 h-4 mr-2" />
                            Post Comment
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}

function CommentItem({ 
    comment, 
    replies, 
    userId,
    onReply,
    onLike 
}: { 
    comment: Comment; 
    replies: Comment[];
    userId: string;
    onReply: (content: string) => void;
    onLike: () => void;
}) {
    const [isReplying, setIsReplying] = useState(false);
    const [replyContent, setReplyContent] = useState("");

    return (
        <div className="space-y-4">
            <div className="flex gap-4 p-4 border rounded-lg bg-card text-card-foreground">
                <Avatar>
                    <AvatarFallback>
                        {comment.user?.first_name?.[0] || "U"}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium leading-none">
                            {comment.user?.first_name} {comment.user?.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </p>
                    </div>
                    <p className="text-sm text-muted-foreground">{comment.content}</p>
                    
                    <div className="flex items-center gap-4 pt-2">
                        <Button variant="ghost" size="sm" className={cn("h-auto p-0 text-muted-foreground hover:text-red-500", comment.user_has_liked && "text-red-500")} onClick={onLike}>
                            <Heart className={cn("h-4 w-4 mr-1", comment.user_has_liked && "fill-current")} />
                            {comment.likes_count || 0} Likes
                        </Button>
                        <Button variant="ghost" size="sm" className="h-auto p-0 text-muted-foreground" onClick={() => setIsReplying(!isReplying)}>
                            <Reply className="h-4 w-4 mr-1" />
                            Reply
                        </Button>
                    </div>

                    {isReplying && (
                        <div className="space-y-2 pt-2">
                            <Textarea 
                                placeholder="Write a reply..." 
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                className="min-h-[60px]"
                            />
                            <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={() => setIsReplying(false)}>Cancel</Button>
                                <Button size="sm" onClick={() => {
                                    onReply(replyContent);
                                    setIsReplying(false);
                                    setReplyContent("");
                                }}>Reply</Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {replies.length > 0 && (
                <div className="pl-12 space-y-4">
                    {replies.map(reply => (
                        <div key={reply.id} className="flex gap-4 p-4 border rounded-lg bg-slate-50 dark:bg-slate-900">
                             <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">
                                    {reply.user?.first_name?.[0] || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium leading-none">
                                        {reply.user?.first_name} {reply.user?.last_name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                                    </p>
                                </div>
                                <p className="text-sm text-muted-foreground">{reply.content}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
