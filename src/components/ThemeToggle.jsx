import React from 'react';
import './ThemeToggle.css';
import { Sun, Moon } from 'lucide-react';
import { haptic } from '../lib/haptics';

const ThemeToggle = ({ theme, toggleTheme, className = '' }) => {
    const isDark = theme === 'dark';

    const handleToggle = () => {
        haptic.light();
        toggleTheme();
    };

    return (
        <div className={`theme-toggle-wrapper ${className}`}>
            <button
                className={`theme-toggle-container ${isDark ? 'dark' : 'light'}`}
                onClick={handleToggle}
                aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
                {/* Text depending on mode */}
                {isDark ? (
                    <div className="theme-toggle-text dark">
                        <span>Dark</span>
                        <span>Mode</span>
                    </div>
                ) : (
                    <div className="theme-toggle-text light">
                        <span>Light</span>
                        <span>Mode</span>
                    </div>
                )}

                {/* Knob */}
                <div className="theme-toggle-knob">
                    {isDark ? <Moon size="1.2em" strokeWidth={2.5} /> : <Sun size="1.2em" strokeWidth={2.5} />}
                </div>
            </button>
        </div>
    );
};

export default ThemeToggle;
