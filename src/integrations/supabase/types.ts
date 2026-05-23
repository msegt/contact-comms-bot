export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// src/integrations/supabase/types.ts

export type EstadoMensaje = 'pendiente' | 'enviado' | 'entregado' | 'leido' | 'error';
export type TipoMiembro = 'propietario' | 'inquilino' | 'presidente' | 'administrador'; 

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.5" }
  public: {
    Tables: {
      clientes: {
        Row: {
          id: string; nombre: string; apellidos: string;
          direccion: string | null; numero: string | null; piso: string | null;
          puerta: string | null; codigo_postal: string | null;
          municipio: string | null; provincia: string | null;
          telefono_fijo: string | null; telefono_movil: string | null;
          email: string | null; anotaciones: string | null;
          created_at: string; updated_at: string;
        }
        Insert: { nombre: string; apellidos: string; [key: string]: unknown }
        Update: Partial<Database['public']['Tables']['clientes']['Row']>
        Relationships: []
      }
      comunidades: {
        Row: {
          id: string; nombre: string; direccion: string | null;
          codigo_postal: string | null; municipio: string | null;
          provincia: string | null; tiene_ascensor: boolean;
          anotaciones: string | null; created_at: string; updated_at: string;
        }
        Insert: { nombre: string; [key: string]: unknown }
        Update: Partial<Database['public']['Tables']['comunidades']['Row']>
        Relationships: []
      }
      comunidad_clientes: {
        Row: {
          id: string; comunidad_id: string; cliente_id: string;
          tipo: string; es_pagador: boolean;
          piso: string | null; puerta: string | null;
          anotaciones: string | null; created_at: string; updated_at: string;
        }
        Insert: { comunidad_id: string; cliente_id: string; tipo: string; [key: string]: unknown }
        Update: Partial<Database['public']['Tables']['comunidad_clientes']['Row']>
        Relationships: [
          { foreignKeyName: "comunidad_clientes_comunidad_id_fkey"; columns: ["comunidad_id"]; referencedRelation: "comunidades"; referencedColumns: ["id"] },
          { foreignKeyName: "comunidad_clientes_cliente_id_fkey"; columns: ["cliente_id"]; referencedRelation: "clientes"; referencedColumns: ["id"] }
        ]
      }
      mensajes_whatsapp: {
        Row: {
          id: string; cliente_id: string; nombre_cliente: string;
          comunidad_id: string | null; telefono_destino: string;
          mensaje: string; estado: EstadoMensaje;
          whatsapp_message_id: string | null;
          enviado_at: string | null; entregado_at: string | null;
          leido_at: string | null; error_detalle: string | null;
          created_at: string; updated_at: string;
        }
        Insert: { cliente_id: string; nombre_cliente: string; telefono_destino: string; mensaje: string; [key: string]: unknown }
        Update: Partial<Database['public']['Tables']['mensajes_whatsapp']['Row']>
        Relationships: [
          { foreignKeyName: "mensajes_whatsapp_cliente_id_fkey"; columns: ["cliente_id"]; referencedRelation: "clientes"; referencedColumns: ["id"] },
          { foreignKeyName: "mensajes_whatsapp_comunidad_id_fkey"; columns: ["comunidad_id"]; referencedRelation: "comunidades"; referencedColumns: ["id"] }
        ]
      }
      polizas_seguros: {
        Row: {
          id: string; comunidad_id: string; aseguradora: string;
          numero_poliza: string; tipo_cobertura: string | null;
          fecha_inicio: string | null; fecha_vencimiento: string | null;
          importe_anual: number | null; anotaciones: string | null;
          created_at: string; updated_at: string;
        }
        Insert: { comunidad_id: string; aseguradora: string; numero_poliza: string; [key: string]: unknown }
        Update: Partial<Database['public']['Tables']['polizas_seguros']['Row']>
        Relationships: [
          { foreignKeyName: "polizas_seguros_comunidad_id_fkey"; columns: ["comunidad_id"]; referencedRelation: "comunidades"; referencedColumns: ["id"] }
        ]
      }
    }

    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
