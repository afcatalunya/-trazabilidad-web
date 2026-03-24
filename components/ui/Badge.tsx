import React from 'react'

interface BadgeProps {
  variant?: 'default' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'gray'
  children: React.ReactNode
  className?: string
}

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  const variantClasses = {
    default: 'bg-blue-100 text-blue-800',
    red: 'bg-red-100 text-red-800',
    orange: 'bg-orange-100 text-orange-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    green: 'bg-green-100 text-green-800',
    blue: 'bg-blue-100 text-blue-800',
    gray: 'bg-gray-100 text-gray-800',
  }

  return (
    <span
      className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
