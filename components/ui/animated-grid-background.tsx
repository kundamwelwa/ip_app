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


      {/* Central Content - Premium Liquid Glass Morphism */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative"
          style={{
            transform: `perspective(1000px) rotateX(${mousePosition.y * 0.05}deg) rotateY(${mousePosition.x * 0.05}deg)`,
          }}
        >
          {/* Outer glow layers - multiple for depth */}
          <motion.div
            className="absolute -inset-1 bg-gradient-to-r from-amber-400/30 via-yellow-500/30 to-amber-400/30 rounded-[2rem] blur-3xl opacity-70"
            animate={{
              opacity: [0.5, 0.8, 0.5],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute -inset-2 bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-yellow-500/20 rounded-[2.5rem] blur-[60px] opacity-50"
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          
          {/* Main glass container */}
          <div className="relative bg-gradient-to-br from-white/[0.15] via-white/[0.08] to-white/[0.03] backdrop-blur-[40px] rounded-[2rem] p-12 border border-white/30 shadow-[0_8px_32px_0_rgba(0,0,0,0.37),inset_0_1px_1px_0_rgba(255,255,255,0.2)] overflow-hidden">
            {/* Animated light sweep */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{
                x: ["-200%", "200%"],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{
                transform: "skewX(-20deg)",
              }}
            />
            
            {/* Top highlight - glass reflection */}
            <div className="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-white/30 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
            
            {/* Side highlights for 3D effect */}
            <div className="absolute top-0 left-0 w-[30%] h-full bg-gradient-to-r from-white/15 to-transparent rounded-l-[2rem] pointer-events-none" />
            <div className="absolute top-0 right-0 w-[30%] h-full bg-gradient-to-l from-white/10 to-transparent rounded-r-[2rem] pointer-events-none" />
            
            {/* Bottom shadow gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-gradient-to-t from-black/20 via-transparent to-transparent rounded-b-[2rem] pointer-events-none" />
            
            {/* Inner color glow layers */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-yellow-500/10 rounded-[2rem] pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber-400/5 to-yellow-400/5 rounded-[2rem] pointer-events-none" />
            
            {/* Animated shimmer particles */}
            <motion.div
              className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/40 rounded-full blur-sm"
              animate={{
                opacity: [0, 1, 0],
                scale: [0.5, 1.5, 0.5],
                x: [0, 100, 0],
                y: [0, 50, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-amber-300/50 rounded-full blur-sm"
              animate={{
                opacity: [0, 1, 0],
                scale: [0.5, 2, 0.5],
                x: [0, -80, 0],
                y: [0, 60, 0],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
            />
            
            {/* Content with enhanced styling */}
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative z-10"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-200 bg-clip-text text-transparent mb-4 tracking-tight drop-shadow-[0_4px_12px_rgba(251,191,36,0.5)]">
                {systemName}
              </h1>
              {subtitle && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="text-lg md:text-xl text-amber-100/95 font-medium tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
                >
                  {subtitle}
                </motion.p>
              )}
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

