import fs from 'fs';
import path from 'path';

const outDir = path.join(import.meta.dirname, 'public', 'brand');
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

// Reusable SVG fragments
const defs = `
  <defs>
    <linearGradient id="gradPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366f1" />
      <stop offset="100%" stop-color="#4f46e5" />
    </linearGradient>
    <linearGradient id="gradSecondary" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8b5cf6" />
      <stop offset="100%" stop-color="#c084fc" />
    </linearGradient>
    <linearGradient id="gradAI" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#3b82f6" />
      <stop offset="100%" stop-color="#8b5cf6" />
    </linearGradient>
    <linearGradient id="appBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0e1a" />
      <stop offset="100%" stop-color="#1e1b4b" />
    </linearGradient>
    <style>
      .text-daksh-dark { font-family: 'Inter', system-ui, sans-serif; font-weight: 800; font-size: 32px; fill: #ffffff; letter-spacing: -0.5px; }
      .text-daksh-light { font-family: 'Inter', system-ui, sans-serif; font-weight: 800; font-size: 32px; fill: #0f172a; letter-spacing: -0.5px; }
      .text-ai { font-family: 'Inter', system-ui, sans-serif; font-weight: 800; font-size: 32px; fill: url(#gradAI); }
      .text-daksh-stacked-dark { font-family: 'Inter', system-ui, sans-serif; font-weight: 800; font-size: 24px; fill: #ffffff; letter-spacing: -0.5px; }
      .text-daksh-stacked-light { font-family: 'Inter', system-ui, sans-serif; font-weight: 800; font-size: 24px; fill: #0f172a; letter-spacing: -0.5px; }
      .text-ai-stacked { font-family: 'Inter', system-ui, sans-serif; font-weight: 800; font-size: 24px; fill: url(#gradAI); }
    </style>
  </defs>
`;

const iconPaths = `
  <g transform="translate(15, 15) scale(0.7)">
    <rect x="25" y="15" width="16" height="70" rx="8" fill="url(#gradPrimary)" />
    <path d="M30 15 h30 a35 35 0 0 1 35 35 a35 35 0 0 1 -35 35 h-30 v-16 h30 a19 19 0 0 0 19 -19 a19 19 0 0 0 -19 -19 h-30 z" fill="url(#gradSecondary)" />
  </g>
`;

// 1. Icon Only / Monogram / Favicon
const iconSvg = `<svg viewBox="0 0 100 100" width="512" height="512" xmlns="http://www.w3.org/2000/svg">${defs}${iconPaths}</svg>`;

// 2. Horizontal Light Theme
const horizontalLight = `<svg viewBox="0 0 300 100" width="300" height="100" xmlns="http://www.w3.org/2000/svg">
  ${defs}
  ${iconPaths}
  <text x="100" y="62" class="text-daksh-light">Daksh</text>
  <text x="200" y="62" class="text-ai">.AI</text>
</svg>`;

// 3. Horizontal Dark Theme
const horizontalDark = `<svg viewBox="0 0 300 100" width="300" height="100" xmlns="http://www.w3.org/2000/svg">
  ${defs}
  ${iconPaths}
  <text x="100" y="62" class="text-daksh-dark">Daksh</text>
  <text x="200" y="62" class="text-ai">.AI</text>
</svg>`;

// 4. Primary Stacked Light
const primaryLight = `<svg viewBox="0 0 150 150" width="300" height="300" xmlns="http://www.w3.org/2000/svg">
  ${defs}
  <g transform="translate(25, 0)">${iconPaths}</g>
  <text x="75" y="130" text-anchor="middle">
    <tspan class="text-daksh-stacked-light">Daksh</tspan><tspan class="text-ai-stacked">.AI</tspan>
  </text>
</svg>`;

// 5. Primary Stacked Dark
const primaryDark = `<svg viewBox="0 0 150 150" width="300" height="300" xmlns="http://www.w3.org/2000/svg">
  ${defs}
  <g transform="translate(25, 0)">${iconPaths}</g>
  <text x="75" y="130" text-anchor="middle">
    <tspan class="text-daksh-stacked-dark">Daksh</tspan><tspan class="text-ai-stacked">.AI</tspan>
  </text>
</svg>`;

// 6. App Icon (Rounded square with dark bg)
const appIcon = `<svg viewBox="0 0 100 100" width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  ${defs}
  <rect width="100" height="100" rx="22" fill="url(#appBg)" />
  ${iconPaths}
</svg>`;

// 7. Splash Screen Logo
const splashLogo = `<svg viewBox="0 0 400 400" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  ${defs}
  <text x="200" y="190" text-anchor="middle">
    <tspan class="text-daksh-dark" style="font-size:42px;">Daksh</tspan><tspan class="text-ai" style="font-size:42px;">.AI</tspan>
  </text>
  <text x="200" y="225" text-anchor="middle" font-family="Inter, sans-serif" font-size="12" fill="#94a3b8" letter-spacing="2">
    CAREER INTELLIGENCE
  </text>
</svg>`;


fs.writeFileSync(path.join(outDir, 'icon-only.svg'), iconSvg);
fs.writeFileSync(path.join(outDir, 'monogram.svg'), iconSvg);
fs.writeFileSync(path.join(outDir, 'favicon.svg'), iconSvg);
fs.writeFileSync(path.join(outDir, 'logo-horizontal-light.svg'), horizontalLight);
fs.writeFileSync(path.join(outDir, 'logo-horizontal-dark.svg'), horizontalDark);
fs.writeFileSync(path.join(outDir, 'logo-primary-light.svg'), primaryLight);
fs.writeFileSync(path.join(outDir, 'logo-primary-dark.svg'), primaryDark);
fs.writeFileSync(path.join(outDir, 'logo-master.svg'), primaryDark); // Master defaults to dark stacked
fs.writeFileSync(path.join(outDir, 'app-icon.svg'), appIcon);
fs.writeFileSync(path.join(outDir, 'splash-logo.svg'), splashLogo);

console.log('Successfully generated 10 pristine SVG vector assets in public/brand/');
