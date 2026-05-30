/**
 * Convert hex to RGB array
 */
export const hexToRgb = (hex) => {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(char => char + char).join('');
    if (c.length !== 6) return [0, 0, 0];
    return [
        parseInt(c.substring(0, 2), 16),
        parseInt(c.substring(2, 4), 16),
        parseInt(c.substring(4, 6), 16)
    ];
};

/**
 * Calculate relative luminance
 */
export const getLuminance = (r, g, b) => {
    const a = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
};

/**
 * Calculate contrast ratio between two hex colors
 */
export const getContrastRatio = (color1, color2) => {
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    
    const l1 = getLuminance(...rgb1);
    const l2 = getLuminance(...rgb2);
    
    const lightest = Math.max(l1, l2);
    const darkest = Math.min(l1, l2);
    
    return (lightest + 0.05) / (darkest + 0.05);
};

/**
 * Ensure the text color has at least 4.5:1 contrast ratio against the background.
 * If not, it will return either white or black depending on the background luminance.
 */
export const sanitizeTextColor = (textColor, backgroundColor) => {
    // If background is a gradient, we'll extract the first color to approximate or assume dark/light based on average
    let bg = backgroundColor;
    if (bg.includes('gradient') || bg.includes('rgb') || !bg.startsWith('#')) {
        // Fallback robust check for complex backgrounds (assume dark if not identifiable)
        // In this implementation, the builder passes raw hex arrays for gradients, but we'll try to extract a hex if it's a string
        const hexMatch = bg.match(/#[0-9A-Fa-f]{6}/);
        if (hexMatch) bg = hexMatch[0];
        else bg = '#000000'; // Assume dark
    }

    let text = textColor;
    if (!text.startsWith('#')) return text; // Can't easily evaluate var(--...) or rgb

    const contrast = getContrastRatio(text, bg);
    
    // WCAG AA standard for normal text is 4.5:1
    if (contrast < 4.5) {
        const bgLuminance = getLuminance(...hexToRgb(bg));
        // If background is dark, use white. If light, use black.
        return bgLuminance > 0.179 ? '#000000' : '#ffffff';
    }
    
    return text;
};
