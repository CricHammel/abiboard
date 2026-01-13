'use client';

import { Input } from '@/components/ui/Input';
import { SingleImageUpload } from './SingleImageUpload';
import { MultiImageUpload } from './MultiImageUpload';
import { FieldDefinition } from '@/lib/steckbrief-fields';

interface FieldRendererProps {
  field: FieldDefinition;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
}

export function FieldRenderer({
  field,
  value,
  onChange,
  error,
  disabled,
}: FieldRendererProps) {
  switch (field.type) {
    case 'text':
      return (
        <Input
          label={field.label}
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          error={error}
          disabled={disabled}
          maxLength={field.maxLength}
        />
      );

    case 'textarea':
      return (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 mb-2">
            {field.label}
          </label>
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={field.rows || 4}
            maxLength={field.maxLength}
            disabled={disabled}
            className={`
              w-full px-4 py-3
              border rounded-lg
              text-base
              focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary
              disabled:bg-gray-50 disabled:cursor-not-allowed
              ${error ? 'border-error ring-2 ring-red-100' : 'border-gray-200'}
            `}
          />
          {field.maxLength && (
            <p className="mt-1 text-xs text-gray-500 text-right">
              {value?.length || 0} / {field.maxLength}
            </p>
          )}
          {error && (
            <p className="mt-2 text-sm text-error flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          )}
        </div>
      );

    case 'single-image':
      return (
        <SingleImageUpload
          label={field.label}
          currentImage={value}
          onChange={onChange}
          error={error}
          disabled={disabled}
        />
      );

    case 'multi-image':
      return (
        <MultiImageUpload
          label={field.label}
          currentImages={value?.existing || value || []}
          maxFiles={field.maxFiles || 3}
          onChange={onChange}
          error={error}
          disabled={disabled}
        />
      );

    default:
      return null;
  }
}
