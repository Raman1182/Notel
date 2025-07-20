
'use client';

import type { NextPage } from 'next';
import Link from 'next/link';
import { AppHeader } from '@/components/shared/app-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, Flame, Play, Star, BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface Achievement {
    icon: LucideIcon;
    title: string;
    description: string;
    achieved: boolean;
    tier: 'bronze' | 'silver' | 'gold';
}

const achievementsList: Achievement[] = [
    { icon: Play, title: "First Steps", description: "Completed your first study session.", achieved: true, tier: 'bronze' },
    { icon: Flame, title: "On Fire", description: "Maintained a 5-day study streak.", achieved: true, tier: 'bronze' },
    { icon: BrainCircuit, title: "AI Collaborator", description: "Used an AI tool during a study session.", achieved: true, tier: 'silver' },
    { icon: Star, title: "Subject Novice", description: "Created notes for 3 different subjects.", achieved: true, tier: 'silver' },
    { icon: Flame, title: "Eternal Flame", description: "Maintained a 30-day study streak.", achieved: false, tier: 'gold' },
    { icon: Star, title: "Subject Adept", description: "Created notes for 10 different subjects.", achieved: false, tier: 'gold' },
    { icon: Play, title: "Centurion", description: "Completed 100 hours of focused study.", achieved: false, tier: 'gold' },
    { icon: Trophy, title: "Notel Master", description: "Achieved all other achievements.", achieved: false, tier: 'gold' },
];

const tierStyles = {
    bronze: "border-yellow-700/50 bg-yellow-700/10",
    silver: "border-slate-400/50 bg-slate-400/10",
    gold: "border-amber-400/50 bg-amber-400/10",
};


const AchievementsPage: NextPage = () => {
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <AppHeader />
            <main className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
                <div className="mb-8">
                    <nav className="text-sm text-muted-foreground mb-1">
                        <Link href="/" className="hover:text-primary">Home</Link>
                        {' / '}
                        <span>Achievements</span>
                    </nav>
                    <h1 className="text-3xl md:text-4xl font-bold font-headline text-foreground tracking-tight flex items-center">
                        <Trophy className="mr-3 h-8 w-8 text-primary" />
                        Your Achievements
                    </h1>
                    <p className="text-muted-foreground mt-2">Track your progress and celebrate your learning milestones.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {achievementsList.map((achievement, index) => (
                        <Card 
                            key={index} 
                            className={cn(
                                "border-l-4 transition-all duration-300",
                                achievement.achieved ? tierStyles[achievement.tier] : "bg-card opacity-60",
                                !achievement.achieved && "border-muted"
                            )}
                        >
                            <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                                <div className={cn("p-2 rounded-full", achievement.achieved ? "bg-primary/20" : "bg-muted")}>
                                   <achievement.icon className={cn("h-7 w-7", achievement.achieved ? "text-primary" : "text-muted-foreground")} />
                                </div>
                                <CardTitle className="text-lg font-semibold">{achievement.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription>
                                    {achievement.description}
                                </CardDescription>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </main>
        </div>
    );
}

export default AchievementsPage;
