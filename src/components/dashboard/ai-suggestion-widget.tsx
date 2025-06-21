
'use client';

import { useState, useCallback } from 'react';
import { WidgetCard } from './widget-card';
import { Button } from '@/components/ui/button';
import { Loader2, Lightbulb, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { getSessions, type SessionDocumentWithId } from '@/services/session-service';
import { getDeadlines, type DeadlineDocument } from '@/services/deadline-service';
import { suggestNextTopicFlow, type SuggestNextTopicOutput } from '@/ai/flows/suggest-next-topic-flow';
import { useToast } from '@/hooks/use-toast';

export function AiSuggestionWidget() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [suggestion, setSuggestion] = useState<SuggestNextTopicOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getSuggestion = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        setError(null);
        setSuggestion(null);

        try {
            const [sessions, deadlines] = await Promise.all([
                getSessions(user.uid),
                getDeadlines(user.uid),
            ]);

            const historicalSessions = sessions.map(s => ({
                subject: s.subject,
                startTime: s.startTime,
                actualDuration: s.actualDuration,
            }));

            const upcomingDeadlines = deadlines
                .filter(d => !d.completed)
                .map(d => ({ title: d.title, dueDate: d.dueDate }));

            const subjects = [...new Set(sessions.map(s => s.subject))];

            const result = await suggestNextTopicFlow({ historicalSessions, upcomingDeadlines, subjects });
            setSuggestion(result);

        } catch (err) {
            console.error("Error getting AI suggestion:", err);
            const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
            setError(errorMessage);
            toast({
                title: "Suggestion Error",
                description: "Could not get an AI suggestion at this time.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }, [user, toast]);

    return (
        <WidgetCard title="What to Study Next?" interactive={false} className="flex flex-col">
            <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
                {isLoading && (
                    <div className="space-y-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                        <p className="text-sm text-muted-foreground">Analyzing your progress...</p>
                    </div>
                )}
                {!isLoading && error && (
                     <div className="space-y-2 text-destructive">
                        <AlertTriangle className="h-8 w-8 mx-auto" />
                        <p className="text-sm font-medium">Could not get suggestion</p>
                    </div>
                )}
                {!isLoading && !suggestion && !error && (
                     <Button onClick={getSuggestion} disabled={!user}>
                        <Lightbulb className="mr-2 h-5 w-5" />
                        Get Suggestion
                    </Button>
                )}
                 {!isLoading && suggestion && (
                    <div className="text-center animate-slide-up-fade">
                        <p className="text-sm text-muted-foreground">The AI suggests:</p>
                        <h4 className="text-2xl font-bold text-primary my-1">{suggestion.suggestedSubject}</h4>
                        <p className="text-sm text-foreground/80 mb-4">"{suggestion.reasoning}"</p>
                        <Button onClick={getSuggestion} variant="outline" size="sm">
                            Get another suggestion
                        </Button>
                    </div>
                )}
            </div>
        </WidgetCard>
    );
}
