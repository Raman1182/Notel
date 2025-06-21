
'use client';

import type { NextPage } from 'next';
import Link from 'next/link';
import { AppHeader } from '@/components/shared/app-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { BarChart3, Hourglass, Calendar as CalendarIcon, TrendingUp, Sigma, Loader2 } from 'lucide-react';
import { StudyAnalyticsWidget } from '@/components/dashboard/study-analytics-widget';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { getSessions, type SessionDocumentWithId } from '@/services/session-service';
import type { LucideIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, description }: { title: string, value: string, icon: LucideIcon, description?: string }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </CardContent>
    </Card>
);

const AnalyticsPage: NextPage = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionDocumentWithId[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      getSessions(user.uid)
        .then(setSessions)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    } else {
        setIsLoading(false);
    }
  }, [user]);

  const stats = useMemo(() => {
    if (sessions.length === 0) {
      return {
        totalHours: "0",
        totalSessions: 0,
        dailyAverageMinutes: "0",
        weeklyAverageHours: "0",
        dailyActivity: [],
      };
    }

    const totalSeconds = sessions.reduce((acc, s) => acc + (s.actualDuration || 0), 0);
    const totalHours = totalSeconds / 3600;

    const studyDays = new Map<string, number>();
    sessions.forEach(s => {
      if (s.startTime) {
        const date = new Date(s.startTime).toISOString().split('T')[0];
        const currentSeconds = studyDays.get(date) || 0;
        studyDays.set(date, currentSeconds + (s.actualDuration || 0));
      }
    });

    const uniqueStudyDays = studyDays.size;
    const dailyAverageMinutes = uniqueStudyDays > 0 ? totalSeconds / uniqueStudyDays / 60 : 0;
    
    const startTimestamps = sessions.map(s => s.startTime).filter(Boolean) as number[];
    const firstDay = new Date(Math.min(...startTimestamps));
    const lastDay = new Date(Math.max(...startTimestamps));
    const totalWeeks = Math.max(1, (lastDay.getTime() - firstDay.getTime()) / (1000 * 60 * 60 * 24 * 7));
    const weeklyAverageHours = totalHours / totalWeeks;

    const dailyActivity: { date: string; Minutes: number }[] = [];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29); // include today
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    for (let i = 0; i < 30; i++) {
        const date = new Date(thirtyDaysAgo);
        date.setDate(date.getDate() + i);
        const dateString = date.toISOString().split('T')[0];
        const minutesStudied = (studyDays.get(dateString) || 0) / 60;
        dailyActivity.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            Minutes: parseFloat(minutesStudied.toFixed(1))
        });
    }

    return {
      totalHours: totalHours.toFixed(1),
      totalSessions: sessions.length,
      dailyAverageMinutes: dailyAverageMinutes.toFixed(0),
      weeklyAverageHours: weeklyAverageHours.toFixed(1),
      dailyActivity,
    };
  }, [sessions]);
  
  const chartConfig = {
      Minutes: {
        label: "Minutes",
        color: "hsl(var(--primary))",
      },
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
        <div className="mb-8">
          <nav className="text-sm text-muted-foreground mb-1">
            <Link href="/" className="hover:text-primary">Home</Link>
            {' / '}
            <span>Analytics</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold font-headline text-foreground tracking-tight flex items-center">
            <BarChart3 className="mr-3 h-8 w-8 text-primary" />
            Study Analytics
          </h1>
          <p className="text-muted-foreground mt-2">A detailed look at your study habits and progress.</p>
        </div>

        {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        ) : (
          <div className="grid gap-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Total Study Time" value={`${stats.totalHours} hrs`} icon={Hourglass} description="Total focused hours recorded." />
              <StatCard title="Total Sessions" value={stats.totalSessions.toString()} icon={CalendarIcon} description="Number of study sessions started." />
              <StatCard title="Daily Average" value={`${stats.dailyAverageMinutes} min`} icon={TrendingUp} description="Average time on days you studied." />
              <StatCard title="Weekly Average" value={`${stats.weeklyAverageHours} hrs`} icon={Sigma} description="Average hours studied per week." />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Time Spent Per Subject</CardTitle>
                        <CardDescription>Total focused study time aggregated by subject.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <StudyAnalyticsWidget />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Daily Activity</CardTitle>
                        <CardDescription>Your study time over the last 30 days.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="h-[300px]">
                            <ChartContainer config={chartConfig} className="h-full w-full">
                                <ResponsiveContainer>
                                    <LineChart data={stats.dailyActivity} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                        <XAxis dataKey="date" tickLine={false} axisLine={false} stroke="#888888" fontSize={12} />
                                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}m`} />
                                        <Tooltip cursor={{ fill: 'hsla(var(--muted))' }} content={<ChartTooltipContent />} />
                                        <Line type="monotone" dataKey="Minutes" stroke="var(--color-Minutes)" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AnalyticsPage;
