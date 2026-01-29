// components/ui/EncryptedInput.tsx
import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Shield, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type InputType = 'text' | 'ssn' | 'phone' | 'account' | 'date';

interface EncryptedInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: InputType;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
}

export const EncryptedInput: React.FC<EncryptedInputProps> = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  disabled = false,
  error,
  helperText,
  className,
}) => {
  const [showValue, setShowValue] = useState(false);
  const [internalValue, setInternalValue] = useState(value);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Format input based on type
  const formatInput = (rawValue: string): string => {
    const cleaned = rawValue.replace(/\D/g, '');
    
    switch (type) {
      case 'ssn':
        // Format as XXX-XX-XXXX
        if (cleaned.length <= 3) return cleaned;
        if (cleaned.length <= 5) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
        return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5, 9)}`;
      
      case 'phone':
        // Format as (XXX) XXX-XXXX
        if (cleaned.length <= 3) return cleaned;
        if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
      
      case 'account':
        // No special formatting, just numbers
        return cleaned;
      
      case 'date':
        // Format as MM/DD/YYYY
        if (cleaned.length <= 2) return cleaned;
        if (cleaned.length <= 4) return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
        return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
      
      default:
        return rawValue;
    }
  };

  // Get masked display value
  const getMaskedDisplay = (val: string): string => {
    if (!val) return '';
    
    switch (type) {
      case 'ssn':
        return val.replace(/\d(?=.{4})/g, '•');
      case 'phone':
        return val.replace(/\d(?=.{4})/g, '•');
      case 'account':
        return val.replace(/\d(?=.{4})/g, '•');
      case 'date':
        // Hide month and day, show year
        const parts = val.split('/');
        if (parts.length === 3) {
          return `••/••/${parts[2]}`;
        }
        return '•'.repeat(val.length);
      default:
        return '•'.repeat(val.length);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatInput(e.target.value);
    setInternalValue(formatted);
    onChange(formatted);
  };

  const displayValue = showValue ? internalValue : getMaskedDisplay(internalValue);

  return (
    <TooltipProvider>
      <div className={cn("space-y-2", className)}>
        {/* Label */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground flex items-center gap-1">
            {label}
            {required && <span className="text-destructive">*</span>}
          </label>
          <Tooltip>
            <TooltipTrigger asChild>
              <Shield className="h-4 w-4 text-primary" />
            </TooltipTrigger>
            <TooltipContent>
              <p>This field will be encrypted when saved</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Input with toggle */}
        <div className="relative">
          <Input
            type="text"
            value={displayValue}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "pr-10 font-mono",
              error && "border-destructive focus-visible:ring-destructive"
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowValue(!showValue)}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            disabled={disabled}
          >
            {showValue ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>

        {/* Helper text or error */}
        {error ? (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {error}
          </p>
        ) : helperText ? (
          <p className="text-xs text-muted-foreground">{helperText}</p>
        ) : null}
      </div>
    </TooltipProvider>
  );
};
