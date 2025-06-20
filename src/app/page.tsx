
'use client';

import { AppHeader } from '@/components/shared/app-header';
import { StudyStreakWidget } from '@/components/dashboard/study-streak-widget';
import { QuickActionsWidget } from '@/components/dashboard/quick-actions-widget';
import { AiAssistantBubble } from '@/components/ai-assistant/ai-assistant-bubble';
import { WidgetCard } from '@/components/dashboard/widget-card';
import Image from 'next/image';
import { SettingsProvider } from '@/components/settings-provider';

export default function DashboardPage() {
  return (
    <SettingsProvider>
      <div className="flex flex-col min-h-screen">
        <AppHeader />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold font-headline text-foreground tracking-tight">
              Welcome to LearnLog
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Your space for focused learning and peak productivity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StudyStreakWidget />
            <QuickActionsWidget />
            
            <WidgetCard title="Upcoming Deadlines" className="lg:col-span-1">
              <ul className="space-y-3">
                {[
                  { id: 1, task: "Calculus Assignment 3", due: "Tomorrow", color: "border-warning" },
                  { id: 2, task: "Physics Lab Report", due: "3 days", color: "border-primary/50" },
                  { id: 3, task: "History Essay Draft", due: "1 week", color: "border-border" },
                ].map(item => (
                  <li key={item.id} className={`flex items-center justify-between p-3 rounded-md bg-white/5 border-l-4 ${item.color}`}>
                    <span className="text-sm text-foreground/90">{item.task}</span>
                    <span className="text-xs text-muted-foreground px-2 py-1 rounded-full bg-white/10">{item.due}</span>
                  </li>
                ))}
              </ul>
            </WidgetCard>

            <WidgetCard title="Recent Notes" className="md:col-span-2 lg:col-span-3">
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[
                    {id: "n1", title: "Quantum Mechanics Basics", subject: "Physics", date: "2 days ago"},
                    {id: "n2", title: "Photosynthesis Explained", subject: "Biology", date: "5 days ago"},
                    {id: "n3", title: "The French Revolution", subject: "History", date: "1 week ago"},
                ].map(note => (
                    <div key={note.id} className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-white/10">
                        <h4 className="font-semibold text-foreground/90 truncate">{note.title}</h4>
                        <p className="text-xs text-muted-foreground">{note.subject}</p>
                        <p className="text-xs text-muted-foreground mt-1">{note.date}</p>
                    </div>
                ))}
               </div>
            </WidgetCard>

            <WidgetCard title="Focus Area" className="lg:col-span-3">
              <div className="aspect-[16/9] bg-white/5 rounded-lg flex items-center justify-center">
                <Image src="https://placehold.co/600x338.png" alt="Focus chart placeholder" data-ai-hint="data chart" width={600} height={338} className="rounded-md object-cover opacity-70" />
              </div>
            </WidgetCard>

          </div>
        </main>
        <AiAssistantBubble /> {/* This is separate from the command palette AI */}
      </div>
    </SettingsProvider>
  );
}
