import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PortfolioProvider } from '../context/PortfolioContext';
import BaseThemeWrapper from '../templates/BaseThemeWrapper';

export const downloadPortfolioZip = async (state) => {
    const zip = new JSZip();
    
    zip.file('index.html', generateHTML(state));
    
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `${state.personalInfo.fullName.replace(/\s+/g, '_')}_Portfolio.zip`);
};

function extractStyles() {
    let capturedCSS = '';
    try {
        for (let i = 0; i < document.styleSheets.length; i++) {
            const sheet = document.styleSheets[i];
            try {
                // Ignore cross-origin stylesheets that might throw CORS errors
                if (sheet.href && !sheet.href.startsWith(window.location.origin)) {
                    continue;
                }
                const rules = sheet.cssRules || sheet.rules;
                for (let j = 0; j < rules.length; j++) {
                    capturedCSS += rules[j].cssText + '\n';
                }
            } catch (e) {
                console.warn('Could not read css rules for', sheet.href, e);
            }
        }
    } catch (e) {
        console.error('Error extracting stylesheets:', e);
    }
    return capturedCSS;
}

function generateHTML(state) {
    const { personalInfo } = state;

    // Render the React component tree to static HTML
    // Set a flag so components know they are being rendered for export
    if (typeof window !== 'undefined') window.__IS_EXPORT__ = true;

    const appHtml = renderToStaticMarkup(
        <PortfolioProvider initialData={state}>
            <BaseThemeWrapper />
        </PortfolioProvider>
    );

    if (typeof window !== 'undefined') window.__IS_EXPORT__ = false;

    const capturedCSS = extractStyles();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light only">
    <title>${personalInfo.fullName} - Portfolio</title>
    
    <!-- 100% Offline Extracted Styles (Tailwind + App CSS) -->
    <style>
        ${capturedCSS}
    </style>

    <!-- Reset, Animations, and Base Styles -->
    <style>
        html { scroll-behavior: smooth; height: 100%; }
        body { 
            line-height: 1.5;
            -webkit-font-smoothing: antialiased;
            overflow-x: clip;
            width: 100%;
            min-height: 100%;
            margin: 0;
            padding: 0;
        }

        /* Vanilla JS Reveal State (Replaces GSAP) */
        .gs_reveal { 
            opacity: 0; 
            visibility: hidden;
            transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .gs_reveal_up { transform: translateY(50px); }
        .gs_reveal_down { transform: translateY(-50px); }
        .gs_reveal_left { transform: translateX(50px); }
        .gs_reveal_right { transform: translateX(-50px); }

        .gs_reveal.reveal-active {
            visibility: visible;
            opacity: 1;
            transform: translate(0, 0) !important;
        }

        .stagger-item {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .stagger-item.reveal-active {
            opacity: 1;
            transform: translateY(0);
        }
        
        /* Loading Spinner */
        .spinner {
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 1s ease-in-out infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        /* Form error message styles */
        #contact-error {
            background-color: rgba(239, 68, 68, 0.1);
            color: #ef4444;
            padding: 0.75rem;
            border-radius: 0.5rem;
            font-size: 0.875rem;
            border: 1px solid rgba(239, 68, 68, 0.2);
        }
        #contact-success {
            background-color: rgba(34, 197, 94, 0.1);
            color: #22c55e;
            padding: 2rem;
            border-radius: 1rem;
            text-align: center;
            border: 1px solid rgba(34, 197, 94, 0.2);
            margin-bottom: 2rem;
        }
    </style>
</head>
<body>
    ${appHtml}

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            // Vanilla JS Intersection Observer for scroll animations (replaces GSAP)
            const observerOptions = {
                root: null,
                rootMargin: '0px',
                threshold: 0.15
            };

            const observer = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('reveal-active');
                        observer.unobserve(entry.target);
                    }
                });
            }, observerOptions);

            const revealElements = document.querySelectorAll('.gs_reveal');
            revealElements.forEach(el => observer.observe(el));

            // Staggered animation for grid items
            const grids = document.querySelectorAll('.portfolio-layout-grid > section');
            grids.forEach((section) => {
                const items = section.querySelectorAll('.project-card, .skill-card, .timeline-item');
                if (items.length > 0) {
                    items.forEach((item, index) => {
                        item.classList.remove('gs_reveal');
                        item.classList.add('stagger-item');
                        item.style.transitionDelay = (index * 100) + 'ms';
                        observer.observe(item);
                    });
                }
            });

            // Navbar Scroll Effect
            const nav = document.querySelector('nav');
            if (nav) {
                const themePrimary = getComputedStyle(document.querySelector('.theme-wrapper')).getPropertyValue('--theme-primary');
                const themeText = getComputedStyle(document.querySelector('.theme-wrapper')).getPropertyValue('--theme-text');
                const isBrutal = document.querySelector('.theme-wrapper').classList.contains('theme-neo-brutal');

                window.addEventListener('scroll', () => {
                    if (window.scrollY > 20) {
                        nav.style.background = themePrimary;
                        if (!isBrutal) {
                             nav.style.background = 'color-mix(in srgb, ' + themePrimary + ' 75%, transparent)';
                             nav.style.boxShadow = '0 4px 20px -2px rgba(0,0,0,0.1)';
                        } else {
                            nav.style.borderBottom = '2px solid ' + themeText;
                        }
                    } else {
                        nav.style.background = 'transparent';
                        nav.style.boxShadow = 'none';
                        nav.style.borderBottom = '1px solid transparent';
                    }
                });
            }

            // Contact Form Submit Handler
            const form = document.querySelector('form');
            if (form) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    const submitBtn = form.querySelector('button[type="submit"]');
                    const originalBtnContent = submitBtn.innerHTML;
                    
                    submitBtn.disabled = true;
                    submitBtn.style.opacity = '0.7';
                    submitBtn.innerHTML = '<div class="spinner"></div>';
                    
                    let errorDiv = document.getElementById('contact-error');
                    if (!errorDiv) {
                        errorDiv = document.createElement('div');
                        errorDiv.id = 'contact-error';
                        errorDiv.style.display = 'none';
                        form.insertBefore(errorDiv, submitBtn);
                    }
                    errorDiv.style.display = 'none';

                    const formData = new FormData(form);

                    try {
                        const response = await fetch(form.action, {
                            method: 'POST',
                            body: formData,
                            headers: {
                                'Accept': 'application/json'
                            }
                        });

                        if (response.ok) {
                            form.reset();
                            form.style.display = 'none';
                            
                            let successDiv = document.getElementById('contact-success');
                            if (!successDiv) {
                                successDiv = document.createElement('div');
                                successDiv.id = 'contact-success';
                                successDiv.innerHTML = '<div style="color: #4ade80; font-size: 48px; margin-bottom: 16px;">✓</div><h3 style="font-size: 24px; margin-bottom: 8px; font-weight: bold;">Message Sent!</h3><p style="opacity: 0.8; margin-bottom: 24px;">Thank you for reaching out. I\\'ll get back to you as soon as possible.</p><button onclick="document.getElementById(\\'contact-success\\').style.display=\\'none\\'; document.querySelector(\\'form\\').style.display=\\'flex\\';" style="background: transparent; border: 1px solid currentColor; padding: 10px 24px; border-radius: 12px; cursor: pointer; font-weight: 600;">Send Another Message</button>';
                                form.parentNode.insertBefore(successDiv, form);
                            }
                            successDiv.style.display = 'block';
                        } else {
                            const data = await response.json().catch(() => ({}));
                            if (data && data.errors) {
                                errorDiv.textContent = data.errors.map(err => err.message).join(', ');
                            } else {
                                errorDiv.textContent = 'Unable to send message. Please try again later.';
                            }
                            errorDiv.style.display = 'block';
                        }
                    } catch (error) {
                        errorDiv.textContent = 'Unable to send message. Please try again later.';
                        errorDiv.style.display = 'block';
                    } finally {
                        submitBtn.disabled = false;
                        submitBtn.style.opacity = '1';
                        submitBtn.innerHTML = originalBtnContent;
                    }
                });
            }
        });
    </script>
</body>
</html>`;
}
