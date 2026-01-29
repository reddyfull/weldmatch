import React, { useState, useCallback, useEffect } from 'react';
import { Shield, Plus, Save, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EncryptedField } from '@/components/ui/EncryptedField';
import { EncryptedInput } from '@/components/ui/EncryptedInput';
import { ReAuthModal } from '@/components/ui/ReAuthModal';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  encryptFields, 
  decryptFields, 
  maskField 
} from '@/lib/encryption';
import { 
  WELDER_ENCRYPTED_FIELDS, 
  getFieldConfig, 
  getVerificationRequiredFields 
} from '@/lib/encryptedFields';
import { logSensitiveAccess } from '@/lib/auditLog';

interface SensitiveDataSectionProps {
  welderId: string;
  welderProfile: Record<string, any> | null;
  onUpdate?: () => void;
}

interface SensitiveFieldState {
  ssn_encrypted: string;
  dob_encrypted: string;
  bank_account_encrypted: string;
  bank_routing_encrypted: string;
  phone_personal_encrypted: string;
  emergency_phone_encrypted: string;
  home_address_encrypted: string;
  drivers_license_encrypted: string;
}

const FIELD_DEFINITIONS = [
  { key: 'ssn_encrypted', label: 'Social Security Number', inputType: 'ssn' as const, placeholder: '123-45-6789' },
  { key: 'dob_encrypted', label: 'Date of Birth', inputType: 'date' as const, placeholder: '01/15/1990' },
  { key: 'phone_personal_encrypted', label: 'Personal Phone', inputType: 'phone' as const, placeholder: '(555) 123-4567' },
  { key: 'emergency_phone_encrypted', label: 'Emergency Contact Phone', inputType: 'phone' as const, placeholder: '(555) 987-6543' },
  { key: 'home_address_encrypted', label: 'Home Address', inputType: 'text' as const, placeholder: '123 Main St, City, State 12345' },
  { key: 'drivers_license_encrypted', label: "Driver's License", inputType: 'text' as const, placeholder: 'DL12345678' },
  { key: 'bank_account_encrypted', label: 'Bank Account Number', inputType: 'account' as const, placeholder: '123456789012' },
  { key: 'bank_routing_encrypted', label: 'Bank Routing Number', inputType: 'account' as const, placeholder: '021000021' },
];

