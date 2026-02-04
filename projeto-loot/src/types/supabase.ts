/**
 * Supabase generated types. Regenerate with:
 *   supabase login && supabase link --project-ref YOUR_REF
 *   npm run supabase:types
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: Record<string, unknown>;
    Views: Record<string, unknown>;
    Functions: Record<string, unknown>;
    Enums: Record<string, unknown>;
  };
}
