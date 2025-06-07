// src/components/icons/shark-icon.tsx
import type { LucideProps } from 'lucide-react';
import React from 'react';

// This is a very simplified placeholder for the "Tubarões da Bolsa" logo.
// For the actual complex logo, it's recommended to use an <Image> component
// with the image file placed in the /public directory.
export const SharkIcon: React.FC<LucideProps> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Simplified Shark Body inspired by the logo's aggression */}
    <path d="M6 10s-2 1-2 3c0 1.66 1.34 3 3 3h11c1.66 0 3-1.34 3-3s-1-4-4-4" />
    {/* Dorsal Fin */}
    <path d="M12 16V8l3 4-3 4" /> 
    {/* Tail Fin */}
    <path d="M20 13l2-1-2-1" />
    {/* Eye - simple dot */}
    <circle cx="8.5" cy="12.5" r="0.5" fill="currentColor" />
    {/* Teeth hint - very abstract */}
    <path d="M8 14.5s0.5-0.5 1-0.5 1 0.5 1 0.5" />
  </svg>
);
