import { motion, Variants } from "framer-motion";
import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.4, 0.25, 1] as const,
      when: "beforeChildren" as const,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.4, 0.25, 1] as const,
    },
  },
};

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial="initial"
      animate="enter"
      exit="exit"
      variants={pageVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Fade only transition (for modals, overlays)
const fadeVariants: Variants = {
  initial: { opacity: 0 },
  enter: { 
    opacity: 1,
    transition: { duration: 0.3 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2 }
  },
};

export function FadeTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial="initial"
      animate="enter"
      exit="exit"
      variants={fadeVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Slide from right (for side panels, drawers)
const slideVariants: Variants = {
  initial: { 
    opacity: 0, 
    x: 100 
  },
  enter: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.4, 0.25, 1] as const,
    }
  },
  exit: { 
    opacity: 0, 
    x: 100,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.4, 0.25, 1] as const,
    }
  },
};

export function SlideTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial="initial"
      animate="enter"
      exit="exit"
      variants={slideVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Scale transition (for cards, popups)
const scaleVariants: Variants = {
  initial: { 
    opacity: 0, 
    scale: 0.95 
  },
  enter: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.4, 0.25, 1] as const,
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.4, 0.25, 1] as const,
    }
  },
};

export function ScaleTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial="initial"
      animate="enter"
      exit="exit"
      variants={scaleVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}
