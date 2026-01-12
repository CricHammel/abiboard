import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`
        bg-white
        border border-gray-200
        rounded-xl
        shadow-sm
        p-6 md:p-8
        ${className}
      `}
    >
      {children}
    </div>
  );
}
