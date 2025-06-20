'use client';

import { UserAuthForm } from '@/components/auth/user-auth-form';
import { Sparkles } from 'lucide-react';
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
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;This app has transformed my study habits. The focus tools and AI insights are game-changers.&rdquo;
            </p>
            <footer className="text-sm">Fictional User</footer>
          </blockquote>
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
