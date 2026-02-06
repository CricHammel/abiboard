import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  showRequired?: boolean;
}

export function Input({
  label,
  error,
  id,
  className = "",
  showRequired,
  ...props
}: InputProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="mb-4">
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-gray-600 mb-2"
      >
        {label}
        {showRequired && <span className="text-error ml-1">*</span>}
      </label>
      <input
        id={inputId}
        className={`
          w-full px-4 py-3
          border rounded-lg
          text-base
          min-h-[44px]
          focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary
          disabled:bg-gray-50 disabled:cursor-not-allowed
          ${error ? "border-error ring-2 ring-red-100" : "border-gray-200"}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-2 text-sm text-error flex items-center">
          <svg
            className="w-4 h-4 mr-1"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
