'use client';

import { useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LIAChatWidget } from './LIAChatWidget';
import Image from 'next/image';
import { useARIA } from '@/contexts/ARIAContext';

// SOFIA Design System Colors
const COLORS = {
  primary: '#0A2540',
  accent: '#00D4B3',
  success: '#10B981',
  bgSecondary: '#1E2329',
  white: '#FFFFFF',
};

interface LIAFloatingButtonProps {
  userName?: string;
  userRole?: string;
  userId?: string;
  teamId?: string;
}

export function LIAFloatingButton({ userName, userRole, userId, teamId }: LIAFloatingButtonProps) {
  const { isOpen, toggleARIA, closeARIA } = useARIA();
  
  const isHoveringRef = useRef(false);
  const velocityRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const rotationRef = useRef(0);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const SPIN_SPEED = 720;
  const FRICTION = 0.85;
  const STOP_THRESHOLD = 10;

  const animate = useCallback((currentTime: number) => {
    const deltaTime = (currentTime - lastTimeRef.current) / 1000;
    lastTimeRef.current = currentTime;

    if (isHoveringRef.current) {
      velocityRef.current = SPIN_SPEED;
      rotationRef.current += velocityRef.current * deltaTime;
      if (buttonRef.current) {
        const logoDiv = buttonRef.current.querySelector('.aria-logo') as HTMLElement;
        if (logoDiv) logoDiv.style.transform = `rotate(${rotationRef.current}deg)`;
      }
      animationRef.current = requestAnimationFrame(animate);
    } else if (velocityRef.current > STOP_THRESHOLD) {
      velocityRef.current *= FRICTION;
      rotationRef.current += velocityRef.current * deltaTime;
      if (buttonRef.current) {
        const logoDiv = buttonRef.current.querySelector('.aria-logo') as HTMLElement;
        if (logoDiv) logoDiv.style.transform = `rotate(${rotationRef.current}deg)`;
      }
      animationRef.current = requestAnimationFrame(animate);
    } else {
      velocityRef.current = 0;
      animationRef.current = null;
    }
  }, []);

  const startAnimation = useCallback(() => {
    if (animationRef.current === null) {
      lastTimeRef.current = performance.now();
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [animate]);

  const handleMouseEnter = () => {
    isHoveringRef.current = true;
    startAnimation();
  };

  const handleMouseLeave = () => {
    isHoveringRef.current = false;
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Floating Button - Hidden when panel is open */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            ref={buttonRef}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleARIA}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="fixed bottom-6 right-6 z-[60] w-14 h-14 flex items-center justify-center cursor-pointer rounded-2xl"
            style={{
              background: `linear-gradient(135deg, ${COLORS.accent} 0%, #0A8F7A 100%)`,
              boxShadow: `0 4px 20px ${COLORS.accent}50, 0 0 0 2px ${COLORS.accent}30`,
            }}
          >
            <div className="aria-logo">
              <Image 
                src="/Logo.png" 
                alt="ARIA" 
                width={32} 
                height={32}
                style={{ 
                  objectFit: 'contain',
                  filter: 'brightness(0) invert(1)', // Logo en blanco
                }}
              />
            </div>

            {/* Online indicator */}
            <span 
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full"
              style={{ 
                backgroundColor: COLORS.success,
                border: `3px solid ${COLORS.primary}`,
                boxShadow: `0 0 8px ${COLORS.success}`,
              }}
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <LIAChatWidget 
        isOpen={isOpen} 
        onClose={closeARIA}
        userName={userName}
        userRole={userRole}
        userId={userId}
        teamId={teamId}
      />
    </>
  );
}

export default LIAFloatingButton;
