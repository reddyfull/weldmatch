// services/encryptedDataService.ts
import { supabase } from '@/integrations/supabase/client';
import { encryptFields, decryptFields } from '@/lib/encryption';
import { getEncryptedFieldsForTable } from '@/lib/encryptedFields';
import type { Database } from '@/integrations/supabase/types';

type TableName = keyof Database['public']['Tables'];

export class EncryptedDataService<TName extends TableName> {
  private tableName: TName;
  private encryptedFields: string[];

  constructor(tableName: TName) {
    this.tableName = tableName;
    this.encryptedFields = getEncryptedFieldsForTable(tableName);
  }

  /**
   * Fetch and decrypt a single record by ID
   */
  async getById<T extends Record<string, any>>(
    id: string,
    userId: string
  ): Promise<T | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id' as any, id)
      .single();

    if (error) throw error;
    if (!data) return null;

    // Decrypt sensitive fields
    return decryptFields(data as unknown as T, this.encryptedFields, userId);
  }

  /**
   * Fetch and decrypt a single record by user_id
   */
  async getByUserId<T extends Record<string, any>>(
    userId: string
  ): Promise<T | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('user_id' as any, userId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    // Decrypt sensitive fields
    return decryptFields(data as unknown as T, this.encryptedFields, userId);
  }

  /**
   * Fetch and decrypt multiple records
   */
  async getAll<T extends Record<string, any>>(
    userId: string,
    query?: Record<string, any>
  ): Promise<T[]> {
    let queryBuilder = supabase.from(this.tableName).select('*');

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        queryBuilder = queryBuilder.eq(key as any, value);
      });
    }

    const { data, error } = await queryBuilder;

    if (error) throw error;
    if (!data) return [];

    // Decrypt each record
    return data.map((record) =>
      decryptFields(record as unknown as T, this.encryptedFields, userId)
    );
  }

  /**
   * Encrypt and insert a new record
   */
  async create<T extends Record<string, any>>(
    data: Partial<T>,
    userId: string
  ): Promise<T> {
    // Encrypt sensitive fields before saving
    const encryptedData = encryptFields(
      data as T,
      this.encryptedFields,
      userId
    );

    const { data: created, error } = await supabase
      .from(this.tableName)
      .insert(encryptedData as any)
      .select()
      .single();

    if (error) throw error;

    // Return decrypted version
    return decryptFields(created as unknown as T, this.encryptedFields, userId);
  }

  /**
   * Encrypt and update a record
   */
  async update<T extends Record<string, any>>(
    id: string,
    data: Partial<T>,
    userId: string
  ): Promise<T> {
    // Only encrypt fields that are being updated
    const fieldsToEncrypt = this.encryptedFields.filter(
      (field) => field in data
    );
    const encryptedData = encryptFields(
      data as T,
      fieldsToEncrypt,
      userId
    );

    const { data: updated, error } = await supabase
      .from(this.tableName)
      .update(encryptedData as any)
      .eq('id' as any, id)
      .select()
      .single();

    if (error) throw error;

    // Return decrypted version
    return decryptFields(updated as unknown as T, this.encryptedFields, userId);
  }

  /**
   * Encrypt and update a record by user_id
   */
  async updateByUserId<T extends Record<string, any>>(
    userId: string,
    data: Partial<T>
  ): Promise<T> {
    // Only encrypt fields that are being updated
    const fieldsToEncrypt = this.encryptedFields.filter(
      (field) => field in data
    );
    const encryptedData = encryptFields(
      data as T,
      fieldsToEncrypt,
      userId
    );

    const { data: updated, error } = await supabase
      .from(this.tableName)
      .update(encryptedData as any)
      .eq('user_id' as any, userId)
      .select()
      .single();

    if (error) throw error;

    // Return decrypted version
    return decryptFields(updated as unknown as T, this.encryptedFields, userId);
  }

  /**
   * Delete a record (no encryption needed)
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id' as any, id);

    if (error) throw error;
  }
}

// Pre-configured services for common tables
export const welderProfileService = new EncryptedDataService('welder_profiles');
export const employerProfileService = new EncryptedDataService('employer_profiles');
export const certificationService = new EncryptedDataService('certifications');
