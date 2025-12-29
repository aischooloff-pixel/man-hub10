import { useState } from 'react';
import { X, Heart, MessageCircle, Bookmark, Send, Loader2, Crown, Calendar, FileText, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Article } from '@/types';
import { cn } from '@/lib/utils';

interface ArticleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: Article | null;
  onLike?: (articleId: string) => void;
  onFavorite?: (articleId: string) => void;
  onComment?: (articleId: string, comment: string) => void;
}

export function ArticleDetailModal({
  isOpen,
  onClose,
  article,
  onLike,
  onFavorite,
  onComment,
}: ArticleDetailModalProps) {
  const [comment, setComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  if (!isOpen || !article) return null;

  const handleLike = () => {
    setIsLiked(!isLiked);
    onLike?.(article.id);
  };

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
    onFavorite?.(article.id);
  };

  const handleSubmitComment = async () => {
    if (!comment.trim()) return;
    setIsSubmittingComment(true);
    await onComment?.(article.id, comment);
    setComment('');
    setIsSubmittingComment(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/95 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute inset-x-0 top-0 bottom-0 flex flex-col bg-card animate-fade-in md:inset-4 md:rounded-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border bg-card p-4">
          <h2 className="font-heading text-lg font-semibold line-clamp-1">{article.title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* Author Section */}
          {article.author && !article.is_anonymous && (
            <div className="border-b border-border p-4">
              <div className="flex items-center gap-3">
                <img
                  src={article.author.avatar_url || '/placeholder.svg'}
                  alt={article.author.first_name}
                  className="h-12 w-12 rounded-full object-cover ring-2 ring-primary/20"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {article.author.first_name} {article.author.last_name}
                    </span>
                    {article.author.is_premium && (
                      <Crown className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  {article.author.username && (
                    <p className="text-sm text-muted-foreground">@{article.author.username}</p>
                  )}
                </div>
              </div>
              
              {/* Author Stats */}
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5" />
                  <span>{article.author.reputation || 0} репутации</span>
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  <span>{article.author.articles_count || 0} статей</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>С {formatDate(article.author.created_at)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Anonymous Author */}
          {article.is_anonymous && (
            <div className="border-b border-border p-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-xl">👤</span>
                </div>
                <div>
                  <span className="font-medium">Аноним</span>
                  <p className="text-sm text-muted-foreground">Автор скрыл свою личность</p>
                </div>
              </div>
            </div>
          )}

          {/* Media */}
          {article.media_url && (
            <div className="p-4">
              {article.media_type === 'youtube' ? (
                <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
                  <iframe
                    src={`https://www.youtube.com/embed/${article.media_url}`}
                    className="absolute inset-0 h-full w-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              ) : (
                <img
                  src={article.media_url}
                  alt={article.title}
                  className="w-full rounded-xl object-cover max-h-80"
                />
              )}
            </div>
          )}

          {/* Article Body */}
          <div className="p-4">
            <div className="prose prose-sm max-w-none text-foreground">
              <p className="whitespace-pre-wrap">{article.body}</p>
            </div>

            {/* Sources */}
            {article.sources && article.sources.length > 0 && (
              <div className="mt-6 rounded-xl bg-secondary/50 p-4">
                <h4 className="mb-2 text-sm font-medium">Источники:</h4>
                <ul className="space-y-1">
                  {article.sources.map((source, i) => (
                    <li key={i} className="text-sm text-primary hover:underline">
                      <a href={source} target="_blank" rel="noopener noreferrer">
                        {source}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Article Meta */}
            <div className="mt-4 text-xs text-muted-foreground">
              <span>Опубликовано {formatDate(article.created_at)}</span>
            </div>
          </div>

          {/* Action Bar */}
          <div className="sticky bottom-0 border-t border-border bg-card p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleLike}
                  className={cn(
                    'flex items-center gap-1.5 transition-colors',
                    isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
                  )}
                >
                  <Heart className={cn('h-6 w-6', isLiked && 'fill-current')} />
                  <span className="text-sm font-medium">{article.likes_count + (isLiked ? 1 : 0)}</span>
                </button>
                <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
                  <MessageCircle className="h-6 w-6" />
                  <span className="text-sm font-medium">{article.comments_count}</span>
                </button>
              </div>
              <button
                onClick={handleFavorite}
                className={cn(
                  'transition-colors',
                  isFavorited ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                )}
              >
                <Bookmark className={cn('h-6 w-6', isFavorited && 'fill-current')} />
              </button>
            </div>

            {/* Comment Input */}
            {article.allow_comments && (
              <div className="flex gap-2">
                <Input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Написать комментарий..."
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
                />
                <Button
                  size="icon"
                  onClick={handleSubmitComment}
                  disabled={!comment.trim() || isSubmittingComment}
                >
                  {isSubmittingComment ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
