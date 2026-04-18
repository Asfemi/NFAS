"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

type AnimatedDialogProps = {
  open: boolean;
  onClose: () => void;
  /** Value for `aria-labelledby` on the dialog panel. */
  labelledBy: string;
  maxWidthClassName?: string;
  children: ReactNode;
};

export function AnimatedDialog({
  open,
  onClose,
  labelledBy,
  maxWidthClassName = "max-w-md",
  children,
}: AnimatedDialogProps) {
  const reduce = useReducedMotion();

  const spring = reduce
    ? { duration: 0.15 }
    : {
        type: "spring" as const,
        damping: 11,
        stiffness: 340,
        mass: 0.68,
      };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="animated-dialog-root"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0.12 : 0.22 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            className={`max-h-[90vh] w-full overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-xl ${maxWidthClassName}`}
            initial={
              reduce
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.82, y: 40, rotate: -0.5 }
            }
            animate={
              reduce
                ? { opacity: 1 }
                : { opacity: 1, scale: 1, y: 0, rotate: 0 }
            }
            exit={
              reduce
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.94, y: 18, transition: { duration: 0.16 } }
            }
            transition={spring}
            onClick={(event) => event.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
