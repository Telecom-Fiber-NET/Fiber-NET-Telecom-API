import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'accent';
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  const baseClasses = "inline-flex items-center justify-center px-4 py-2 border text-sm font-bold rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform active:scale-95";
  
  const variants = {
    primary: "border-transparent text-white bg-connect-blue hover:bg-blue-800 focus:ring-connect-blue",
    accent: "border-transparent text-white bg-connect-accent hover:bg-sky-500 focus:ring-connect-accent",
    secondary: "border-transparent text-connect-blue bg-blue-50 hover:bg-blue-100 focus:ring-blue-500",
    outline: "border-gray-200 text-gray-700 bg-white hover:bg-blue-50 focus:ring-connect-blue hover:border-connect-blue hover:text-connect-blue",
    danger: "border-transparent text-white bg-red-600 hover:bg-red-700 focus:ring-red-500",
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;