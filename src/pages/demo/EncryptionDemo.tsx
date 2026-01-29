// pages/demo/EncryptionDemo.tsx
import React, { useState } from "react";
import { Shield, Lock, Eye, Info, AlertTriangle } from "lucide-react";
import { EncryptedField } from "@/components/ui/EncryptedField";
import { EncryptedInput } from "@/components/ui/EncryptedInput";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { maskField } from "@/lib/encryption";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Sample decrypted data for demo purposes
const SAMPLE_DATA = {
  ssn: "123-45-6789",
  phone: "(555) 123-4567",
  bankAccount: "9876543210",
  routingNumber: "021000021",
  dob: "03/15/1985",
  address: "123 Main Street, Houston, TX 77001",
  email: "john.doe@example.com",
  taxId: "12-3456789",
  driversLicense: "DL12345678",
  passportNumber: "N12345678",
};

export default function EncryptionDemo() {
  // State for revealed fields
  const [revealedFields, setRevealedFields] = useState<Set<string>>(new Set());
  
  // State for editable form
  const [formData, setFormData] = useState({
    ssn: "",
    phone: "",
    bankAccount: "",
    dob: "",
  });

  const handleReveal = async (fieldName: string): Promise<boolean> => {
    // Simulate verification for high-sensitivity fields
    const highSensitivityFields = ["ssn", "bankAccount", "routingNumber"];
    if (highSensitivityFields.includes(fieldName)) {
      const confirmed = window.confirm(
        "This is a high-sensitivity field. In production, you would need to re-authenticate. Continue?"
      );
      if (!confirmed) return false;
    }
    
    setRevealedFields((prev) => new Set([...prev, fieldName]));
    
    // Auto-hide after 30 seconds for high-sensitivity fields
    if (highSensitivityFields.includes(fieldName)) {
      setTimeout(() => {
        handleHide(fieldName);
      }, 30000);
    }
    
    return true;
  };

  const handleHide = (fieldName: string) => {
    setRevealedFields((prev) => {
      const newSet = new Set(prev);
      newSet.delete(fieldName);
      return newSet;
    });
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    alert(
      "In production, this data would be encrypted before saving:\n\n" +
      JSON.stringify(formData, null, 2) +
      "\n\nThe encrypted values would look like:\nenc_v1:BASE64IV:CIPHERTEXT"
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto py-6 px-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Field-Level Encryption Demo</h1>
              <p className="text-muted-foreground">
                SOC 2, GDPR, CCPA compliant data protection
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4 space-y-8">
        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>How It Works</AlertTitle>
          <AlertDescription>
            Sensitive data is encrypted client-side before being stored in the database. 
            Only encrypted ciphertext is stored - the database never sees plaintext values. 
            Decryption happens only in the browser for display.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="display" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="display">Display Fields</TabsTrigger>
            <TabsTrigger value="input">Input Fields</TabsTrigger>
            <TabsTrigger value="masking">Mask Types</TabsTrigger>
          </TabsList>

          {/* Display Fields Tab */}
          <TabsContent value="display" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Personal Identity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-primary" />
                    Personal Identity
                  </CardTitle>
                  <CardDescription>
                    High-sensitivity fields requiring verification
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <EncryptedField
                    label="Social Security Number"
                    value={SAMPLE_DATA.ssn}
                    maskedValue={maskField(SAMPLE_DATA.ssn, "ssn")}
                    isRevealed={revealedFields.has("ssn")}
                    isEncrypted={true}
                    requiresVerification={true}
                    onReveal={() => handleReveal("ssn")}
                    onHide={() => handleHide("ssn")}
                  />

                  <EncryptedField
                    label="Date of Birth"
                    value={SAMPLE_DATA.dob}
                    maskedValue={maskField(SAMPLE_DATA.dob, "date")}
                    isRevealed={revealedFields.has("dob")}
                    isEncrypted={true}
                    requiresVerification={false}
                    onReveal={() => handleReveal("dob")}
                    onHide={() => handleHide("dob")}
                  />

                  <EncryptedField
                    label="Driver's License"
                    value={SAMPLE_DATA.driversLicense}
                    maskedValue={maskField(SAMPLE_DATA.driversLicense, "account")}
                    isRevealed={revealedFields.has("driversLicense")}
                    isEncrypted={true}
                    requiresVerification={false}
                    onReveal={() => handleReveal("driversLicense")}
                    onHide={() => handleHide("driversLicense")}
                  />

                  <EncryptedField
                    label="Passport Number"
                    value={SAMPLE_DATA.passportNumber}
                    maskedValue={maskField(SAMPLE_DATA.passportNumber, "account")}
                    isRevealed={revealedFields.has("passportNumber")}
                    isEncrypted={true}
                    requiresVerification={false}
                    onReveal={() => handleReveal("passportNumber")}
                    onHide={() => handleHide("passportNumber")}
                  />
                </CardContent>
              </Card>

              {/* Financial Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-amber-500" />
                    Financial Information
                  </CardTitle>
                  <CardDescription>
                    Bank details with copy functionality
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <EncryptedField
                    label="Bank Account Number"
                    value={SAMPLE_DATA.bankAccount}
                    maskedValue={maskField(SAMPLE_DATA.bankAccount, "account")}
                    isRevealed={revealedFields.has("bankAccount")}
                    isEncrypted={true}
                    requiresVerification={true}
                    onReveal={() => handleReveal("bankAccount")}
                    onHide={() => handleHide("bankAccount")}
                    allowCopy={true}
                  />

                  <EncryptedField
                    label="Routing Number"
                    value={SAMPLE_DATA.routingNumber}
                    maskedValue={maskField(SAMPLE_DATA.routingNumber, "account")}
                    isRevealed={revealedFields.has("routingNumber")}
                    isEncrypted={true}
                    requiresVerification={true}
                    onReveal={() => handleReveal("routingNumber")}
                    onHide={() => handleHide("routingNumber")}
                    allowCopy={true}
                  />

                  <EncryptedField
                    label="Tax ID (EIN)"
                    value={SAMPLE_DATA.taxId}
                    maskedValue={maskField(SAMPLE_DATA.taxId, "account")}
                    isRevealed={revealedFields.has("taxId")}
                    isEncrypted={true}
                    requiresVerification={false}
                    onReveal={() => handleReveal("taxId")}
                    onHide={() => handleHide("taxId")}
                  />
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-blue-500" />
                    Contact Information
                  </CardTitle>
                  <CardDescription>
                    Personal contact details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <EncryptedField
                    label="Personal Phone"
                    value={SAMPLE_DATA.phone}
                    maskedValue={maskField(SAMPLE_DATA.phone, "phone")}
                    isRevealed={revealedFields.has("phone")}
                    isEncrypted={true}
                    requiresVerification={false}
                    onReveal={() => handleReveal("phone")}
                    onHide={() => handleHide("phone")}
                    allowCopy={true}
                  />

                  <EncryptedField
                    label="Email Address"
                    value={SAMPLE_DATA.email}
                    maskedValue={maskField(SAMPLE_DATA.email, "email")}
                    isRevealed={revealedFields.has("email")}
                    isEncrypted={true}
                    requiresVerification={false}
                    onReveal={() => handleReveal("email")}
                    onHide={() => handleHide("email")}
                    allowCopy={true}
                  />

                  <EncryptedField
                    label="Home Address"
                    value={SAMPLE_DATA.address}
                    maskedValue={maskField(SAMPLE_DATA.address, "address")}
                    isRevealed={revealedFields.has("address")}
                    isEncrypted={true}
                    requiresVerification={false}
                    onReveal={() => handleReveal("address")}
                    onHide={() => handleHide("address")}
                  />
                </CardContent>
              </Card>

              {/* Size Variants */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-purple-500" />
                    Size Variants
                  </CardTitle>
                  <CardDescription>
                    Different display sizes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <EncryptedField
                    label="Small Size"
                    value={SAMPLE_DATA.ssn}
                    maskedValue={maskField(SAMPLE_DATA.ssn, "ssn")}
                    isRevealed={revealedFields.has("small")}
                    isEncrypted={true}
                    onReveal={() => handleReveal("small")}
                    onHide={() => handleHide("small")}
                    size="sm"
                  />

                  <EncryptedField
                    label="Medium Size (Default)"
                    value={SAMPLE_DATA.phone}
                    maskedValue={maskField(SAMPLE_DATA.phone, "phone")}
                    isRevealed={revealedFields.has("medium")}
                    isEncrypted={true}
                    onReveal={() => handleReveal("medium")}
                    onHide={() => handleHide("medium")}
                    size="md"
                  />

                  <EncryptedField
                    label="Large Size"
                    value={SAMPLE_DATA.bankAccount}
                    maskedValue={maskField(SAMPLE_DATA.bankAccount, "account")}
                    isRevealed={revealedFields.has("large")}
                    isEncrypted={true}
                    onReveal={() => handleReveal("large")}
                    onHide={() => handleHide("large")}
                    size="lg"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Input Fields Tab */}
          <TabsContent value="input" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Encrypted Input Form</CardTitle>
                <CardDescription>
                  These inputs automatically format and mask values. Data is encrypted before saving.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <EncryptedInput
                    label="Social Security Number"
                    value={formData.ssn}
                    onChange={(value) => handleInputChange("ssn", value)}
                    type="ssn"
                    placeholder="Enter SSN"
                    helperText="Format: XXX-XX-XXXX"
                    required
                  />

                  <EncryptedInput
                    label="Phone Number"
                    value={formData.phone}
                    onChange={(value) => handleInputChange("phone", value)}
                    type="phone"
                    placeholder="Enter phone number"
                    helperText="Format: (XXX) XXX-XXXX"
                  />

                  <EncryptedInput
                    label="Bank Account Number"
                    value={formData.bankAccount}
                    onChange={(value) => handleInputChange("bankAccount", value)}
                    type="account"
                    placeholder="Enter account number"
                    helperText="Numbers only"
                    required
                  />

                  <EncryptedInput
                    label="Date of Birth"
                    value={formData.dob}
                    onChange={(value) => handleInputChange("dob", value)}
                    type="date"
                    placeholder="Enter date of birth"
                    helperText="Format: MM/DD/YYYY"
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    <Shield className="h-4 w-4 inline mr-1" />
                    All fields will be encrypted with AES-256 before saving
                  </div>
                  <Button onClick={handleSave}>
                    Save Encrypted Data
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Alert variant="default" className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800">Demo Mode</AlertTitle>
              <AlertDescription className="text-amber-700">
                In production, clicking "Save" would encrypt the data using your master key 
                and store only the ciphertext in the database. The plaintext never leaves your browser.
              </AlertDescription>
            </Alert>
          </TabsContent>

          {/* Masking Types Tab */}
          <TabsContent value="masking" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mask Type Examples</CardTitle>
                <CardDescription>
                  Different masking patterns for various data types
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { type: "ssn" as const, value: "123-45-6789", label: "SSN Mask" },
                    { type: "phone" as const, value: "(555) 123-4567", label: "Phone Mask" },
                    { type: "account" as const, value: "9876543210", label: "Account Mask" },
                    { type: "email" as const, value: "john.doe@example.com", label: "Email Mask" },
                    { type: "address" as const, value: "123 Main St, Houston, TX", label: "Address Mask" },
                    { type: "date" as const, value: "03/15/1985", label: "Date Mask" },
                    { type: "text" as const, value: "Sensitive Text", label: "Text Mask" },
                  ].map((item) => (
                    <div key={item.type} className="p-4 rounded-lg border bg-muted/30">
                      <div className="text-sm font-medium mb-2">{item.label}</div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Original:</div>
                        <div className="font-mono text-sm">{item.value}</div>
                        <div className="text-xs text-muted-foreground mt-2">Masked:</div>
                        <div className="font-mono text-sm text-primary">
                          {maskField(item.value, item.type)}
                        </div>
                      </div>
                      <Badge variant="outline" className="mt-2">
                        {item.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Encryption Format</CardTitle>
                <CardDescription>
                  How encrypted data is stored in the database
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-lg bg-muted font-mono text-sm overflow-x-auto">
                  <div className="text-muted-foreground mb-2">// Example encrypted value:</div>
                  <div className="text-primary break-all">
                    enc_v1:SGVsbG8gV29ybGQ=:U2FsdGVkX1+8bC9kL2d3aGVuIHRoZSBtYXN0ZXIga2V5IGlzIHVzZWQ=
                  </div>
                  <div className="mt-4 text-muted-foreground">
                    <div>Format: <span className="text-foreground">version:iv:ciphertext</span></div>
                    <div className="mt-1">• <span className="text-green-600">enc_v1</span> - Encryption version (for key rotation)</div>
                    <div>• <span className="text-blue-600">SGVsbG8...</span> - Base64-encoded IV</div>
                    <div>• <span className="text-purple-600">U2FsdGVk...</span> - AES-256 encrypted ciphertext</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
