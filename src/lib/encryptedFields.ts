// lib/encryptedFields.ts

export type MaskType = 'ssn' | 'phone' | 'account' | 'email' | 'address' | 'date' | 'text';

export interface EncryptedFieldConfig {
  field: string;
  table: string;
  maskType: MaskType;
  displayName: string;
  requiresVerification?: boolean; // Require re-auth to view
}

export const ENCRYPTED_FIELD_CONFIG: EncryptedFieldConfig[] = [
  // Welder Profile - Personal Identity
  { field: 'ssn_encrypted', table: 'welder_profiles', maskType: 'ssn', displayName: 'Social Security Number', requiresVerification: true },
  { field: 'tax_id_encrypted', table: 'welder_profiles', maskType: 'account', displayName: 'Tax ID' },
  { field: 'drivers_license_encrypted', table: 'welder_profiles', maskType: 'account', displayName: "Driver's License" },
  { field: 'passport_number_encrypted', table: 'welder_profiles', maskType: 'account', displayName: 'Passport Number' },
  
  // Welder Profile - Financial
  { field: 'bank_account_encrypted', table: 'welder_profiles', maskType: 'account', displayName: 'Bank Account', requiresVerification: true },
  { field: 'bank_routing_encrypted', table: 'welder_profiles', maskType: 'account', displayName: 'Routing Number', requiresVerification: true },
  
  // Welder Profile - Personal Info
  { field: 'dob_encrypted', table: 'welder_profiles', maskType: 'date', displayName: 'Date of Birth' },
  { field: 'home_address_encrypted', table: 'welder_profiles', maskType: 'address', displayName: 'Home Address' },
  { field: 'phone_personal_encrypted', table: 'welder_profiles', maskType: 'phone', displayName: 'Personal Phone' },
  { field: 'emergency_phone_encrypted', table: 'welder_profiles', maskType: 'phone', displayName: 'Emergency Contact' },
  
  // Welder Profile - Sensitive Medical/Background
  { field: 'medical_info_encrypted', table: 'welder_profiles', maskType: 'text', displayName: 'Medical Information', requiresVerification: true },
  { field: 'background_check_encrypted', table: 'welder_profiles', maskType: 'text', displayName: 'Background Check', requiresVerification: true },
  { field: 'drug_test_encrypted', table: 'welder_profiles', maskType: 'text', displayName: 'Drug Test Results', requiresVerification: true },
  
  // Employer Profile
  { field: 'tax_id_encrypted', table: 'employer_profiles', maskType: 'account', displayName: 'Company Tax ID' },
  { field: 'bank_account_encrypted', table: 'employer_profiles', maskType: 'account', displayName: 'Bank Account', requiresVerification: true },
  { field: 'bank_routing_encrypted', table: 'employer_profiles', maskType: 'account', displayName: 'Routing Number', requiresVerification: true },
  { field: 'billing_address_encrypted', table: 'employer_profiles', maskType: 'address', displayName: 'Billing Address' },
  { field: 'insurance_policy_encrypted', table: 'employer_profiles', maskType: 'account', displayName: 'Insurance Policy #' },
  
  // Certifications
  { field: 'cert_number_encrypted', table: 'certifications', maskType: 'account', displayName: 'Certification Number' },
  { field: 'license_number_encrypted', table: 'certifications', maskType: 'account', displayName: 'License Number' },
];

// Helper to get encrypted fields for a table
export const getEncryptedFieldsForTable = (tableName: string): string[] => {
  return ENCRYPTED_FIELD_CONFIG
    .filter(config => config.table === tableName)
    .map(config => config.field);
};

// Helper to get field config
export const getFieldConfig = (tableName: string, fieldName: string): EncryptedFieldConfig | undefined => {
  return ENCRYPTED_FIELD_CONFIG.find(
    config => config.table === tableName && config.field === fieldName
  );
};

// Helper to get all fields requiring verification
export const getVerificationRequiredFields = (tableName: string): string[] => {
  return ENCRYPTED_FIELD_CONFIG
    .filter(config => config.table === tableName && config.requiresVerification)
    .map(config => config.field);
};

// List of welder encrypted fields (for easy reference)
export const WELDER_ENCRYPTED_FIELDS = getEncryptedFieldsForTable('welder_profiles');

// List of employer encrypted fields
export const EMPLOYER_ENCRYPTED_FIELDS = getEncryptedFieldsForTable('employer_profiles');

// List of certification encrypted fields
export const CERTIFICATION_ENCRYPTED_FIELDS = getEncryptedFieldsForTable('certifications');
