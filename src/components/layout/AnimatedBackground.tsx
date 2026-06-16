'use client';

import { useReducedMotion } from 'framer-motion';

export default function AnimatedBackground() {
  const shouldReduce = useReducedMotion();
  if (shouldReduce) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <div className="bg-circle bg-circle-1" />
      <div className="bg-circle bg-circle-2" />
      <div className="bg-circle bg-circle-3" />
      <div className="bg-circle bg-circle-4" />
      <div className="bg-circle bg-circle-5" />
      <div className="bg-circle bg-circle-6" />
      <div className="bg-circle bg-circle-7" />
    </div>
  );
}
