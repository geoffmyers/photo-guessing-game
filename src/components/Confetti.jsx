import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CONFETTI_COLORS = [
  '#ff6b6b', // red
  '#4ecdc4', // teal
  '#ffe66d', // yellow
  '#95e1d3', // mint
  '#f38181', // coral
  '#aa96da', // purple
  '#fcbad3', // pink
  '#a8d8ea', // light blue
];

const SHAPES = ['circle', 'square', 'triangle'];

const generateConfettiPiece = (index) => {
  const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
  const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  const size = Math.random() * 10 + 6;
  const startX = Math.random() * 100;
  const endX = startX + (Math.random() - 0.5) * 40;
  const rotation = Math.random() * 720 - 360;
  const duration = Math.random() * 1.5 + 1.5;
  const delay = Math.random() * 0.3;

  return {
    id: index,
    color,
    shape,
    size,
    startX,
    endX,
    rotation,
    duration,
    delay,
  };
};

const ConfettiPiece = ({ piece }) => {
  const shapeStyles = {
    circle: { borderRadius: '50%' },
    square: { borderRadius: '2px' },
    triangle: {
      width: 0,
      height: 0,
      backgroundColor: 'transparent',
      borderLeft: `${piece.size / 2}px solid transparent`,
      borderRight: `${piece.size / 2}px solid transparent`,
      borderBottom: `${piece.size}px solid ${piece.color}`,
    },
  };

  const baseStyles = piece.shape === 'triangle'
    ? shapeStyles.triangle
    : {
        width: piece.size,
        height: piece.size,
        backgroundColor: piece.color,
        ...shapeStyles[piece.shape],
      };

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: `${piece.startX}%`,
        top: -20,
        ...baseStyles,
      }}
      initial={{
        y: 0,
        x: 0,
        rotate: 0,
        opacity: 1,
      }}
      animate={{
        y: window.innerHeight + 100,
        x: (piece.endX - piece.startX) * 10,
        rotate: piece.rotation,
        opacity: [1, 1, 0],
      }}
      transition={{
        duration: piece.duration,
        delay: piece.delay,
        ease: 'easeIn',
      }}
    />
  );
};

const Confetti = ({ active = false, count = 50 }) => {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    if (active) {
      const newPieces = Array.from({ length: count }, (_, i) => generateConfettiPiece(i));
      setPieces(newPieces);

      // Clear after animation completes
      const timer = setTimeout(() => {
        setPieces([]);
      }, 3500);

      return () => clearTimeout(timer);
    } else {
      setPieces([]);
    }
  }, [active, count]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      <AnimatePresence>
        {pieces.map((piece) => (
          <ConfettiPiece key={piece.id} piece={piece} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Confetti;
