/**
 * Haptic Feedback Utility
 * Provides premium tactile feedback for mobile devices using the Vibration API.
 */

let hapticsEnabled = localStorage.getItem('daksh_haptics_enabled') !== 'false';

const triggerVisual = (type) => {
  if (typeof document === 'undefined' || !hapticsEnabled) return;
  const className = `haptic-${type}`;
  document.body.classList.remove('haptic-light', 'haptic-medium', 'haptic-error');
  // Force reflow
  void document.body.offsetWidth;
  document.body.classList.add(className);
  setTimeout(() => document.body.classList.remove(className), 200);
};

export const haptic = {
  setEnabled: (enabled) => {
    hapticsEnabled = enabled;
    localStorage.setItem('daksh_haptics_enabled', enabled);
  },
  
  isEnabled: () => hapticsEnabled,

  light: () => {
    if (!hapticsEnabled) return;
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(35);
    }
    triggerVisual('light');
    window.dispatchEvent(new CustomEvent('daksh_haptic_light'));
  },

  medium: () => {
    if (!hapticsEnabled) return;
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(65);
    }
    triggerVisual('medium');
    window.dispatchEvent(new CustomEvent('daksh_haptic_medium'));
  },

  error: () => {
    if (!hapticsEnabled) return;
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([40, 60, 40]);
    }
    triggerVisual('error');
    window.dispatchEvent(new CustomEvent('daksh_haptic_error'));
  }
};

export default haptic;
