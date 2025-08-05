import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Star, Heart } from 'lucide-react';

interface ProgressCelebrationProps {
  show: boolean;
  onComplete: () => void;
  message?: string;
  type?: 'save' | 'unlock' | 'level-up';
}

export function ProgressCelebration({ 
  show, 
  onComplete, 
  message = "Avatar Created!", 
  type = 'save' 
}: ProgressCelebrationProps) {
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; delay: number; icon: React.ReactNode }>>([]);

  useEffect(() => {
    if (show) {
      // Generate confetti particles
      const particles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
        icon: getRandomIcon()
      }));
      setConfetti(particles);

      // Auto-complete after animation
      const timer = setTimeout(onComplete, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  const getRandomIcon = () => {
    const icons = [
      <Star key="star" className="w-4 h-4 text-yellow-400" />,
      <Heart key="heart" className="w-4 h-4 text-pink-400" />,
      <Sparkles key="sparkles" className="w-4 h-4 text-purple-400" />
    ];
    return icons[Math.floor(Math.random() * icons.length)];
  };

  const getCelebrationColor = () => {
    switch (type) {
      case 'unlock':
        return 'from-yellow-400 to-orange-400';
      case 'level-up':
        return 'from-purple-400 to-pink-400';
      default:
        return 'from-green-400 to-blue-400';
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
        >
          {/* Confetti Background */}
          <div className="absolute inset-0 overflow-hidden">
            {confetti.map((particle) => (
              <motion.div
                key={particle.id}
                initial={{ y: -20, x: `${particle.x}%`, rotate: 0, scale: 0 }}
                animate={{ 
                  y: window.innerHeight + 20, 
                  rotate: 360,
                  scale: [0, 1, 1, 0]
                }}
                transition={{ 
                  duration: 2,
                  delay: particle.delay,
                  ease: "easeOut"
                }}
                className="absolute"
              >
                {particle.icon}
              </motion.div>
            ))}
          </div>

          {/* Main Celebration Card */}
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ 
              scale: 1, 
              rotate: 0,
              y: [0, -10, 0]
            }}
            transition={{ 
              type: "spring",
              stiffness: 200,
              damping: 20,
              y: {
                repeat: Infinity,
                duration: 2,
                ease: "easeInOut"
              }
            }}
            className={`bg-gradient-to-r ${getCelebrationColor()} p-8 rounded-2xl shadow-2xl text-white text-center max-w-md mx-4`}
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ 
                repeat: Infinity, 
                duration: 1.5,
                ease: "easeInOut"
              }}
              className="text-6xl mb-4"
            >
              🎉
            </motion.div>

            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold mb-2"
            >
              {message}
            </motion.h2>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-sm opacity-90 mb-4"
            >
              {type === 'save' && "Your beautiful avatar has been saved!"}
              {type === 'unlock' && "New items unlocked for customization!"}
              {type === 'level-up' && "Level up! More options available!"}
            </motion.p>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
              className="flex justify-center space-x-2"
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.7, 1, 0.7]
                  }}
                  transition={{ 
                    delay: i * 0.1,
                    repeat: Infinity,
                    duration: 1.5
                  }}
                >
                  <Star className="w-4 h-4 fill-current" />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Sparkle Animations */}
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={`sparkle-${i}`}
                className="absolute"
                style={{
                  left: `${10 + (i % 4) * 25}%`,
                  top: `${20 + Math.floor(i / 4) * 60}%`
                }}
                animate={{
                  scale: [0, 1, 0],
                  rotate: [0, 180, 360],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  delay: i * 0.2,
                  repeat: Infinity,
                  duration: 2
                }}
              >
                <Sparkles className="w-6 h-6 text-yellow-300" />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ProgressCelebration;