
'use client';

import { AppHeader } from '@/components/shared/app-header';
import { useAuth } from '@/contexts/auth-context';
import { useSettings } from '@/contexts/settings-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, User, LogOut, Brush, Contrast, Type } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SettingsPage() {
  const { user, loading, signOut } = useAuth();
  const { fontSize, setFontSize, highContrast, setHighContrast } = useSettings();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    router.push('/auth');
    return null;
  }
  
  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <nav className="text-sm text-muted-foreground mb-1">
                <Link href="/" className="hover:text-primary">Home</Link>
                {' / '}
                <span>Settings</span>
            </nav>
            <h1 className="text-3xl md:text-4xl font-bold font-headline text-foreground tracking-tight">
              Settings
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="text-center">
                  <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-primary/50">
                    <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} data-ai-hint="person minimalist" />
                    <AvatarFallback className="text-4xl">
                        {user.displayName ? user.displayName.charAt(0).toUpperCase() : <User />}
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle>{user.displayName || 'User'}</CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                  {!user.emailVerified && (
                     <CardDescription className="text-warning font-semibold pt-2">Email not verified</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex flex-col space-y-2">
                    {/* Placeholder for future actions */}
                    <Button variant="outline">Edit Profile</Button>
                    <Button variant="destructive" onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" /> Sign Out
                    </Button>
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center"><Brush className="mr-2 h-5 w-5 text-primary" /> Appearance</CardTitle>
                  <CardDescription>Customize the look and feel of LearnLog.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="font-size" className="flex items-center gap-2">
                        <Type className="h-5 w-5 text-muted-foreground" />
                        <span className="text-base">Font Size</span>
                    </Label>
                    <div className="flex items-center space-x-4 w-1/2 max-w-xs">
                      <Slider
                        id="font-size"
                        min={12}
                        max={24}
                        step={1}
                        value={[fontSize]}
                        onValueChange={(value) => setFontSize(value[0])}
                      />
                      <span className="w-12 text-center text-sm tabular-nums text-muted-foreground">{fontSize}px</span>
                    </div>
                  </div>
                   <div className="flex items-center justify-between">
                    <Label htmlFor="high-contrast" className="flex items-center gap-2">
                        <Contrast className="h-5 w-5 text-muted-foreground" />
                        <span className="text-base">High Contrast</span>
                    </Label>
                    <Switch
                      id="high-contrast"
                      checked={highContrast}
                      onCheckedChange={setHighContrast}
                      aria-label="Toggle high contrast mode"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
