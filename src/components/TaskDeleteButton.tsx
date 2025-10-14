'use client';

import type { MouseEvent } from 'react';
import { useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useToast } from '@/components/ui/use-toast';
import { del } from '@/libs/api';
import { cn } from '@/utils/cn';

type TaskDeleteButtonProps = {
  taskId: string;
  tone?: 'light' | 'dark';
  size?: 'xs' | 'sm' | 'md';
  confirm?: boolean;
};

export function TaskDeleteButton({
  taskId,
  tone = 'light',
  size = 'sm',
  confirm = true,
}: TaskDeleteButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (deleting) return;
    if (confirm && !window.confirm('Delete this task?')) return;

    setDeleting(true);
    try {
      await del(`/api/tasks/${taskId}`);
      router.refresh();
    } catch (error) {
      console.error('Failed to delete task', error);
      toast({
        title: 'タスクを削除できませんでした',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <button
      type='button'
      onClick={handleDelete}
      onPointerDown={(event) => event.stopPropagation()}
      aria-label='Delete task'
      className={cn(
        'inline-flex items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        size === 'xs' ? 'h-4 w-4 text-[9px]' : size === 'sm' ? 'h-6 w-6 text-[10px]' : 'h-7 w-7 text-xs',
        tone === 'dark'
          ? 'border-white/30 bg-white/10 text-white hover:bg-white/20 focus-visible:ring-offset-0'
          : 'border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10',
        deleting && 'opacity-70'
      )}
    >
      {deleting ? (
        <Loader2 className={cn(size === 'xs' ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5', 'animate-spin')} />
      ) : (
        <Trash2 className={size === 'xs' ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5'} />
      )}
    </button>
  );
}
