'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ActivityDialog } from './activity-dialog';
import { Activity } from 'lucide-react';

export function ActivityButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="link" onClick={() => setOpen(true)}>
        Activity
      </Button>
      <ActivityDialog open={open} onOpenChange={setOpen} />
    </>
  );
}