'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity } from 'lucide-react';
import { ActivityDialogProps } from './types';
import { useActivityData } from './hooks/use-activity-data';
import { useActivityStats } from './hooks/use-activity-stats';
import { HistoryTab } from './tabs/history-tab';
import { StatisticsTab } from './tabs/statistics-tab';

export function ActivityDialog({ open, onOpenChange }: ActivityDialogProps) {
  const { sessions, loading, error } = useActivityData(open);
  const stats = useActivityStats(sessions);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden sm:rounded-2xl border bg-background/95 backdrop-blur">
        
        <DialogHeader className="pb-4">
          <div className="flex items-start gap-3 rounded-xl border bg-muted/40 p-3">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="leading-tight">Your Activity</DialogTitle>
              <DialogDescription className="mt-1">Focus, intervals, and breathing across your recent sessions</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <Tabs defaultValue="history" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-xl bg-muted/60 p-1 border shadow-sm">
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
          </TabsList>

          <div className="mt-4 overflow-y-auto max-h-[58vh] pr-1">
            <TabsContent value="history">
              <HistoryTab sessions={sessions} loading={loading} />
            </TabsContent>

            <TabsContent value="stats">
              <StatisticsTab sessions={sessions} stats={stats} />
            </TabsContent>
          </div>

          {error && (
            <div className="text-center text-destructive text-sm mt-4">
              {error}
            </div>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}