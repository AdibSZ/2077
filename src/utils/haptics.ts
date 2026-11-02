// Mobile Haptic Feedback utility for SYS.2077 Arcade

export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'light') {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      switch (type) {
        case 'light':
          navigator.vibrate(15);
          break;
        case 'medium':
          navigator.vibrate(35);
          break;
        case 'heavy':
          navigator.vibrate(60);
          break;
        case 'success':
          navigator.vibrate([20, 40, 30]);
          break;
        case 'error':
          navigator.vibrate([50, 60, 50]);
          break;
      }
    } catch {
      // Haptics fail gracefully if unsupported or disabled
    }
  }
}
