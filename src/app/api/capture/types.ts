export type SchemaTask = {
  kind: 'task' | 'event';
  title: string;
  note?: string;
  time: {
    type: 'range' | 'deadline' | 'none';
    startLocal?: string;
    endLocal?: string;
    dueLocal?: string;
  };
  estimateMin?: number;
  priority?: 'low' | 'mid' | 'high';
  confidence?: number;
};

export type Schema = {
  date: string; // YYYY-MM-DD in user's TZ
  timezone: string; // IANA TZ
  tasks: SchemaTask[];
  language: 'ja' | 'en';
};
