// hooks/useEncryptedData.ts
import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  decryptFields, 
  encryptFields, 
  maskField,
  isEncrypted 
} from '@/lib/encryption';
import { 
  getEncryptedFieldsForTable, 
  getFieldConfig,
  MaskType
} from '@/lib/encryptedFields';

interface UseEncryptedDataOptions {
  tableName: string;
  showMasked?: boolean; // Show masked values by default
}

export function useEncryptedData<T extends Record<string, any>>(
  options: UseEncryptedDataOptions
) {
  const { user } = useAuth();
  const { tableName, showMasked = true } = options;
  
  const encryptedFields = useMemo(
    () => getEncryptedFieldsForTable(tableName),
    [tableName]
  );

  const [revealedFields, setRevealedFields] = useState<Set<string>>(new Set());

  /**
   * Process raw data from database - decrypt if needed
   */
  const processData = useCallback((rawData: T): T => {
    if (!user?.id || !rawData) return rawData;

    // Always decrypt for internal use
    return decryptFields(rawData, encryptedFields, user.id);
  }, [user?.id, encryptedFields]);

  /**
   * Get display value for a field (masked or revealed)
   */
  const getDisplayValue = useCallback((
    fieldName: string,
    value: any,
    forceReveal: boolean = false
  ): string => {
    const config = getFieldConfig(tableName, fieldName);
    
    // Non-encrypted fields return as-is
    if (!config) {
      return String(value ?? '');
    }

    // If revealed or forceReveal, show actual value
    if (forceReveal || revealedFields.has(fieldName)) {
      return String(value ?? '');
    }

    // Otherwise show masked value
    if (showMasked && config.maskType) {
      return maskField(String(value), config.maskType as MaskType);
    }

    return '••••••••';
  }, [tableName, showMasked, revealedFields]);

  /**
   * Reveal a specific field (returns config info for verification handling)
   */
  const revealField = useCallback((fieldName: string) => {
    setRevealedFields(prev => new Set([...prev, fieldName]));
  }, []);

  /**
   * Complete reveal with auto-hide for sensitive fields
   */
  const completeReveal = useCallback((fieldName: string) => {
    const config = getFieldConfig(tableName, fieldName);
    
    setRevealedFields(prev => new Set([...prev, fieldName]));

    // Auto-hide after 30 seconds for sensitive fields
    if (config?.requiresVerification) {
      setTimeout(() => {
        hideField(fieldName);
      }, 30000);
    }
  }, [tableName]);

  /**
   * Hide a revealed field
   */
  const hideField = useCallback((fieldName: string) => {
    setRevealedFields(prev => {
      const newRevealed = new Set(prev);
      newRevealed.delete(fieldName);
      return newRevealed;
    });
  }, []);

  /**
   * Hide all revealed fields
   */
  const hideAllFields = useCallback(() => {
    setRevealedFields(new Set());
  }, []);

  /**
   * Encrypt data before saving to database
   */
  const prepareForSave = useCallback((data: Partial<T>): Partial<T> => {
    if (!user?.id) {
      throw new Error('User must be authenticated to save encrypted data');
    }

    return encryptFields(data as T, encryptedFields, user.id);
  }, [user?.id, encryptedFields]);

  /**
   * Decrypt data from database
   */
  const decryptData = useCallback((rawData: T): T => {
    if (!user?.id) {
      throw new Error('User must be authenticated to decrypt data');
    }

    return decryptFields(rawData, encryptedFields, user.id);
  }, [user?.id, encryptedFields]);

  return {
    revealedFields,
    processData,
    getDisplayValue,
    revealField,
    completeReveal,
    hideField,
    hideAllFields,
    prepareForSave,
    decryptData,
    encryptedFields,
    isFieldEncrypted: (fieldName: string) => encryptedFields.includes(fieldName),
    isFieldRevealed: (fieldName: string) => revealedFields.has(fieldName),
    requiresVerification: (fieldName: string) => {
      const config = getFieldConfig(tableName, fieldName);
      return config?.requiresVerification ?? false;
    },
    getFieldDisplayName: (fieldName: string) => {
      const config = getFieldConfig(tableName, fieldName);
      return config?.displayName ?? fieldName;
    },
    getMaskType: (fieldName: string) => {
      const config = getFieldConfig(tableName, fieldName);
      return config?.maskType;
    },
  };
}
