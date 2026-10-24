import React, { forwardRef } from 'react';
import { motion } from 'motion/react';

/**
 * Reusable MotionButton component powered by `motion/react`.
 * Provides micro-interactions (spring hover scale, press feedback, active state)
 * with graceful fallback when disabled.
 */
export const MotionButton = forwardRef(function MotionButton(
  {
    children,
    whileHover,
    whileTap,
    transition,
    disabled = false,
    className = '',
    style = {},
    type = 'button',
    onClick,
    ...props
  },
  ref
) {
  // Do not animate if disabled
  const hoverAnimation = disabled
    ? undefined
    : whileHover === false || whileHover === null
    ? undefined
    : whileHover ?? { scale: 1.025, y: -0.5 };

  const tapAnimation = disabled
    ? undefined
    : whileTap === false || whileTap === null
    ? undefined
    : whileTap ?? { scale: 0.97, y: 0 };

  const springTransition = transition ?? {
    type: 'spring',
    stiffness: 500,
    damping: 28,
    mass: 0.6
  };

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled}
      onClick={onClick}
      whileHover={hoverAnimation}
      whileTap={tapAnimation}
      transition={springTransition}
      className={className}
      style={{
        ...style,
        cursor: disabled ? 'not-allowed' : (style?.cursor || 'pointer'),
        WebkitTapHighlightColor: 'transparent'
      }}
      {...props}
    >
      {children}
    </motion.button>
  );
});

export default MotionButton;
