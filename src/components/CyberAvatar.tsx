import React from 'react';
import { getAssetUrl } from '../utils/assets';

interface CyberAvatarProps {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'custom';
  className?: string;
  isOnline?: boolean;
  showOnlineBadge?: boolean;
  neonBorder?: 'mint' | 'magenta' | 'dual' | 'subtle';
  shape?: 'chamfer' | 'rounded' | 'circle';
  fallbackSrc?: string;
  onClick?: () => void;
  showScanlines?: boolean;
  showReticle?: boolean;
}

const SIZE_CLASSES = {
  xs: 'w-7 h-7',
  sm: 'w-9 h-9',
  md: 'w-11 h-11',
  lg: 'w-14 h-14',
  xl: 'w-20 h-20',
  '2xl': 'w-24 h-24',
  custom: '',
};

export const CyberAvatar: React.FC<CyberAvatarProps> = ({
  src,
  alt = '2077 Agent',
  size = 'md',
  className = '',
  isOnline,
  showOnlineBadge = false,
  neonBorder = 'mint',
  shape = 'chamfer',
  fallbackSrc = '/avatars/avatar1.svg',
  onClick,
  showScanlines = true,
  showReticle = false,
}) => {
  const resolvedSrc = getAssetUrl(src || fallbackSrc);
  const resolvedFallback = getAssetUrl(fallbackSrc);

  const borderStyles = {
    mint: 'border border-[#5DF8D8]/40 shadow-[0_0_12px_rgba(93,248,216,0.25)]',
    magenta: 'border border-[#F62477]/50 shadow-[0_0_14px_rgba(246,36,119,0.35)]',
    dual: 'border-t-2 border-r border-t-[#5DF8D8] border-r-[#5DF8D8]/50 border-b-2 border-l border-b-[#F62477] border-l-[#F62477]/50 shadow-[0_0_14px_rgba(93,248,216,0.2)]',
    subtle: 'border border-[#2F2F2D]',
  }[neonBorder];

  const shapeStyles = {
    chamfer: '[clip-path:polygon(6px_0,100%_0,100%_calc(100%-6px),calc(100%-6px)_100%,0_100%,0_6px)] rounded-md',
    rounded: 'rounded-xl',
    circle: 'rounded-full',
  }[shape];

  return (
    <div
      onClick={onClick}
      className={`relative inline-block shrink-0 overflow-hidden bg-[#121211] ${SIZE_CLASSES[size]} ${shapeStyles} ${borderStyles} ${
        onClick ? 'cursor-pointer hover:scale-105 active:scale-95 transition-all' : ''
      } ${className}`}
    >
      {/* 1. Underlying Portrait Image with Cyberpunk Color Grading */}
      <img
        src={resolvedSrc}
        alt={alt}
        className="w-full h-full object-cover select-none filter contrast-[1.18] saturate-[1.24] brightness-[0.96]"
        onError={(e) => {
          (e.target as HTMLImageElement).src = resolvedFallback;
        }}
      />

      {/* 2. Cyberpunk Dual-Tone Lighting Overlay (Neon Magenta -> Neon Mint) */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#F62477]/15 via-transparent to-[#5DF8D8]/18 mix-blend-color-dodge pointer-events-none" />

      {/* 3. CRT / Holographic Scanline Overlay */}
      {showScanlines && (
        <div
          className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.3) 1.5px, transparent 1.5px, transparent 3px)',
          }}
        />
      )}

      {/* 4. Cinematic Dark Edge Vignette */}
      <div className="absolute inset-0 shadow-[inset_0_0_10px_rgba(0,0,0,0.7)] pointer-events-none" />

      {/* 5. Optional Tech Corner Reticle / HUD Brackets */}
      {showReticle && (
        <>
          <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 border-t border-r border-[#5DF8D8] pointer-events-none" />
          <span className="absolute bottom-0.5 left-0.5 w-1.5 h-1.5 border-b border-l border-[#F62477] pointer-events-none" />
        </>
      )}

      {/* 6. Online Status Pip */}
      {showOnlineBadge && typeof isOnline === 'boolean' && (
        <span
          className={`absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full ring-1 ring-[#0D0D0C] ${
            isOnline ? 'bg-[#5DF8D8] shadow-[0_0_6px_#5DF8D8]' : 'bg-[#4A4A46]'
          }`}
        />
      )}
    </div>
  );
};
