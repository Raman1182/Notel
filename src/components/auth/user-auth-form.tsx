
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle } from 'lucide-react';
import { Separator } from '../ui/separator';

const authSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters long." }),
});

type FormData = z.infer<typeof authSchema>;

export function UserAuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState<null | 'email' | 'google'>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(authSchema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading('email');
    setError(null);
    let result;
    try {
      if (isLogin) {
        result = await signInWithEmail(data);
      } else {
        result = await signUpWithEmail(data);
      }
      
      if (typeof result === 'string') {
        setError(result);
      } else {
        router.push('/');
        toast({
          title: isLogin ? "Login Successful" : "Account Created",
          description: isLogin ? "Welcome back!" : "Please check your email to verify your account.",
        });
      }
    } catch (e: any) {
        setError(e.message || "An unexpected error occurred.");
    } finally {
        setIsLoading(null);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading('google');
    setError(null);
    try {
      const user = await signInWithGoogle();
      if (user) {
          router.push('/');
          toast({
              title: "Sign In Successful",
              description: "Welcome!",
          });
      } else {
          setError("Google Sign-In failed. Please try again.");
      }
    } catch (e: any) {
        setError(e.message || "An unexpected error occurred with Google Sign-In.");
    } finally {
        setIsLoading(null);
    }
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={!!isLoading}
              suppressHydrationWarning
              {...register('email')}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              disabled={!!isLoading}
              {...register('password')}
            />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
          {error && (
            <div className="flex items-center p-2 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
              <AlertCircle className="h-4 w-4 mr-2" />
              {error}
            </div>
          )}
          <Button disabled={!!isLoading} className="w-full">
            {isLoading === 'email' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLogin ? 'Sign In' : 'Create Account'}
          </Button>
        </div>
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <Button variant="outline" type="button" disabled={!!isLoading} onClick={handleGoogleSignIn}>
        {isLoading === 'google' ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
            <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 21.5 173.5 56.5l-68.2 68.2C314.5 98.2 282.7 80 248 80c-81.6 0-148.2 66.6-148.2 148.2s66.6 148.2 148.2 148.2c87.7 0 129.2-61.2 134-94.2H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
          </svg>
        )}
        Google
      </Button>
      <p className="px-8 text-center text-sm text-muted-foreground">
        By clicking continue, you agree to our{' '}
        <a href="/terms" className="underline underline-offset-4 hover:text-primary">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="/privacy" className="underline underline-offset-4 hover:text-primary">
          Privacy Policy
        </a>
        .
      </p>
      <Separator />
      <Button variant="link" onClick={() => { setIsLogin(!isLogin); setError(null); }}>
        {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
      </Button>
    </div>
  );
}
