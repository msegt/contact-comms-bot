export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      clientes: {
        Row: {
          id: string;
          Codigo: string | null;
          id_persona: string | null;
          Nombre: string | null;
          NIF: string | null;
          Fdenominacion: string | null;
          Coeficiente: number | null;
          Direccion: string | null;
          Cpostal: string | null;
          TelefonoFijo: string | null;
          Email: string | null;
          Movil: string | null;
          Web: string | null;
          Fax: string | null;
          Cuenta: string | null;
          pagadores: string | null;
          NEMP: string | null;
          fecha_baja: string | null;
          coddistri: string | null;
          Nomdistri: string | null;
          bloque: string | null;
          BajoNombre: string | null;
          BajoNIF: string | null;
          BajoFdenominacion: string | null;
          Notas: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          Codigo?: string | null;
          id_persona?: string | null;
          Nombre?: string | null;
          NIF?: string | null;
          Fdenominacion?: string | null;
          Coeficiente?: number | null;
          Direccion?: string | null;
          Cpostal?: string | null;
          TelefonoFijo?: string | null;
          Email?: string | null;
          Movil?: string | null;
          Web?: string | null;
          Fax?: string | null;
          Cuenta?: string | null;
          pagadores?: string | null;
          NEMP?: string | null;
          fecha_baja?: string | null;
          coddistri?: string | null;
          Nomdistri?: string | null;
          bloque?: string | null;
          BajoNombre?: string | null;
          BajoNIF?: string | null;
          BajoFdenominacion?: string | null;
          Notas?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['clientes']['Insert']>;
        Relationships: [];
      };
      mensajes_whatsapp: {
        Row: {
          id: string;
          cliente_id: string;
          nombre_cliente: string;
          comunidad_id: string | null;
          telefono_destino: string;
          mensaje: string;
          estado: string;
          whatsapp_message_id: string | null;
          enviado_at: string | null;
          entregado_at: string | null;
          leido_at: string | null;
          error_detalle: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cliente_id: string;
          nombre_cliente: string;
          comunidad_id?: string | null;
          telefono_destino: string;
          mensaje: string;
          estado?: string;
          whatsapp_message_id?: string | null;
          enviado_at?: string | null;
          entregado_at?: string | null;
          leido_at?: string | null;
          error_detalle?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['mensajes_whatsapp']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'mensajes_whatsapp_cliente_id_fkey';
            columns: ['cliente_id'];
            referencedRelation: 'clientes';
            referencedColumns: ['id'];
          }
        ];
      };
      mensajes_entrantes: {
        Row: {
          id: string;
          whatsapp_message_id: string | null;
          from_phone: string;
          message_body: string | null;
          received_at: string;
        };
        Insert: {
          id?: string;
          whatsapp_message_id?: string | null;
          from_phone: string;
          message_body?: string | null;
          received_at?: string;
        };
        Update: Partial<Database['public']['Tables']['mensajes_entrantes']['Insert']>;
        Relationships: [];
      };
      comunidades: {
        Row: {
          id: string;
          nombre: string;
          direccion: string | null;
          codigo_postal: string | null;
          municipio: string | null;
          provincia: string | null;
          tiene_ascensor: boolean;
          anotaciones: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          direccion?: string | null;
          codigo_postal?: string | null;
          municipio?: string | null;
          provincia?: string | null;
          tiene_ascensor?: boolean;
          anotaciones?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['comunidades']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      estado_mensaje: 'pendiente' | 'enviado' | 'entregado' | 'leido' | 'error';
    };
  };
};
