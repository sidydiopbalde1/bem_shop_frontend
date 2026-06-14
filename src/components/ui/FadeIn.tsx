'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

type Direction = 'up' | 'down' | 'left' | 'right';

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  direction?: Direction;
  duration?: number;
  className?: string;
  once?: boolean;
}

const directionOffset: Record<Direction, { x?: number; y?: number }> = {
  up:    { y: 24 },
  down:  { y: -24 },
  left:  { x: 24 },
  right: { x: -24 },
};

const EASE = [0.22, 1, 0.36, 1] as const;

export default function FadeIn({
  children,
  delay = 0,
  direction = 'up',
  duration = 0.6,
  className,
  once = true,
}: FadeInProps) {
  const shouldReduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={shouldReduce ? { opacity: 1 } : { opacity: 0, ...directionOffset[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, margin: '-100px' }}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
