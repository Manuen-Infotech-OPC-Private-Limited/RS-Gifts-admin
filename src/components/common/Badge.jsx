import React from 'react';

export const Badge = ({ children, variant = 'primary', className = '' }) => {
  const variantStyles = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    secondary: 'bg-secondary/20 text-charcoal border-secondary/30',
    accent: 'bg-accent/15 text-accent border-accent/30',
    success: 'bg-success/10 text-success border-success/20',
    error: 'bg-error/10 text-error border-error/20',
    charcoal: 'bg-charcoal/10 text-charcoal border-charcoal/20',
    'soft-gray': 'bg-soft-gray/10 text-soft-gray border-soft-gray/20',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        variantStyles[variant] || variantStyles.primary
      } ${className}`}
    >
      {children}
    </span>
  );
};
