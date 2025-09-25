"use client";

import Image from "next/image";

interface MosaicBackgroundProps {
  imageSrc: string;
  systemName: string;
  subtitle?: string;
}

export function MosaicBackground({ imageSrc, systemName, subtitle }: MosaicBackgroundProps) {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Mosaic Background */}
      <div className="absolute inset-0 grid grid-cols-4 grid-rows-6 gap-1 opacity-30">
        {Array.from({ length: 24 }).map((_, index) => (
          <div
            key={index}
            className="relative overflow-hidden rounded-sm"
            style={{
              transform: `rotate(${Math.random() * 10 - 5}deg) scale(${0.8 + Math.random() * 0.4})`,
            }}
          >
            <Image
              src={imageSrc}
              alt=""
              fill
              className="object-cover blur-sm"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        ))}
      </div>
      
      {/* Blur Overlay */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
      
      {/* System Name Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
            {systemName}
          </h1>
          {subtitle && (
            <p className="text-lg md:text-xl text-white/90 font-medium tracking-wide">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