export const SensitiveDataSection: React.FC<SensitiveDataSectionProps> = ({
  welderId,
  welderProfile,
  onUpdate,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [revealedFields, setRevealedFields] = useState<Set<string>>(new Set());
  const [reAuthModalOpen, setReAuthModalOpen] = useState(false);
  const [pendingRevealField, setPendingRevealField] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<SensitiveFieldState>({
    ssn_encrypted: '',
    dob_encrypted: '',
    bank_account_encrypted: '',
    bank_routing_encrypted: '',
    phone_personal_encrypted: '',
    emergency_phone_encrypted: '',
    home_address_encrypted: '',
    drivers_license_encrypted: '',
  });

  // Decrypt and populate form data when profile loads
  useEffect(() => {
    if (welderProfile && user?.id) {
      const decrypted = decryptFields(welderProfile, WELDER_ENCRYPTED_FIELDS, user.id);
      setFormData({
        ssn_encrypted: decrypted.ssn_encrypted || '',
        dob_encrypted: decrypted.dob_encrypted || '',
        bank_account_encrypted: decrypted.bank_account_encrypted || '',
        bank_routing_encrypted: decrypted.bank_routing_encrypted || '',
        phone_personal_encrypted: decrypted.phone_personal_encrypted || '',
        emergency_phone_encrypted: decrypted.emergency_phone_encrypted || '',
        home_address_encrypted: decrypted.home_address_encrypted || '',
        drivers_license_encrypted: decrypted.drivers_license_encrypted || '',
      });
    }
  }, [welderProfile, user?.id]);

  const verificationRequiredFields = getVerificationRequiredFields('welder_profiles');

  const handleReveal = useCallback(async (fieldName: string): Promise<boolean> => {
    const requiresVerification = verificationRequiredFields.includes(fieldName);
    
    if (requiresVerification) {
      setPendingRevealField(fieldName);
      setReAuthModalOpen(true);
      return false; // Don't reveal yet, wait for modal success
    }
    
    // No verification needed, reveal directly
    setRevealedFields(prev => new Set([...prev, fieldName]));
    
    // Log the access
    if (user?.id) {
      await logSensitiveAccess(
        user.id,
        'view',
        fieldName,
        'welder_profiles',
        welderId
      );
    }
    
    return true;
  }, [verificationRequiredFields, user?.id, welderId]);

  const handleReAuthSuccess = useCallback(async () => {
    if (pendingRevealField) {
      setRevealedFields(prev => new Set([...prev, pendingRevealField]));
      
      // Log the access
      if (user?.id) {
        await logSensitiveAccess(
          user.id,
          'reveal',
          pendingRevealField,
          'welder_profiles',
          welderId
        );
      }
      
      // Auto-hide after 30 seconds for sensitive fields
      setTimeout(() => {
        setRevealedFields(prev => {
          const newSet = new Set(prev);
          newSet.delete(pendingRevealField);
          return newSet;
        });
      }, 30000);
      
      setPendingRevealField(null);
    }
  }, [pendingRevealField, user?.id, welderId]);

  const handleHide = useCallback((fieldName: string) => {
    setRevealedFields(prev => {
      const newSet = new Set(prev);
      newSet.delete(fieldName);
      return newSet;
    });
  }, []);

  const handleInputChange = (fieldName: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleSave = async () => {
    if (!user?.id) return;
    
    setIsSaving(true);
    
    try {
      // Filter out empty values and encrypt
      const dataToSave: Record<string, string | null> = {};
      
      for (const field of FIELD_DEFINITIONS) {
        const value = formData[field.key as keyof SensitiveFieldState];
        if (value && value.trim()) {
          dataToSave[field.key] = value;
        } else {
          dataToSave[field.key] = null;
        }
      }
      
      // Encrypt the fields
      const encrypted = encryptFields(dataToSave, WELDER_ENCRYPTED_FIELDS, user.id);
      
      // Update the database
      const { error } = await supabase
        .from('welder_profiles')
        .update(encrypted)
        .eq('id', welderId);
      
      if (error) throw error;
      
      // Log the update
      await logSensitiveAccess(
        user.id,
        'edit',
        'multiple_encrypted_fields',
        'welder_profiles',
        welderId
      );
      
      toast({
        title: 'Sensitive Data Saved',
        description: 'Your information has been securely encrypted and saved.',
      });
      
      setIsEditing(false);
      onUpdate?.();
    } catch (error) {
      console.error('Failed to save sensitive data:', error);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Failed to save your sensitive data. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getMaskedValue = (fieldName: string, value: string) => {
    const config = getFieldConfig('welder_profiles', fieldName);
    if (!value) return '—';
    return maskField(value, config?.maskType || 'text');
  };

  const hasAnyData = Object.values(formData).some(v => v && v.trim());

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <CardTitle>Sensitive Information</CardTitle>
            </div>
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                {hasAnyData ? 'Edit' : 'Add'}
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Encrypting...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
          <CardDescription>
            This information is encrypted end-to-end and only you can access it.
            {!isEditing && (
              <span className="text-amber-600 block mt-1">
                🔒 High-sensitivity fields (SSN, Bank info) require password verification to view.
              </span>
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {isEditing ? (
            // Edit Mode - Show inputs
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FIELD_DEFINITIONS.map((field) => (
                <EncryptedInput
                  key={field.key}
                  label={field.label}
                  value={formData[field.key as keyof SensitiveFieldState]}
                  onChange={(value) => handleInputChange(field.key, value)}
                  type={field.inputType}
                  placeholder={field.placeholder}
                />
              ))}
            </div>
          ) : (
            // View Mode - Show encrypted fields
            hasAnyData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {FIELD_DEFINITIONS.map((field) => {
                  const value = formData[field.key as keyof SensitiveFieldState];
                  if (!value) return null;
                  
                  const isRevealed = revealedFields.has(field.key);
                  const requiresVerification = verificationRequiredFields.includes(field.key);
                  
                  return (
                    <EncryptedField
                      key={field.key}
                      label={field.label}
                      value={value}
                      maskedValue={getMaskedValue(field.key, value)}
                      isRevealed={isRevealed}
                      isEncrypted={true}
                      requiresVerification={requiresVerification}
                      onReveal={() => handleReveal(field.key)}
                      onHide={() => handleHide(field.key)}
                      allowCopy={isRevealed}
                      size="sm"
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No sensitive information stored yet.</p>
                <p className="text-sm mt-1">
                  Click "Add" to securely store your SSN, banking info, and more.
                </p>
              </div>
            )
          )}
          
          {/* Security notice */}
          <div className="mt-4 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">How your data is protected:</p>
                <ul className="mt-1 space-y-0.5">
                  <li>• AES-256 encryption before leaving your device</li>
                  <li>• Only you have the decryption key</li>
                  <li>• All access is logged for your review</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Re-authentication Modal */}
      <ReAuthModal
        isOpen={reAuthModalOpen}
        onClose={() => {
          setReAuthModalOpen(false);
          setPendingRevealField(null);
        }}
        onSuccess={handleReAuthSuccess}
        fieldName={
          pendingRevealField
            ? getFieldConfig('welder_profiles', pendingRevealField)?.displayName || pendingRevealField
            : 'sensitive information'
        }
      />
    </>
  );
};
