"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

interface AnimatedGridBackgroundProps {
  imageSrc: string;
  systemName: string;
  subtitle?: string;
}

export function AnimatedGridBackground({ imageSrc, systemName, subtitle }: AnimatedGridBackgroundProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 20,
        y: (e.clientY / window.innerHeight) * 20,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-zinc-900 to-slate-900">
      {/* Animated Grid Pattern */}
      <motion.div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(251, 191, 36, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(251, 191, 36, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
        animate={{
          x: [0, 20, 0],
          y: [0, 20, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Mining Image Overlay with Parallax */}
      <motion.div
        className="absolute inset-0"
        style={{
          x: mousePosition.x,
          y: mousePosition.y,
        }}
        transition={{ type: "spring", stiffness: 50, damping: 30 }}
      >
        <div className="relative w-full h-full">
          <Image
            src={imageSrc}
            alt="Mining Operations"
            fill
            className="object-cover opacity-20"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-amber-950/40 via-zinc-900/60 to-slate-950/80" />
        </div>
      </motion.div>

      {/* Animated Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute w-96 h-96 rounded-full bg-amber-500/10 blur-3xl"
          animate={{
            x: ["-10%", "30%", "-10%"],
            y: ["-10%", "40%", "-10%"],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ top: "20%", left: "10%" }}
        />
        <motion.div
          className="absolute w-96 h-96 rounded-full bg-yellow-600/10 blur-3xl"
          animate={{
            x: ["10%", "-30%", "10%"],
            y: ["10%", "-20%", "10%"],
            scale: [1.2, 1, 1.2],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ bottom: "20%", right: "10%" }}
        />
      </div>

      {/* Mining Industry Themed Stats/Info Cards */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top Left - System Info */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="absolute top-8 left-8"
        >
          <div className="bg-gradient-to-br from-amber-500/10 to-yellow-600/5 backdrop-blur-md border border-amber-500/20 rounded-lg p-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50" />
              <div>
                <p className="text-xs text-amber-200/60 font-medium">SYSTEM STATUS</p>
                <p className="text-sm text-white font-bold">OPERATIONAL</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bottom Right - Location Info */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.7 }}
          className="absolute bottom-8 right-8"
        >
          <div className="bg-gradient-to-br from-slate-800/30 to-zinc-900/30 backdrop-blur-md border border-amber-500/20 rounded-lg p-4 shadow-xl">
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-amber-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <div>
                <p className="text-xs text-amber-200/60 font-medium">LOCATION</p>
                <p className="text-sm text-white font-bold">Zambia</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Central Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-600 rounded-2xl blur-xl opacity-20 animate-pulse" />
          <div className="relative bg-gradient-to-br from-slate-900/90 via-zinc-900/90 to-slate-900/90 backdrop-blur-xl rounded-2xl p-10 border border-amber-500/20 shadow-2xl">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-200 bg-clip-text text-transparent mb-4 tracking-tight">
                {systemName}
              </h1>
              {subtitle && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="text-lg md:text-xl text-amber-100/80 font-medium tracking-wide"
                >
                  {subtitle}
                </motion.p>
              )}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="mt-6 flex items-center justify-center gap-2 text-sm text-amber-200/60"
              >
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                <span>First Quantum Minerals</span>
                <div className="w-1 h-1 bg-amber-500/40 rounded-full" />
                <span>Zambia Operations</span>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Scanning Line Effect */}
      <motion.div
        className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-20"
        animate={{
          y: ["0%", "100%", "0%"],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
}

