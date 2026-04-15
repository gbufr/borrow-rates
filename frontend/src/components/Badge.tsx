import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, style, className }) => {
  return (
    <span 
      className={`badge ${className || ''}`}
      style={{
        padding: '0.2rem 0.5rem',
        borderRadius: '4px',
        fontWeight: 600,
        fontSize: '0.8rem',
        ...style
      }}
    >
      {children}
    </span>
  );
};
