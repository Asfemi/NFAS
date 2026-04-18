"use client";

import { motion, useReducedMotion } from "framer-motion";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.11, delayChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, damping: 17, stiffness: 290 },
  },
};

export function HomeHero() {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <section className="text-center">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-200">
          Flood Sentinel Nigeria
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Nigeria Flood Alert System
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-zinc-200">
          Timely and actionable flood advisories for grassroots communities and farmers, delivered
          in plain language and multiple local languages.
        </p>
      </section>
    );
  }

  return (
    <motion.section
      className="text-center"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.p
        className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-200"
        variants={item}
      >
        Flood Sentinel Nigeria
      </motion.p>
      <motion.h1 className="text-3xl font-bold tracking-tight sm:text-4xl" variants={item}>
        Nigeria Flood Alert System
      </motion.h1>
      <motion.p className="mx-auto mt-4 max-w-2xl text-zinc-200" variants={item}>
        Timely and actionable flood advisories for grassroots communities and farmers, delivered in
        plain language and multiple local languages.
      </motion.p>
    </motion.section>
  );
}
