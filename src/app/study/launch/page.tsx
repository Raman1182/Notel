
'use client';

import type { NextPage } from 'next';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppHeader } from '@/components/shared/app-header';
import { SettingsProvider } from '@/components/settings-provider';
import { Sparkles, Target, Edit3, Clock, Music2, Play, BookOpen, BarChart3, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

const recentSubjectsData = [
  { name: 'Physics', icon: <BookOpen className="h-4 w-4 mr-2" /> },
  { name: 'Mathematics', icon: <BookOpen className="h-4 w-4 mr-2" /> },
  { name: 'Biology', icon: <BookOpen className="h-4 w-4 mr-2" /> },
];

const durationOptionsData = [
  { label: '25 min', value: 25, description: 'Pomodoro Sprint' },
  { label: '45 min', value: 45, description: 'Standard Study' },
  { label: '60 min', value: 60, description: 'Deep Work' },
];

const ambientSoundsData = [
  { name: 'None', icon: <Music2 className="h-4 w-4 mr-2 opacity-50" /> },
  { name: 'Rain', icon: <Music2 className="h-4 w-4 mr-2" /> },
  { name: 'Cafe', icon: <Music2 className="h-4 w-4 mr-2" /> },
  { name: 'Library', icon: <Music2 className="h-4 w-4 mr-2" /> },
];

const StudySessionLauncherPage: NextPage = () => {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<number | null>(25);
  const [selectedSound, setSelectedSound] = useState<string>('None');
  const [greeting, setGreeting] = useState("Ready to Start Your Study Session?");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting("Ready for your morning study session?");
    } else if (hour < 18) {
      setGreeting("Ready for your afternoon study session?");
    } else {
      setGreeting("Ready for your evening study session?");
    }
  }, []);

  const handleStartSession = () => {
    const sessionSubject = subject.trim() === '' ? `Study Session ${new Date().toLocaleDateString()}` : subject.trim();
    router.push(`/study?subject=${encodeURIComponent(sessionSubject)}&duration=${selectedDuration || 25}`);
  };

  const CardWrapper: React.FC<{ title: string, icon: React.ReactNode, children: React.ReactNode, className?: string }> = ({ title, icon, children, className }) => (
    <Card className={cn("w-full max-w-md bg-white/5 border-white/10 shadow-glass backdrop-blur-md", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg font-semibold text-foreground/80">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );

  return (
    <SettingsProvider>
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#030712] to-[#0A0A0A] text-white">
        <AppHeader />
        <main className="flex flex-1 flex-col items-center justify-center p-6 space-y-6 md:space-y-8 overflow-y-auto custom-scrollbar">
          <div className="text-center mb-6">
            <Sparkles className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="text-3xl md:text-4xl font-bold font-headline text-foreground tracking-tight">
              {greeting}
            </h1>
            <p className="text-foreground-opacity-70 mt-2">Current Streak: <span className="text-warning font-semibold">5 days</span> 🔥</p>
          </div>

          <CardWrapper title="What are you studying?" icon={<Edit3 className="h-5 w-5 mr-2 text-primary" />}>
            <Input
              type="text"
              placeholder="Type subject name or topic..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="bg-white/5 border-white/20 h-12 text-lg placeholder:text-foreground-opacity-50 focus:border-primary focus:ring-primary"
            />
            <div className="mt-3 text-sm text-foreground-opacity-70">
              Recent:
              <div className="flex flex-wrap gap-2 mt-1">
                {recentSubjectsData.map((item) => (
                  <Button
                    key={item.name}
                    variant="outline"
                    size="sm"
                    onClick={() => setSubject(item.name)}
                    className="bg-white/10 border-white/20 hover:bg-primary/20 text-foreground-opacity-70 hover:text-foreground"
                  >
                    {item.icon} {item.name}
                  </Button>
                ))}
                <Button variant="outline" size="sm" onClick={() => setSubject('')} className="bg-white/10 border-white/20 hover:bg-primary/20 text-foreground-opacity-70 hover:text-foreground">
                  <Sparkles className="h-4 w-4 mr-1 text-xs" /> New
                </Button>
              </div>
            </div>
          </CardWrapper>

          <CardWrapper title="Session Duration" icon={<Clock className="h-5 w-5 mr-2 text-primary" />}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {durationOptionsData.map((opt) => (
                <Button
                  key={opt.value}
                  variant={selectedDuration === opt.value ? 'default' : 'outline'}
                  onClick={() => setSelectedDuration(opt.value)}
                  className={cn(
                    "flex flex-col h-auto py-2 border-white/20",
                    selectedDuration !== opt.value && "bg-white/10 hover:bg-primary/20 text-foreground-opacity-70 hover:text-foreground",
                    selectedDuration === opt.value && "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                >
                  <span className="text-lg font-semibold">{opt.label}</span>
                  <span className="text-xs opacity-80">{opt.description}</span>
                </Button>
              ))}
               <Button
                  variant={selectedDuration === null ? 'default' : 'outline'} // Assuming null means custom is active
                  onClick={() => setSelectedDuration(null)} // Placeholder for custom logic
                  className={cn(
                    "flex flex-col h-auto py-2 border-white/20",
                    selectedDuration !== null && "bg-white/10 hover:bg-primary/20 text-foreground-opacity-70 hover:text-foreground",
                    selectedDuration === null && "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                >
                  <span className="text-lg font-semibold">Custom</span>
                  <span className="text-xs opacity-80">Set your own</span>
                </Button>
            </div>
          </CardWrapper>
          
          <CardWrapper title="Ambient Sounds (Optional)" icon={<Music2 className="h-5 w-5 mr-2 text-primary" />} className="hidden md:block">
            <div className="flex flex-wrap justify-center gap-3">
              {ambientSoundsData.map((sound) => (
                <Button
                  key={sound.name}
                  variant={selectedSound === sound.name ? 'default' : 'outline'}
                  onClick={() => setSelectedSound(sound.name)}
                  className={cn(
                    "border-white/20 min-w-[100px]",
                    selectedSound !== sound.name && "bg-white/10 hover:bg-primary/20 text-foreground-opacity-70 hover:text-foreground",
                    selectedSound === sound.name && "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                >
                  {sound.icon} {sound.name}
                </Button>
              ))}
            </div>
          </CardWrapper>

          <Button
            size="lg"
            onClick={handleStartSession}
            className="w-full max-w-md h-14 text-xl font-semibold bg-gradient-to-r from-primary to-sky-400 hover:from-primary/90 hover:to-sky-400/90 shadow-3d-lift hover:shadow-lg transition-all duration-300 ease-out group"
          >
            Start Session <Play className="h-6 w-6 ml-2 transform transition-transform group-hover:scale-110" />
          </Button>

          <div className="w-full max-w-4xl mt-10 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between text-sm text-foreground-opacity-70">
            <div className="mb-4 md:mb-0">
              <h4 className="font-semibold text-foreground/80 mb-2 flex items-center"><BarChart3 className="h-5 w-5 mr-2 text-primary/70"/>Recent Sessions</h4>
              <ul className="space-y-1 list-disc list-inside pl-1">
                <li>Physics - Quantum Mechanics (2 hours ago)</li>
                <li>Mathematics - Calculus (Yesterday)</li>
              </ul>
            </div>
            <div className="text-center md:text-right">
                <Flame className="h-6 w-6 text-warning inline-block mr-1" />
                <span className="font-semibold text-foreground/80">Current Streak: 5 days</span>
            </div>
          </div>
        </main>
      </div>
    </SettingsProvider>
  );
};

export default StudySessionLauncherPage;

    