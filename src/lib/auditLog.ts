// lib/auditLog.ts
import { supabase } from '@/integrations/supabase/client';

export type AuditAction = 'view' | 'reveal' | 'edit' | 'export' | 'create' | 'delete';

export interface AuditLogEntry {
  user_id: string;
  action: AuditAction;
  table_name: string;
  field_name: string;
  record_id?: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
}

/**
 * Log access to sensitive encrypted data for compliance auditing
 * Note: This will only work after the sensitive_data_audit_log table is created
 */
export const logSensitiveAccess = async (
  userId: string,
  action: AuditAction,
  fieldName: string,
  tableName: string,
  recordId?: string,
  metadata?: Record<string, any>
): Promise<void> => {
  try {
    // Use raw SQL to insert into the audit log table
    // This avoids TypeScript errors if the table doesn't exist in types yet
    const { error } = await supabase.rpc('log_sensitive_access' as any, {
      p_user_id: userId,
      p_action: action,
      p_field_name: fieldName,
      p_table_name: tableName,
      p_record_id: recordId || null,
      p_user_agent: navigator.userAgent,
      p_metadata: metadata || {},
    });
    
    if (error) {
      // If the function doesn't exist yet, just log to console
      console.warn('Audit log function not available:', error.message);
    }
  } catch (error) {
    // Don't throw - audit logging should not break the main flow
    console.warn('Failed to log sensitive data access:', error);
  }
};

/**
 * Log when a user reveals an encrypted field
 */
export const logFieldReveal = async (
  userId: string,
  fieldName: string,
  tableName: string,
  recordId?: string
): Promise<void> => {
  return logSensitiveAccess(userId, 'reveal', fieldName, tableName, recordId);
};

/**
 * Log when a user edits an encrypted field
 */
export const logFieldEdit = async (
  userId: string,
  fieldName: string,
  tableName: string,
  recordId?: string
): Promise<void> => {
  return logSensitiveAccess(userId, 'edit', fieldName, tableName, recordId);
};

/**
 * Log when a user exports sensitive data
 */
export const logDataExport = async (
  userId: string,
  tableName: string,
  fields: string[],
  recordIds?: string[]
): Promise<void> => {
  return logSensitiveAccess(userId, 'export', fields.join(','), tableName, recordIds?.join(','), {
    exported_fields: fields,
    record_count: recordIds?.length || 0,
  });
};

/**
 * Get audit log entries for a specific user or record
 * Note: Returns empty array if table doesn't exist yet
 */
export const getAuditLog = async (
  filters: {
    userId?: string;
    tableName?: string;
    recordId?: string;
    action?: AuditAction;
    startDate?: Date;
    endDate?: Date;
  },
  limit: number = 100
): Promise<AuditLogEntry[]> => {
  try {
    const { data, error } = await supabase.rpc('get_audit_log' as any, {
      p_user_id: filters.userId || null,
      p_table_name: filters.tableName || null,
      p_record_id: filters.recordId || null,
      p_action: filters.action || null,
      p_start_date: filters.startDate?.toISOString() || null,
      p_end_date: filters.endDate?.toISOString() || null,
      p_limit: limit,
    });

    if (error) {
      console.warn('Audit log query not available:', error.message);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.warn('Failed to get audit log:', error);
    return [];
  }
};
