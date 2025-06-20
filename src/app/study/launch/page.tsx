
'use client';

import type { NextPage } from 'next';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppHeader } from '@/components/shared/app-header';
import { Sparkles, Edit3, Clock, Music2, Play, BookOpen, Loader2, RadioTower } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/contexts/auth-context';
import { addSession } from '@/services/session-service';
import { useToast } from '@/hooks/use-toast';

const recentSubjectsData = [
  { name: 'Physics', icon: <BookOpen className="h-4 w-4 mr-2" /> },
  { name: 'Mathematics', icon: <BookOpen className="h-4 w-4 mr-2" /> },
  { name: 'Biology', icon: <BookOpen className="h-4 w-4 mr-2" /> },
];

const durationOptionsData = [
  { label: '25 min', value: 25, description: 'Standard Focus' },
  { label: '45 min', value: 45, description: 'Deep Work Block' },
  { label: '60 min', value: 60, description: 'Extended Study' },
];

const ambientSoundsData = [
  { name: 'None', icon: <Music2 className="h-4 w-4 mr-2 opacity-50" /> },
  { name: 'Rain', icon: <Music2 className="h-4 w-4 mr-2" /> },
  { name: 'Cafe', icon: <Music2 className="h-4 w-4 mr-2" /> },
  { name: 'Library', icon: <Music2 className="h-4 w-4 mr-2" /> },
];

export type TimerMode = 'normal' | 'pomodoro_25_5';

export interface SessionData {
  sessionId: string; // client-side only ID
  subject: string;
  duration: number; // in minutes
  ambientSound: string;
  startTime: number; // timestamp
  timerMode: TimerMode;
  pomodoroCycle?: { workMinutes: number; breakMinutes: number };
}

const StudySessionLauncherPage: NextPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [subject, setSubject] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<number>(25); 
  const [selectedSound, setSelectedSound] = useState<string>('None');
  const [timerMode, setTimerMode] = useState<TimerMode>('normal');
  const [greeting, setGreeting] = useState("Ready to Start Your Study Session?");
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Ready for your morning study session?");
    else if (hour < 18) setGreeting("Ready for your afternoon study session?");
    else setGreeting("Ready for your evening study session?");
  }, []);

  const handleStartSession = async () => {
    if (!user) {
      toast({ title: "Please Sign In", description: "You must be signed in to start a study session.", variant: "destructive" });
      router.push('/auth');
      return;
    }
    
    setIsStarting(true);
    const sessionSubject = subject.trim() === '' ? `Study Session ${new Date().toLocaleDateString()}` : subject.trim();
    
    const sessionData: SessionData = {
      sessionId: `client_${Date.now()}`, // Temporary ID
      subject: sessionSubject,
      duration: selectedDuration, 
      ambientSound: selectedSound,
      startTime: Date.now(),
      timerMode: timerMode,
    };

    if (timerMode === 'pomodoro_25_5') {
      sessionData.pomodoroCycle = { workMinutes: 25, breakMinutes: 5 };
      sessionData.duration = 25;
    }

    try {
      const newSessionId = await addSession(user.uid, sessionData);
      router.push(`/study/${newSessionId}`);
    } catch (error) {
      console.error("Failed to save session to Firestore", error);
      toast({ title: "Error", description: "Could not start the session. Please try again.", variant: "destructive" });
      setIsStarting(false);
    }
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
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#030712] to-[#0A0A0A] text-white">
      <AppHeader />
      <main className="flex flex-1 flex-col items-center justify-center p-6 space-y-6 md:space-y-8 overflow-y-auto custom-scrollbar">
        <div className="text-center mb-6">
          <Sparkles className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold font-headline text-foreground tracking-tight">
            {greeting}
          </h1>
          <p className="text-foreground-opacity-70 mt-2">Launch your next focused learning period.</p>
        </div>

        <CardWrapper title="What are you studying?" icon={<Edit3 className="h-5 w-5 mr-2 text-primary" />}>
          <Input
            type="text"
            placeholder="Type subject name or topic..."
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="bg-white/5 border-white/20 h-12 text-lg placeholder:text-foreground-opacity-50 focus:border-primary focus:ring-primary"
            disabled={isStarting}
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
                  disabled={isStarting}
                >
                  {item.icon} {item.name}
                </Button>
              ))}
            </div>
          </div>
        </CardWrapper>

        <CardWrapper title="Timer Mode" icon={<RadioTower className="h-5 w-5 mr-2 text-primary" />}>
          <RadioGroup 
            defaultValue="normal" 
            onValueChange={(value: TimerMode) => setTimerMode(value)} 
            className="flex space-x-4"
            disabled={isStarting}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="normal" id="mode-normal" />
              <Label htmlFor="mode-normal" className="font-normal text-base">Normal</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pomodoro_25_5" id="mode-pomodoro" />
              <Label htmlFor="mode-pomodoro" className="font-normal text-base">Pomodoro (25/5)</Label>
            </div>
          </RadioGroup>
        </CardWrapper>

        <CardWrapper title="Session Duration" icon={<Clock className="h-5 w-5 mr-2 text-primary" />}>
          <p className="text-xs text-muted-foreground mb-2 -mt-1">
            {timerMode === 'pomodoro_25_5' ? 'Set initial work cycle duration. Default is 25 min.' : 'Set total session duration.'}
          </p>
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
                disabled={isStarting}
              >
                <span className="text-lg font-semibold">{opt.label}</span>
                <span className="text-xs opacity-80">{opt.description}</span>
              </Button>
            ))}
             <Button
              variant={![25,45,60].includes(selectedDuration) ? 'default' : 'outline'}
              onClick={() => setSelectedDuration(0)}
              className={cn(
                "flex flex-col h-auto py-2 border-white/20",
                [25,45,60].includes(selectedDuration) && "bg-white/10 hover:bg-primary/20 text-foreground-opacity-70 hover:text-foreground",
                ![25,45,60].includes(selectedDuration) && "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
              disabled={isStarting}
              title="Set custom duration (not fully implemented for this mode)"
            >
              <span className="text-lg font-semibold">Custom</span>
              <span className="text-xs opacity-80">Enter time</span>
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
                disabled={isStarting}
              >
                {sound.icon} {sound.name}
              </Button>
            ))}
          </div>
        </CardWrapper>

        <Button
          size="lg"
          onClick={handleStartSession}
          disabled={isStarting || authLoading || subject.trim() === ''}
          className="w-full max-w-md h-14 text-xl font-semibold bg-gradient-to-r from-primary to-sky-400 hover:from-primary/90 hover:to-sky-400/90 shadow-3d-lift hover:shadow-lg transition-all duration-300 ease-out group disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isStarting ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : <Play className="h-6 w-6 mr-2 transform transition-transform group-hover:scale-110" />}
          {isStarting ? "Starting..." : "Start Session"}
        </Button>
      </main>
    </div>
  );
};

export default StudySessionLauncherPage;
