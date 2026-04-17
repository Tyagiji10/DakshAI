/**
 * Haptic Feedback Utility
 * Provides premium tactile feedback for mobile devices using the Vibration API.
 */

export const haptic = {
  /**
   * light: A subtle, premium tap (10ms)
   */
  light: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  },

  /**
   * medium: A more noticeable feedback (20ms)
   */
  medium: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(20);
    }
  },

  /**
   * error: A double pulse for warnings or errors
   */
  error: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([30, 40, 30]);
    }
  }
};

export default haptic;
