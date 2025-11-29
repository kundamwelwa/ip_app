"use client";

import Image from "next/image";

interface MosaicBackgroundProps {
  imageSrc: string;
  systemName: string;
  subtitle?: string;
}

// Pre-generated stable transforms (same on every render)
const STABLE_TRANSFORMS = [
  { rotation: 2.34, scale: 1.05 },
  { rotation: -3.12, scale: 0.92 },
  { rotation: 1.56, scale: 1.18 },
  { rotation: -1.89, scale: 0.87 },
  { rotation: 4.21, scale: 1.12 },
  { rotation: -2.67, scale: 0.95 },
  { rotation: 0.93, scale: 1.08 },
  { rotation: 3.45, scale: 0.91 },
  { rotation: -4.12, scale: 1.15 },
  { rotation: 2.78, scale: 0.88 },
  { rotation: -0.45, scale: 1.09 },
  { rotation: 1.23, scale: 0.97 },
  { rotation: -3.56, scale: 1.14 },
  { rotation: 4.67, scale: 0.84 },
  { rotation: 0.12, scale: 1.06 },
  { rotation: -2.34, scale: 0.93 },
  { rotation: 3.89, scale: 1.11 },
  { rotation: -1.67, scale: 0.89 },
  { rotation: 2.01, scale: 1.16 },
  { rotation: -4.45, scale: 0.96 },
  { rotation: 1.78, scale: 1.02 },
  { rotation: -0.89, scale: 0.85 },
  { rotation: 3.23, scale: 1.13 },
  { rotation: -2.12, scale: 0.94 },
];

export function MosaicBackground({ imageSrc, systemName, subtitle }: MosaicBackgroundProps) {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Mosaic Background */}
      <div className="absolute inset-0 grid grid-cols-4 grid-rows-6 gap-1 opacity-30">
        {STABLE_TRANSFORMS.map((transform, index) => (
          <div
            key={index}
            className="relative overflow-hidden rounded-sm"
            style={{
              transform: `rotate(${transform.rotation}deg) scale(${transform.scale})`,
              minHeight: '100px', // Ensure minimum height for image
            }}
          >
            <Image
              src={imageSrc}
              alt=""
              fill
              className="object-cover blur-sm"
              sizes="25vw"
              priority={index < 4}
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
