import React, { useState, useEffect } from 'react';
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
  xs: 'w-7 h-7 min-w-[28px] min-h-[28px]',
  sm: 'w-9 h-9 min-w-[36px] min-h-[36px]',
  md: 'w-11 h-11 min-w-[44px] min-h-[44px]',
  lg: 'w-14 h-14 min-w-[56px] min-h-[56px]',
  xl: 'w-20 h-20 min-w-[80px] min-h-[80px]',
  '2xl': 'w-24 h-24 min-w-[96px] min-h-[96px]',
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
  shape = 'rounded',
  fallbackSrc = '/avatars/avatar1.svg',
  onClick,
  showScanlines = false,
  showReticle = false,
}) => {
  const [currentSrc, setCurrentSrc] = useState(() => getAssetUrl(src || fallbackSrc));
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    setCurrentSrc(getAssetUrl(src || fallbackSrc));
    setHasFailed(false);
  }, [src, fallbackSrc]);

  const borderStyles = {
    mint: 'border border-[#5DF8D8]/50 shadow-[0_0_12px_rgba(93,248,216,0.3)]',
    magenta: 'border border-[#F62477]/60 shadow-[0_0_14px_rgba(246,36,119,0.4)]',
    dual: 'border-t-2 border-r border-t-[#5DF8D8] border-r-[#5DF8D8]/50 border-b-2 border-l border-b-[#F62477] border-l-[#F62477]/50 shadow-[0_0_14px_rgba(93,248,216,0.25)]',
    subtle: 'border border-[#2F2F2D]',
  }[neonBorder];

  const shapeStyles = {
    chamfer: 'rounded-xl',
    rounded: 'rounded-xl',
    circle: 'rounded-full',
  }[shape];

  const handleError = () => {
    if (!hasFailed) {
      setHasFailed(true);
      // If currentSrc contained /2077/, try without /2077/
      if (currentSrc.includes('/2077/')) {
        setCurrentSrc(currentSrc.replace('/2077/', '/'));
      } else if (!currentSrc.includes('/2077/') && !currentSrc.startsWith('data:')) {
        // Try with /2077/ prefix
        const clean = currentSrc.startsWith('/') ? currentSrc.slice(1) : currentSrc;
        setCurrentSrc('/2077/' + clean);
      } else {
        setCurrentSrc(getAssetUrl(fallbackSrc));
      }
    }
  };

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden bg-[#161615] ${SIZE_CLASSES[size]} ${shapeStyles} ${borderStyles} ${
        onClick ? 'cursor-pointer hover:scale-105 active:scale-95 transition-all' : ''
      } ${className}`}
    >
      {/* 1. Underlying Portrait Image */}
      <img
        src={currentSrc}
        alt={alt}
        className="w-full h-full object-cover select-none"
        onError={handleError}
        loading="eager"
      />

      {/* 2. CRT / Holographic Scanline Overlay (subtle) */}
      {showScanlines && (
        <div
          className="absolute inset-0 pointer-events-none opacity-25"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.3) 1px, transparent 1px, transparent 3px)',
          }}
        />
      )}

      {/* 3. Tech Corner Reticle / HUD Brackets */}
      {showReticle && (
        <>
          <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 border-t border-r border-[#5DF8D8] pointer-events-none" />
          <span className="absolute bottom-0.5 left-0.5 w-1.5 h-1.5 border-b border-l border-[#F62477] pointer-events-none" />
        </>
      )}

      {/* 4. Online Status Pip */}
      {showOnlineBadge && typeof isOnline === 'boolean' && (
        <span
          className={`absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-[#0D0D0C] ${
            isOnline ? 'bg-[#5DF8D8] shadow-[0_0_6px_#5DF8D8]' : 'bg-[#4A4A46]'
          }`}
        />
      )}
    </div>
  );
};
