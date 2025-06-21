
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { WidgetCard } from './widget-card';
import { useAuth } from '@/contexts/auth-context';
import { getSessions, type SessionDocumentWithId } from '@/services/session-service';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';

interface ChartData {
  subject: string;
  hours: number;
}

const chartConfig = {
  hours: {
    label: 'Hours',
    color: 'hsl(var(--primary))',
  },
};

export function StudyAnalyticsWidget() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionDocumentWithId[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      getSessions(user.uid)
        .then(setSessions)
        .catch(err => {
            console.error(err);
            setError("Could not load analytics data.");
        })
        .finally(() => setIsLoading(false));
    } else {
        setIsLoading(false);
    }
  }, [user]);

  const chartData: ChartData[] = useMemo(() => {
    const subjectHours: Record<string, number> = {};
    sessions.forEach(session => {
      const durationInSeconds = session.actualDuration || 0;
      if (!subjectHours[session.subject]) {
        subjectHours[session.subject] = 0;
      }
      subjectHours[session.subject] += durationInSeconds / 3600; // convert seconds to hours
    });

    return Object.entries(subjectHours)
        .map(([subject, hours]) => ({ subject, hours: parseFloat(hours.toFixed(2)) }))
        .sort((a,b) => b.hours - a.hours);

  }, [sessions]);
  
  if (isLoading) {
      return (
          <WidgetCard title="Study Analytics" interactive={false}>
              <Skeleton className="h-[250px] w-full" />
          </WidgetCard>
      );
  }

  return (
    <WidgetCard title="Study Analytics" interactive={false}>
      {error && (
          <Alert variant="destructive">
              <BarChart3 className="h-4 w-4"/>
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
          </Alert>
      )}

      {!error && chartData.length === 0 && (
          <div className="text-center py-10">
              <p className="text-muted-foreground">No study data yet. Complete a session to see your analytics!</p>
          </div>
      )}
      
      {!error && chartData.length > 0 && (
        <>
            <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <XAxis
                        dataKey="subject"
                        tickLine={false}
                        axisLine={false}
                        stroke="#888888"
                        fontSize={12}
                        tickFormatter={(value) => value.length > 10 ? `${value.substring(0,10)}...` : value}
                    />
                    <YAxis
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}h`}
                    />
                    <Tooltip
                        cursor={{ fill: 'hsla(var(--muted))' }}
                        content={<ChartTooltipContent />}
                    />
                    <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="flex justify-end mt-2">
                <Button variant="link" asChild>
                    <Link href="/analytics">View More Analytics</Link>
                </Button>
            </div>
        </>
      )}
    </WidgetCard>
  );
}
