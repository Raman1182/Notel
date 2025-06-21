
'use client';

import { UserAuthForm } from '@/components/auth/user-auth-form';
import { Sparkles, PlayCircle, Flame, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function AuthenticationPage() {
  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <Link href="/" className="flex items-center">
            <Sparkles className="mr-2 h-6 w-6 text-primary" />
            LearnLog
          </Link>
        </div>
        
        <div className="relative z-20 mt-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold font-headline">Supercharge Your Studies.</h2>
            <p className="text-muted-foreground mt-2">All the tools you need, powered by AI.</p>
          </div>
          <div className="space-y-6">
            <div className="flex items-center transform -rotate-2 hover:rotate-0 hover:scale-105 transition-transform duration-300 ease-out">
              <div className="p-3 bg-primary/10 rounded-full mr-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Intelligent Note-Taking</h3>
                <p className="text-sm text-muted-foreground">Summarize, expand, and connect ideas with AI.</p>
              </div>
            </div>
             <div className="flex items-center transform rotate-2 hover:rotate-0 hover:scale-105 transition-transform duration-300 ease-out justify-end">
               <div className="text-right">
                <h3 className="font-semibold text-lg">Focused Study Sessions</h3>
                <p className="text-sm text-muted-foreground">Custom timers, Pomodoro mode, and analytics.</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full ml-4">
                <PlayCircle className="h-6 w-6 text-primary" />
              </div>
            </div>
             <div className="flex items-center transform -rotate-2 hover:rotate-0 hover:scale-105 transition-transform duration-300 ease-out">
              <div className="p-3 bg-primary/10 rounded-full mr-4">
                <Flame className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Gamified Learning</h3>
                <p className="text-sm text-muted-foreground">Build streaks and earn achievements.</p>
              </div>
            </div>
             <div className="flex items-center transform rotate-2 hover:rotate-0 hover:scale-105 transition-transform duration-300 ease-out justify-end">
               <div className="text-right">
                <h3 className="font-semibold text-lg">Your AI Study Buddy</h3>
                <p className="text-sm text-muted-foreground">Ask questions, get explanations, anytime.</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full ml-4">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>
        </div>

      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Access Your Account
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to sign in or create an account
            </p>
          </div>
          <UserAuthForm />
        </div>
      </div>
    </div>
  );
}
