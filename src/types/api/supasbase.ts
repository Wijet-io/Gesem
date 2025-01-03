export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      employees: {
        Row: {
          id: string
          first_name: string
          last_name: string
          normal_rate: number
          extra_rate: number
          min_hours: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name: string
          last_name: string
          normal_rate: number
          extra_rate: number
          min_hours: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Database['public']['Tables']['employees']['Insert'], 'id'>>
      }
      settings: {
        Row: {
          key: string
          value: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          key: string
          value: Json
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['settings']['Insert']>
      }
    }
  }
}