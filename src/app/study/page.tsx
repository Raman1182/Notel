
// This file is effectively deprecated and replaced by src/app/study/[sessionId]/page.tsx
// It can be deleted or kept for reference.
// For now, I will clear its content to avoid confusion or accidental usage.
// If you need to redirect from /study to /study/launch, that logic would go here or in middleware.

// For now, let's make it a simple redirect to the launch page.
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OldStudyPageRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/study/launch');
  }, [router]);

  return (
    <div className="flex flex-col h-screen bg-[#0A0A0A] text-foreground items-center justify-center">
      <p>Redirecting to study session launcher...</p>
    </div>
  );
}
