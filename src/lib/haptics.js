/**
 * Haptic Feedback Utility
 * Provides premium tactile feedback for mobile devices using the Vibration API.
 */

const triggerVisual = (type) => {
  if (typeof document === 'undefined') return;
  const className = `haptic-${type}`;
  document.body.classList.remove('haptic-light', 'haptic-medium', 'haptic-error');
  // Force reflow
  void document.body.offsetWidth;
  document.body.classList.add(className);
  setTimeout(() => document.body.classList.remove(className), 200);
};

export const haptic = {
  /**
   * light: A subtle, premium tap (35ms)
   */
  light: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(35);
    }
    triggerVisual('light');
    window.dispatchEvent(new CustomEvent('daksh_haptic_light'));
  },

  /**
   * medium: A more noticeable feedback (65ms)
   */
  medium: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(65);
    }
    triggerVisual('medium');
    window.dispatchEvent(new CustomEvent('daksh_haptic_medium'));
  },

  /**
   * error: A double pulse for warnings or errors
   */
  error: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([40, 60, 40]);
    }
    triggerVisual('error');
    window.dispatchEvent(new CustomEvent('daksh_haptic_error'));
  }
};

export default haptic;
