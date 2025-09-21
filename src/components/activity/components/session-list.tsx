'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Timer } from 'lucide-react';
import { SessionListProps } from '../types';
import { SessionCard } from './session-card';

export function SessionList({ 
  sessions, 
  loading = false, 
  emptyMessage = "No timer sessions yet" 
}: SessionListProps) {
  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Timer className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{emptyMessage}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Start a timer to see your activity here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {sessions.map(session => (
        <Card key={session.id}>
          <CardContent className="p-3">
            <SessionCard session={session} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}