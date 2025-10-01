import React from 'react';

interface StaticBackgroundProps {
  children: React.ReactNode;
  variant?: 'gradient' | 'solid';
  color?: string;
}

/**
 * Static background component for widget isolation
 * Provides a clean, minimal background without navigation elements
 */
const StaticBackground: React.FC<StaticBackgroundProps> = ({
  children,
  variant = 'gradient',
  color = '#f8fafc'
}) => {
  const backgroundStyle = variant === 'gradient'
    ? {
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        minHeight: '100vh',
        width: '100%',
        position: 'relative' as const,
        overflow: 'hidden'
      }
    : {
        backgroundColor: color,
        minHeight: '100vh',
        width: '100%',
        position: 'relative' as const,
        overflow: 'hidden'
      };

  return (
    <div
      style={backgroundStyle}
      className="widget-static-background"
      data-testid="static-background"
    >
      {children}
    </div>
  );
};

export default StaticBackground;