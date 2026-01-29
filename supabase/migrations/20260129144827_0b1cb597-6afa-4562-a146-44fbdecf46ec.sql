-- Add encrypted fields to welder_profiles table
ALTER TABLE public.welder_profiles
ADD COLUMN IF NOT EXISTS ssn_encrypted TEXT,
ADD COLUMN IF NOT EXISTS tax_id_encrypted TEXT,
ADD COLUMN IF NOT EXISTS drivers_license_encrypted TEXT,
ADD COLUMN IF NOT EXISTS passport_number_encrypted TEXT,
ADD COLUMN IF NOT EXISTS bank_account_encrypted TEXT,
ADD COLUMN IF NOT EXISTS bank_routing_encrypted TEXT,
ADD COLUMN IF NOT EXISTS dob_encrypted TEXT,
ADD COLUMN IF NOT EXISTS home_address_encrypted TEXT,
ADD COLUMN IF NOT EXISTS phone_personal_encrypted TEXT,
ADD COLUMN IF NOT EXISTS emergency_phone_encrypted TEXT,
ADD COLUMN IF NOT EXISTS medical_info_encrypted TEXT,
ADD COLUMN IF NOT EXISTS background_check_encrypted TEXT,
ADD COLUMN IF NOT EXISTS drug_test_encrypted TEXT;

-- Add encrypted fields to employer_profiles table
ALTER TABLE public.employer_profiles
ADD COLUMN IF NOT EXISTS tax_id_encrypted TEXT,
ADD COLUMN IF NOT EXISTS bank_account_encrypted TEXT,
ADD COLUMN IF NOT EXISTS bank_routing_encrypted TEXT,
ADD COLUMN IF NOT EXISTS billing_address_encrypted TEXT,
ADD COLUMN IF NOT EXISTS insurance_policy_encrypted TEXT;

-- Add encrypted fields to certifications table
ALTER TABLE public.certifications
ADD COLUMN IF NOT EXISTS cert_number_encrypted TEXT,
ADD COLUMN IF NOT EXISTS license_number_encrypted TEXT;

-- Create sensitive data audit log table for compliance
CREATE TABLE IF NOT EXISTS public.sensitive_data_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(20) NOT NULL CHECK (action IN ('view', 'reveal', 'edit', 'export', 'create', 'delete')),
  table_name VARCHAR(100) NOT NULL,
  field_name VARCHAR(255) NOT NULL,
  record_id TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE public.sensitive_data_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view the audit log
CREATE POLICY "Admins can view audit log"
ON public.sensitive_data_audit_log
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Users can insert their own audit entries
CREATE POLICY "Users can insert own audit entries"
ON public.sensitive_data_audit_log
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create indexes for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_user_id ON public.sensitive_data_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON public.sensitive_data_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_table_name ON public.sensitive_data_audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.sensitive_data_audit_log(action);

-- Create function to log sensitive access (callable from client)
CREATE OR REPLACE FUNCTION public.log_sensitive_access(
  p_user_id UUID,
  p_action VARCHAR(20),
  p_field_name VARCHAR(255),
  p_table_name VARCHAR(100),
  p_record_id TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ensure user can only log for themselves
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Cannot log access for another user';
  END IF;

  INSERT INTO public.sensitive_data_audit_log (
    user_id,
    action,
    field_name,
    table_name,
    record_id,
    user_agent,
    metadata
  ) VALUES (
    p_user_id,
    p_action,
    p_field_name,
    p_table_name,
    p_record_id,
    p_user_agent,
    p_metadata
  );
END;
$$;

-- Create function to get audit log (admin only)
CREATE OR REPLACE FUNCTION public.get_audit_log(
  p_user_id UUID DEFAULT NULL,
  p_table_name VARCHAR(100) DEFAULT NULL,
  p_record_id TEXT DEFAULT NULL,
  p_action VARCHAR(20) DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  action VARCHAR(20),
  table_name VARCHAR(100),
  field_name VARCHAR(255),
  record_id TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can query full audit log
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    -- Non-admins can only see their own entries
    RETURN QUERY
    SELECT 
      l.id, l.user_id, l.action, l.table_name, l.field_name, 
      l.record_id, l.user_agent, l.metadata, l.created_at
    FROM public.sensitive_data_audit_log l
    WHERE l.user_id = auth.uid()
    ORDER BY l.created_at DESC
    LIMIT p_limit;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    l.id, l.user_id, l.action, l.table_name, l.field_name, 
    l.record_id, l.user_agent, l.metadata, l.created_at
  FROM public.sensitive_data_audit_log l
  WHERE 
    (p_user_id IS NULL OR l.user_id = p_user_id)
    AND (p_table_name IS NULL OR l.table_name = p_table_name)
    AND (p_record_id IS NULL OR l.record_id = p_record_id)
    AND (p_action IS NULL OR l.action = p_action)
    AND (p_start_date IS NULL OR l.created_at >= p_start_date)
    AND (p_end_date IS NULL OR l.created_at <= p_end_date)
  ORDER BY l.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Add comment for documentation
COMMENT ON TABLE public.sensitive_data_audit_log IS 'Audit log for compliance tracking of sensitive encrypted data access (SOC 2, GDPR, CCPA)';
COMMENT ON FUNCTION public.log_sensitive_access IS 'Log access to sensitive encrypted fields for compliance auditing';
COMMENT ON FUNCTION public.get_audit_log IS 'Query audit log entries with filters (admin-only for full access)';