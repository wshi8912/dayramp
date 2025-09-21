'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { postJSON } from '@/libs/api';
import { useRouter } from 'next/navigation';

export function AddTaskButton() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const save = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      await postJSON('/api/tasks', { title: title.trim(), source: 'manual', status: 'todo' });
      setTitle('');
      setOpen(false);
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='default'>Add Task</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Task</DialogTitle>
        </DialogHeader>
        <div className='flex items-center gap-2'>
          <Input
            placeholder='Task title'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save();
            }}
            autoFocus
          />
          <Button onClick={save} disabled={!title.trim() || saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
