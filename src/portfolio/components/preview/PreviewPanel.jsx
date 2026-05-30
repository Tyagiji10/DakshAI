import React, { useState } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { Monitor, Smartphone, Tablet, ExternalLink } from 'lucide-react';
import BaseThemeWrapper from '../../templates/BaseThemeWrapper';

const DEVICE_WIDTHS = {
    desktop: '100%',
    tablet: '768px',
    mobile: '390px',
};

const ZOOM_LEVELS = [
    { label: '50%', value: 0.5 },
    { label: '75%', value: 0.75 },
    { label: '100%', value: 1 },
    { label: 'Fit', value: 'fit' },
];

const PreviewPanel = () => {
    const { state } = usePortfolio();
    const [deviceMode, setDeviceMode] = useState('desktop');
    const [zoom, setZoom] = useState('fit');

    const name = state.personalInfo?.fullName || 'yourname';
    const slug = name.toLowerCase().replace(/\s+/g, '');
    const fakeUrl = `${slug}.daksh.ai`;

    const getScale = () => {
        if (zoom === 'fit') return undefined; // handled via CSS
        return zoom;
    };

    const frameWidth = DEVICE_WIDTHS[deviceMode];

    return (
        <div className="preview-main">
            {/* Toolbar */}
            <div className="preview-toolbar">
                <div className="preview-status">
                    <span className="live-dot" />
                    Live Preview
                </div>

                <div className="device-toggles">
                    {[
                        { id: 'desktop', icon: <Monitor size={14} />, title: 'Desktop' },
                        { id: 'tablet', icon: <Tablet size={14} />, title: 'Tablet' },
                        { id: 'mobile', icon: <Smartphone size={14} />, title: 'Mobile' },
                    ].map(d => (
                        <button
                            key={d.id}
                            className={`icon-btn ${deviceMode === d.id ? 'active' : ''}`}
                            onClick={() => setDeviceMode(d.id)}
                            title={d.title}
                        >
                            {d.icon}
                        </button>
                    ))}
                </div>

                <div className="zoom-controls">
                    {ZOOM_LEVELS.map(z => (
                        <button
                            key={z.label}
                            className={`zoom-btn ${zoom === z.value ? 'active' : ''}`}
                            onClick={() => setZoom(z.value)}
                        >
                            {z.label}
                        </button>
                    ))}
                </div>

                <button
                    title="Open in new tab"
                    onClick={() => {
                        localStorage.setItem('portfolio_draft_preview', JSON.stringify(state));
                        window.open('/p/preview/preview-draft', '_blank');
                    }}
                    style={{
                        background: 'none', border: 'none',
                        color: '#4b5563', cursor: 'pointer',
                        display: 'flex', alignItems: 'center',
                        padding: 6, borderRadius: 6,
                        transition: 'color 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#94a3b8'}
                    onMouseLeave={e => e.currentTarget.style.color = '#4b5563'}
                >
                    <ExternalLink size={14} />
                </button>
            </div>

            {/* Canvas */}
            <div className="preview-canvas-container">
                <div
                    className="preview-frame-wrap"
                    style={{
                        width: frameWidth,
                        maxWidth: '100%',
                        transition: 'width 0.4s cubic-bezier(0.16,1,0.3,1)',
                    }}
                >
                    {/* Browser Chrome */}
                    <div className="browser-chrome">
                        <div className="browser-dots">
                            <div className="browser-dot red" />
                            <div className="browser-dot yellow" />
                            <div className="browser-dot green" />
                        </div>
                        <div className="browser-url-bar">🔒 {fakeUrl}</div>
                    </div>

                    {/* Preview Frame */}
                    <div
                        className="preview-frame"
                        style={{
                            ...(zoom !== 'fit' && getScale() !== undefined
                                ? {
                                    transform: `scale(${getScale()})`,
                                    transformOrigin: 'top left',
                                    width: `${100 / getScale()}%`,
                                    marginBottom: `calc(-${(1 - getScale()) * 100}% )`,
                                }
                                : {}
                            ),
                        }}
                    >
                        <BaseThemeWrapper />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PreviewPanel;
