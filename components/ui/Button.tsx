import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1'

  const variantClasses = {
    primary:   'bg-af-green-500 hover:bg-af-green-600 text-white focus:ring-af-green-400 disabled:bg-gray-300 disabled:text-gray-500 shadow-sm',
    secondary: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 focus:ring-gray-300 disabled:bg-gray-100 disabled:text-gray-400',
    danger:    'bg-red-600 hover:bg-red-700 text-white focus:ring-red-400 disabled:bg-gray-300 shadow-sm',
    ghost:     'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-300 disabled:bg-gray-50',
  }

  // Use inline styles for primary to avoid Tailwind purge issues with custom color
  const primaryStyle = variant === 'primary' ? { background: '#2d9e4e', '--tw-ring-color': '#2d9e4e' } as React.CSSProperties : {}
  const primaryHoverStyle = {} // handled via className

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      style={primaryStyle}
      {...props}
    >
      {children}
    </button>
  )
}
