import { useState, useEffect } from 'react';
import { MessageSquare, Send, Reply, ThumbsUp, ThumbsDown, Link } from 'lucide-react';
import { supabase } from '../lib/supabase';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface Comment {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  likes_count: number;
  dislikes_count: number;
}

interface CommentWithReplies extends Comment {
  replies: CommentWithReplies[];
}

export default function CommentsSection() {
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [authorName, setAuthorName] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [userReactions, setUserReactions] = useState<Record<string, 'like' | 'dislike' | null>>({});
  const [copiedCommentId, setCopiedCommentId] = useState<string | null>(null);

  useEffect(() => {
    fetchComments();
    loadUserReactions();
  }, []);

  const getUserFingerprint = (): string => {
    let fingerprint = localStorage.getItem('user_fingerprint');
    if (!fingerprint) {
      fingerprint = `fp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('user_fingerprint', fingerprint);
    }
    return fingerprint;
  };

  const loadUserReactions = async () => {
    const fingerprint = getUserFingerprint();
    const { data, error } = await supabase
      .from('comment_reactions')
      .select('comment_id, reaction_type')
      .eq('user_fingerprint', fingerprint);

    if (!error && data) {
      const reactionsMap: Record<string, 'like' | 'dislike' | null> = {};
      data.forEach((reaction) => {
        reactionsMap[reaction.comment_id] = reaction.reaction_type as 'like' | 'dislike';
      });
      setUserReactions(reactionsMap);
    }
  };

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('is_visible', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching comments:', error);
    } else {
      const commentTree = buildCommentTree(data || []);
      setComments(commentTree);
    }
  };

  const buildCommentTree = (flatComments: Comment[]): CommentWithReplies[] => {
    const commentMap = new Map<string, CommentWithReplies>();
    const rootComments: CommentWithReplies[] = [];

    flatComments.forEach((comment) => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    flatComments.forEach((comment) => {
      const commentWithReplies = commentMap.get(comment.id)!;
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id);
        if (parent) {
          parent.replies.push(commentWithReplies);
        }
      } else {
        rootComments.push(commentWithReplies);
      }
    });

    rootComments.forEach((comment) => {
      comment.replies.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    });

    return rootComments;
  };

  const handleSubmit = async (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault();

    if (!content.trim()) {
      setSubmitMessage('Please enter a comment');
      setTimeout(() => setSubmitMessage(''), 3000);
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');

    const commentData = {
      author_name: authorName.trim() || 'Anonymous',
      content: content.trim(),
      parent_id: parentId,
    };

    const { error } = await supabase.from('comments').insert(commentData);

    if (error) {
      console.error('Error submitting comment:', error);
      setSubmitMessage('Failed to submit comment. Please try again.');
    } else {
      setSubmitMessage('Comment posted successfully!');
      setAuthorName('');
      setContent('');
      setReplyingTo(null);
      fetchComments();
    }

    setIsSubmitting(false);
    setTimeout(() => setSubmitMessage(''), 5000);
  };

  const handleReaction = async (commentId: string, reactionType: 'like' | 'dislike') => {
    const fingerprint = getUserFingerprint();
    const currentReaction = userReactions[commentId];

    if (currentReaction === reactionType) {
      return;
    }

    const { error } = await supabase.from('comment_reactions').insert({
      comment_id: commentId,
      reaction_type: reactionType,
      user_fingerprint: fingerprint,
    });

    if (!error) {
      setUserReactions((prev) => ({
        ...prev,
        [commentId]: reactionType,
      }));
      fetchComments();
    }
  };

  const handleLike = (commentId: string) => {
    handleReaction(commentId, 'like');
  };

  const handleDislike = (commentId: string) => {
    handleReaction(commentId, 'dislike');
  };

  const handleShare = (commentId: string) => {
    const commentUrl = `${window.location.origin}${window.location.pathname}#comment-${commentId}`;
    navigator.clipboard.writeText(commentUrl);
    setCopiedCommentId(commentId);
    setTimeout(() => setCopiedCommentId(null), 2000);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderMathContent = (text: string) => {
    const parts: JSX.Element[] = [];
    let lastIndex = 0;
    let key = 0;

    const blockMathRegex = /\$\$([\s\S]*?)\$\$/g;
    const inlineMathRegex = /\$((?!\$)[\s\S]*?)\$/g;

    let blockMatch;
    const blockMatches: Array<{ index: number; length: number; content: string }> = [];

    while ((blockMatch = blockMathRegex.exec(text)) !== null) {
      blockMatches.push({
        index: blockMatch.index,
        length: blockMatch[0].length,
        content: blockMatch[1],
      });
    }

    const processedRanges: Array<{ start: number; end: number }> = [];

    blockMatches.forEach((match) => {
      if (lastIndex < match.index) {
        const textBefore = text.substring(lastIndex, match.index);
        processInlineMatches(textBefore, lastIndex);
      }

      parts.push(
        <div key={key++} className="my-2">
          <BlockMath math={match.content} />
        </div>
      );

      processedRanges.push({ start: match.index, end: match.index + match.length });
      lastIndex = match.index + match.length;
    });

    if (lastIndex < text.length) {
      processInlineMatches(text.substring(lastIndex), lastIndex);
    }

    function processInlineMatches(str: string, offset: number) {
      let inlineLastIndex = 0;
      let inlineMatch;
      const inlineRegex = /\$((?!\$)[^\$]*?)\$/g;

      while ((inlineMatch = inlineRegex.exec(str)) !== null) {
        if (inlineLastIndex < inlineMatch.index) {
          parts.push(<span key={key++}>{str.substring(inlineLastIndex, inlineMatch.index)}</span>);
        }

        parts.push(<InlineMath key={key++} math={inlineMatch[1]} />);
        inlineLastIndex = inlineMatch.index + inlineMatch[0].length;
      }

      if (inlineLastIndex < str.length) {
        parts.push(<span key={key++}>{str.substring(inlineLastIndex)}</span>);
      }
    }

    return parts.length > 0 ? <>{parts}</> : text;
  };

  const renderComment = (comment: CommentWithReplies, depth: number = 0) => {
    const isReplying = replyingTo === comment.id;

    return (
      <div key={comment.id} className={`${depth > 0 ? 'ml-8 mt-3' : ''}`}>
        <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-slate-800 dark:text-slate-100">{comment.author_name}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{formatDate(comment.created_at)}</span>
          </div>
          <div className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap mb-2">
            {renderMathContent(comment.content)}
          </div>
          <div id={`comment-${comment.id}`} className="flex items-center gap-4 flex-wrap">
            <button
              onClick={() => setReplyingTo(isReplying ? null : comment.id)}
              className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-500 dark:text-orange-300 dark:hover:text-orange-400 font-medium transition-colors"
            >
              <Reply className="w-3 h-3" />
              {isReplying ? 'Cancel' : 'Reply'}
            </button>

            <button
              onClick={() => handleLike(comment.id)}
              disabled={userReactions[comment.id] === 'like'}
              className={`flex items-center gap-1 text-xs font-medium transition-colors ${
                userReactions[comment.id] === 'like'
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400'
              } disabled:cursor-not-allowed`}
            >
              <ThumbsUp className="w-3 h-3" />
              <span>{comment.likes_count}</span>
            </button>

            <button
              onClick={() => handleDislike(comment.id)}
              disabled={userReactions[comment.id] === 'dislike'}
              className={`flex items-center gap-1 text-xs font-medium transition-colors ${
                userReactions[comment.id] === 'dislike'
                  ? 'text-slate-700 dark:text-slate-300'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              } disabled:cursor-not-allowed`}
            >
              <ThumbsDown className="w-3 h-3" />
              <span>{comment.dislikes_count}</span>
            </button>

            <button
              onClick={() => handleShare(comment.id)}
              className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 font-medium transition-colors"
            >
              <Link className="w-3 h-3" />
              {copiedCommentId === comment.id ? 'Copied!' : 'Share'}
            </button>
          </div>

          {isReplying && (
            <form
              onSubmit={(e) => handleSubmit(e, comment.id)}
              className="mt-3 space-y-3 border-t border-slate-300 dark:border-slate-600 pt-3"
            >
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Name (optional)"
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                maxLength={100}
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write a reply... (supports LaTeX: $inline$ or $$block$$)"
                rows={3}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                maxLength={5000}
                required
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 dark:text-slate-400">{content.length}/5000 characters</p>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1 px-4 py-1.5 bg-orange-400 hover:bg-orange-500 dark:bg-orange-500 dark:hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-3 h-3" />
                  {isSubmitting ? 'Posting...' : 'Post Reply'}
                </button>
              </div>
            </form>
          )}
        </div>

        {comment.replies.length > 0 && (
          <div className="mt-2">
            {comment.replies.map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const totalCommentCount = (comments: CommentWithReplies[]): number => {
    return comments.reduce((count, comment) => {
      return count + 1 + totalCommentCount(comment.replies);
    }, 0);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="w-6 h-6 text-orange-400 dark:text-orange-300" />
        <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Discussion & Feedback</h2>
      </div>

      <form onSubmit={(e) => handleSubmit(e, null)} className="mb-8">
        <div className="space-y-4">
          <div>
            <label htmlFor="authorName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Name (optional)
            </label>
            <input
              type="text"
              id="authorName"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Anonymous"
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              maxLength={100}
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Comment * <span className="text-xs text-slate-500 dark:text-slate-400">(supports LaTeX: $inline$ or $$block$$)</span>
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts, questions, or feedback... Use $x^2$ for inline math or $$\int_0^1 x^2 dx$$ for block math."
              rows={4}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              maxLength={5000}
              required
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{content.length}/5000 characters</p>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-orange-400 hover:bg-orange-500 dark:bg-orange-500 dark:hover:bg-orange-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Posting...' : 'Post Comment'}
            </button>

            {submitMessage && (
              <p
                className={`text-sm ${
                  submitMessage.includes('success') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {submitMessage}
              </p>
            )}
          </div>
        </div>
      </form>

      <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
          Comments ({totalCommentCount(comments)})
        </h3>

        {comments.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 text-center py-8">
            No comments yet. Be the first to share your thoughts!
          </p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => renderComment(comment))}
          </div>
        )}
      </div>
    </div>
  );
}
