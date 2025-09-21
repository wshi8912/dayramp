'use client';

import { ReactNode } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function ReviewModal({ open, onOpenChange, children }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  children?: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review & Publish</DialogTitle>
        </DialogHeader>
        <div className='text-sm text-muted-foreground'>MVP placeholder</div>
        <div>{children}</div>
      </DialogContent>
    </Dialog>
  );
}

