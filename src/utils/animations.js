// Framer Motion animation variants for the photo guessing game

export const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, y: 20 }
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0 }
};

export const bounceIn = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      damping: 12,
      stiffness: 200,
      duration: 0.5
    }
  },
  exit: { scale: 0.8, opacity: 0 }
};

export const slideUp = {
  hidden: { transform: 'translateY(100px)', opacity: 0 },
  visible: {
    transform: 'translateY(0)',
    opacity: 1,
    transition: { duration: 0.6, ease: 'easeOut' }
  }
};

export const shake = {
  animate: {
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.5, ease: 'easeInOut' }
  }
};

export const pulse = {
  animate: {
    scale: [1, 1.05, 1],
    transition: { duration: 1.5, repeat: Infinity }
  }
};

export const correctGuess = {
  initial: { scale: 0.8, opacity: 0 },
  animate: {
    scale: [0.8, 1.2, 1],
    opacity: 1,
    transition: { type: 'spring', damping: 10 }
  }
};

export const incorrectGuess = {
  animate: {
    x: [-10, 10, -10, 10, 0],
    transition: { duration: 0.4 }
  }
};

export const pointsFloat = {
  initial: { y: 0, opacity: 1, scale: 1 },
  animate: {
    y: -60,
    opacity: 0,
    scale: 1.5,
    transition: { duration: 1, ease: 'easeOut' }
  }
};

export const staggerContainer = {
  visible: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

export const staggerItem = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', damping: 15 }
  }
};

export const photoReveal = {
  hidden: { opacity: 0, scale: 0.9, rotateY: -10 },
  visible: {
    opacity: 1,
    scale: 1,
    rotateY: 0,
    transition: { duration: 0.5, ease: 'easeOut' }
  }
};

export const victoryBounce = {
  animate: {
    y: [0, -20, 0],
    transition: { duration: 0.6, repeat: Infinity, repeatType: 'loop' }
  }
};
