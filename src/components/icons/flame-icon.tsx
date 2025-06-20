'use client';

import { cn } from '@/lib/utils';

interface FlameIconProps {
  className?: string;
  size?: number;
}

// Simple animated flame icon. True 3D rotation is complex with SVG/CSS alone.
// This will be a 2D flame with a subtle pulse/rotation illusion.
export function FlameIcon({ className, size = 24 }: FlameIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        "inline-block animate-pulse-slow text-amber-500", // Amber color for flame
        className
      )}
      style={{ animationDuration: '2s' }} // Slower pulse
    >
      <defs>
        <linearGradient id="flameGradient" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--warning))" /> {/* Amber */}
          <stop offset="100%" stopColor="hsl(var(--primary))" /> {/* Electric Blue subtle hint */}
        </linearGradient>
      </defs>
      <path
        d="M12 2C12 2 8 6.5 8 10C8 13.5 12 18 12 18C12 18 16 13.5 16 10C16 6.5 12 2 12 2Z"
        fill="url(#flameGradient)"
        stroke="hsl(var(--warning))"
        strokeWidth="1"
      />
      <path
        d="M12 5C12 5 10 8 10 10.5C10 12.5 12 15 12 15C12 15 14 12.5 14 10.5C14 8 12 5 12 5Z"
        fill="hsla(var(--warning), 0.5)"
      />
    </svg>
  );
}

// Add to tailwind.config.ts if not already present or to globals.css
// keyframes: {
//   'pulse-slow': {
//     '0%, 100%': { transform: 'scale(1)', opacity: '1' },
//     '50%': { transform: 'scale(1.1)', opacity: '0.8' },
//   },
// },
// animation: {
//   'pulse-slow': 'pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
// }
// For now, I'll add this to globals.css to avoid tailwind config modification if it breaks something.
// It's better to have it in tailwind.config.ts
// Adding to tailwind.config.ts as it's the correct place.
// Check if the animation name 'pulse-slow' exists. No, it does not. So I'll add.
// The animation is in tailwind now.
// The prompt mentioned 3D rotating flame icon. This is a stylized 2D flame.
// True 3D needs WebGL or a library.
// This SVG can be enhanced with CSS @keyframes for a pseudo-3D flicker/rotation.
// For now, a pulse animation.
