import { useState } from 'react';
import { X, Clock, Check, XCircle, Edit, Trash2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Article } from '@/types';

interface UserArticlesModalProps {
  isOpen: boolean;
  onClose: () => void;
  articles: Article[];
  title?: string;
  onArticleClick?: (article: Article) => void;
  onEditClick?: (article: Article) => void;
  onDeleteClick?: (articleId: string) => void;
}

export function UserArticlesModal({
  isOpen,
  onClose,
  articles,
  title = 'Ваши статьи',
  onArticleClick,
  onEditClick,
  onDeleteClick,
}: UserArticlesModalProps) {
  const [deleteArticleId, setDeleteArticleId] = useState<string | null>(null);

  if (!isOpen) return null;

  const getStatusBadge = (status: Article['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="flex items-center gap-1 rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs text-yellow-500">
            <Clock className="h-3 w-3" />
            На модерации
          </span>
        );
      case 'approved':
        return (
          <span className="flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-500">
            <Check className="h-3 w-3" />
            Опубликовано
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-500">
            <XCircle className="h-3 w-3" />
            Отклонено
          </span>
        );
      default:
        return null;
    }
  };

  const handleDelete = () => {
    if (deleteArticleId) {
      onDeleteClick?.(deleteArticleId);
      setDeleteArticleId(null);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[100]">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-background/95 backdrop-blur-sm animate-fade-in"
          onClick={onClose}
        />

        {/* Modal - Nearly fullscreen */}
        <div className="absolute inset-x-0 top-0 bottom-0 flex flex-col bg-card animate-fade-in md:inset-4 md:rounded-2xl">

          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-border bg-card p-4">
            <h2 className="font-heading text-lg font-semibold">{title}</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4">
            {articles.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">Вы ничего не написали</p>
              </div>
            ) : (
              <div className="space-y-3">
                {articles.map((article) => (
                  <div
                    key={article.id}
                    className="rounded-2xl bg-secondary/50 p-4 transition-colors hover:bg-secondary/70"
                  >
                    {/* Clickable area */}
                    <button
                      onClick={() => onArticleClick?.(article)}
                      className="w-full text-left"
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <h3 className="font-medium line-clamp-2">{article.title}</h3>
                        {getStatusBadge(article.status)}
                      </div>
                      
                      <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                        {article.preview}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>❤️ {article.likes_count}</span>
                        <span>💬 {article.comments_count}</span>
                        <ChevronRight className="h-4 w-4 ml-auto" />
                      </div>
                    </button>
                    
                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditClick?.(article);
                        }}
                      >
                        <Edit className="h-3.5 w-3.5" />
                        Редактировать
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteArticleId(article.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Удалить
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteArticleId} onOpenChange={() => setDeleteArticleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить статью?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Статья будет удалена навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
