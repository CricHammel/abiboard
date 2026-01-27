import React from "react";

interface BadgeProps {
  variant: "draft" | "submitted" | "inactive" | "active";
  children: React.ReactNode;
  className?: string;
}

const variantStyles = {
  draft: "bg-gray-100 text-gray-700",
  submitted: "bg-green-100 text-green-700",
  inactive: "bg-red-100 text-red-700",
  active: "bg-green-100 text-green-700",
};

export function Badge({ variant, children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
