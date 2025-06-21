
'use client';

import type { NextPage } from 'next';
import Link from 'next/link';
import { AppHeader } from '@/components/shared/app-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import { StudyAnalyticsWidget } from '@/components/dashboard/study-analytics-widget';

const AnalyticsPage: NextPage = () => {
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

        <Card>
            <CardHeader>
                <CardTitle>Time Spent Per Subject</CardTitle>
                <CardDescription>Total focused study time aggregated by subject.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[400px]">
                    <StudyAnalyticsWidget />
                </div>
            </CardContent>
        </Card>

        <Card className="mt-6">
            <CardHeader>
                <CardTitle>More Analytics Coming Soon!</CardTitle>
                <CardDescription>We're working on more ways to visualize your progress, including task completion rates, streak history, and more.</CardDescription>
            </CardHeader>
        </Card>
      </main>
    </div>
  );
};

export default AnalyticsPage;
