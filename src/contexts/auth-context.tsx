
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  type User,
  type AuthError
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface EmailPasswordCredentials {
  email: string;
  password: string;
  displayName?: string;
}

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<User | null>;
  signUpWithEmail: (credentials: EmailPasswordCredentials) => Promise<User | string>;
  signInWithEmail: (credentials: EmailPasswordCredentials) => Promise<User | string>;
  signOut: () => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAuthError = (error: AuthError): string => {
    switch (error.code) {
      case 'auth/email-already-in-use':
        return 'This email is already registered. Please try logging in.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/weak-password':
        return 'Password is too weak. Please use at least 6 characters.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please try again.';
      default:
        console.error("Authentication error:", error);
        return 'An unexpected error occurred. Please try again later.';
    }
  };

  const signInWithGoogle = async (): Promise<User | null> => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
      return result.user;
    } catch (error) {
      console.error("Error signing in with Google:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (credentials: EmailPasswordCredentials): Promise<User | string> => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, credentials.email, credentials.password);
      
      const displayName = credentials.email.split('@')[0];
      await updateProfile(userCredential.user, { displayName: displayName });

      await sendEmailVerification(userCredential.user);
      toast({
        title: "Verification Email Sent",
        description: "Please check your inbox to verify your email address.",
      });
      setUser(userCredential.user);
      return userCredential.user;
    } catch (error) {
      return handleAuthError(error as AuthError);
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (credentials: EmailPasswordCredentials): Promise<User | string> => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      setUser(userCredential.user);
      return userCredential.user;
    } catch (error) {
      return handleAuthError(error as AuthError);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setLoading(false);
    }
  };

  const resendVerificationEmail = async (): Promise<void> => {
    if (!auth.currentUser) {
      toast({ title: "Not Logged In", description: "You must be logged in to resend a verification email.", variant: "destructive" });
      return;
    }
    try {
      await sendEmailVerification(auth.currentUser);
      toast({
        title: "Verification Email Sent",
        description: "A new verification link has been sent to your email address. Please check your inbox.",
      });
    } catch (error: any) {
      console.error("Error resending verification email:", error);
      toast({ title: "Error", description: error.message || "Could not send verification email. Please try again in a few minutes.", variant: "destructive" });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signUpWithEmail, signInWithEmail, signOut, resendVerificationEmail }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextProps {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
