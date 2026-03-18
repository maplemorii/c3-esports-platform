'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

type DestructiveButtonProps = HTMLMotionProps<"button">;

export function DestructiveButton({
  className,
  children,
  ...props
}: DestructiveButtonProps) {
  return (
    <motion.button
      className={cn(
        "relative font-mono text-sm",
        "text-neutral-500 dark:text-neutral-400",
        "hover:text-red-500/90 dark:hover:text-red-400/90",
        "transition-all duration-300",
        className
      )}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      variants={{
        tap: {
          scale: 0.98,
          transition: { duration: 0.1, ease: [0.23, 1, 0.32, 1] }
        }
      }}
      {...props}
    >
      <span className="relative inline-flex flex-col items-center gap-1">
        <motion.span
          className="relative z-10 inline-block"
          variants={{
            initial: { x: 0, letterSpacing: "0em" },
            hover: {
              x: [0, -1.5, 1.5, -1.5, 0],
              letterSpacing: "0.02em",
              transition: {
                x: { duration: 0.15, repeat: 2, repeatType: "mirror", ease: "linear" },
                letterSpacing: { duration: 0.3, ease: [0.23, 1, 0.32, 1] }
              }
            }
          }}
        >
          {children}
        </motion.span>

        <div className="relative w-full h-[1px]">
          <div className="absolute inset-0 h-full bg-neutral-200 dark:bg-neutral-800" />
          <motion.div
            className="absolute inset-y-0 left-1/2 w-0 h-full bg-red-500/90 dark:bg-red-400/90"
            variants={{
              initial: { width: "0%", left: "50%", opacity: 0.6 },
              hover: {
                width: "100%",
                left: "0%",
                opacity: 1,
                transition: { duration: 0.35, ease: [0.23, 1, 0.32, 1] }
              }
            }}
          />
        </div>
      </span>
    </motion.button>
  );
}
