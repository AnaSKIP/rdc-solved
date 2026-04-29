// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.4'
  }
  public: {
    Tables: {
      ai_knowledge_base: {
        Row: {
          created_at: string
          difficulty: string
          evidence_text: string | null
          id: string
          objection_type: string
          suggested_response: string
        }
        Insert: {
          created_at?: string
          difficulty: string
          evidence_text?: string | null
          id?: string
          objection_type: string
          suggested_response: string
        }
        Update: {
          created_at?: string
          difficulty?: string
          evidence_text?: string | null
          id?: string
          objection_type?: string
          suggested_response?: string
        }
        Relationships: []
      }
      analysts: {
        Row: {
          CNPJ: string | null
          'COMISSAO - 0 A 9.999,99': number | null
          'COMISSAO - 9.999,99 ACIMA': number | null
          ENDERECO: string | null
          id: string
          MENSALIDADE: number | null
          NOME: string
          TELEFONE: string | null
        }
        Insert: {
          CNPJ?: string | null
          'COMISSAO - 0 A 9.999,99'?: number | null
          'COMISSAO - 9.999,99 ACIMA'?: number | null
          ENDERECO?: string | null
          id?: string
          MENSALIDADE?: number | null
          NOME: string
          TELEFONE?: string | null
        }
        Update: {
          CNPJ?: string | null
          'COMISSAO - 0 A 9.999,99'?: number | null
          'COMISSAO - 9.999,99 ACIMA'?: number | null
          ENDERECO?: string | null
          id?: string
          MENSALIDADE?: number | null
          NOME?: string
          TELEFONE?: string | null
        }
        Relationships: []
      }
      attachments: {
        Row: {
          claim_id: string | null
          created_at: string | null
          file_name: string | null
          file_type: string | null
          id: string
          url: string | null
        }
        Insert: {
          claim_id?: string | null
          created_at?: string | null
          file_name?: string | null
          file_type?: string | null
          id?: string
          url?: string | null
        }
        Update: {
          claim_id?: string | null
          created_at?: string | null
          file_name?: string | null
          file_type?: string | null
          id?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'attachments_claim_id_fkey'
            columns: ['claim_id']
            isOneToOne: false
            referencedRelation: 'claims'
            referencedColumns: ['id']
          },
        ]
      }
      caixa_entrada: {
        Row: {
          ano_causador: string | null
          causador_cpf: string | null
          causador_endereco: string | null
          causador_nome: string | null
          causador_telefone: string | null
          causador_whatsapp: string | null
          cliente_cnpj: string | null
          cliente_nome: string | null
          comparacao_odoo: Json | null
          cor_causador: string | null
          dados_odoo_anteriores: Json | null
          data_acidente: string | null
          data_criacao: string | null
          data_processamento: string | null
          data_transferencia: string | null
          dinamica_acidente: string | null
          documentos_anexados: Json | null
          historico_processamento: Json | null
          hora_acidente: string | null
          id_ra: string
          id_transferencia: string | null
          local_acidente: string | null
          lote_numero: number | null
          modelo_causador: string | null
          placa_causador: string | null
          placa_onibus: string | null
          prefixo_onibus: string | null
          proprietario_veiculo_causador: string | null
          status_conformidade: string | null
          status_processamento: string | null
          texto_extraido_ocr: string | null
          valor_dano_estimado: number | null
        }
        Insert: {
          ano_causador?: string | null
          causador_cpf?: string | null
          causador_endereco?: string | null
          causador_nome?: string | null
          causador_telefone?: string | null
          causador_whatsapp?: string | null
          cliente_cnpj?: string | null
          cliente_nome?: string | null
          comparacao_odoo?: Json | null
          cor_causador?: string | null
          dados_odoo_anteriores?: Json | null
          data_acidente?: string | null
          data_criacao?: string | null
          data_processamento?: string | null
          data_transferencia?: string | null
          dinamica_acidente?: string | null
          documentos_anexados?: Json | null
          historico_processamento?: Json | null
          hora_acidente?: string | null
          id_ra: string
          id_transferencia?: string | null
          local_acidente?: string | null
          lote_numero?: number | null
          modelo_causador?: string | null
          placa_causador?: string | null
          placa_onibus?: string | null
          prefixo_onibus?: string | null
          proprietario_veiculo_causador?: string | null
          status_conformidade?: string | null
          status_processamento?: string | null
          texto_extraido_ocr?: string | null
          valor_dano_estimado?: number | null
        }
        Update: {
          ano_causador?: string | null
          causador_cpf?: string | null
          causador_endereco?: string | null
          causador_nome?: string | null
          causador_telefone?: string | null
          causador_whatsapp?: string | null
          cliente_cnpj?: string | null
          cliente_nome?: string | null
          comparacao_odoo?: Json | null
          cor_causador?: string | null
          dados_odoo_anteriores?: Json | null
          data_acidente?: string | null
          data_criacao?: string | null
          data_processamento?: string | null
          data_transferencia?: string | null
          dinamica_acidente?: string | null
          documentos_anexados?: Json | null
          historico_processamento?: Json | null
          hora_acidente?: string | null
          id_ra?: string
          id_transferencia?: string | null
          local_acidente?: string | null
          lote_numero?: number | null
          modelo_causador?: string | null
          placa_causador?: string | null
          placa_onibus?: string | null
          prefixo_onibus?: string | null
          proprietario_veiculo_causador?: string | null
          status_conformidade?: string | null
          status_processamento?: string | null
          texto_extraido_ocr?: string | null
          valor_dano_estimado?: number | null
        }
        Relationships: []
      }
      caixa_entrada_importacao: {
        Row: {
          analista_atribuido: string | null
          ano_causador: string | null
          causador_cpf: string | null
          causador_endereco: string | null
          causador_nome: string | null
          causador_telefone: string | null
          causador_whatsapp: string | null
          cliente_cnpj: string | null
          cliente_nome: string | null
          cor_causador: string | null
          data_acidente: string | null
          data_criacao: string | null
          data_importacao: string | null
          dinamica_acidente: string | null
          documentos_anexados: Json | null
          hora_acidente: string | null
          id_ra: string
          id_transferencia: string | null
          local_acidente: string | null
          lote_importacao: number | null
          modelo_causador: string | null
          placa_causador: string | null
          placa_onibus: string | null
          prefixo_onibus: string | null
          proprietario_veiculo_causador: string | null
          status_atual: string | null
          status_transferencia: string | null
          status_validacao: string | null
          valor_dano_estimado: number | null
        }
        Insert: {
          analista_atribuido?: string | null
          ano_causador?: string | null
          causador_cpf?: string | null
          causador_endereco?: string | null
          causador_nome?: string | null
          causador_telefone?: string | null
          causador_whatsapp?: string | null
          cliente_cnpj?: string | null
          cliente_nome?: string | null
          cor_causador?: string | null
          data_acidente?: string | null
          data_criacao?: string | null
          data_importacao?: string | null
          dinamica_acidente?: string | null
          documentos_anexados?: Json | null
          hora_acidente?: string | null
          id_ra: string
          id_transferencia?: string | null
          local_acidente?: string | null
          lote_importacao?: number | null
          modelo_causador?: string | null
          placa_causador?: string | null
          placa_onibus?: string | null
          prefixo_onibus?: string | null
          proprietario_veiculo_causador?: string | null
          status_atual?: string | null
          status_transferencia?: string | null
          status_validacao?: string | null
          valor_dano_estimado?: number | null
        }
        Update: {
          analista_atribuido?: string | null
          ano_causador?: string | null
          causador_cpf?: string | null
          causador_endereco?: string | null
          causador_nome?: string | null
          causador_telefone?: string | null
          causador_whatsapp?: string | null
          cliente_cnpj?: string | null
          cliente_nome?: string | null
          cor_causador?: string | null
          data_acidente?: string | null
          data_criacao?: string | null
          data_importacao?: string | null
          dinamica_acidente?: string | null
          documentos_anexados?: Json | null
          hora_acidente?: string | null
          id_ra?: string
          id_transferencia?: string | null
          local_acidente?: string | null
          lote_importacao?: number | null
          modelo_causador?: string | null
          placa_causador?: string | null
          placa_onibus?: string | null
          prefixo_onibus?: string | null
          proprietario_veiculo_causador?: string | null
          status_atual?: string | null
          status_transferencia?: string | null
          status_validacao?: string | null
          valor_dano_estimado?: number | null
        }
        Relationships: []
      }
      'CASOS DIFICEIS': {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      claim_messages: {
        Row: {
          claim_id: string
          content: string | null
          created_at: string | null
          id: string
          is_from_client: boolean | null
          sender_phone: string | null
        }
        Insert: {
          claim_id: string
          content?: string | null
          created_at?: string | null
          id?: string
          is_from_client?: boolean | null
          sender_phone?: string | null
        }
        Update: {
          claim_id?: string
          content?: string | null
          created_at?: string | null
          id?: string
          is_from_client?: boolean | null
          sender_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'claim_messages_claim_id_fkey'
            columns: ['claim_id']
            isOneToOne: false
            referencedRelation: 'claims'
            referencedColumns: ['id']
          },
        ]
      }
      claims: {
        Row: {
          agreement_generated: boolean | null
          agreement_notes: string | null
          agreement_signed: boolean | null
          analyst_id: string | null
          causer_ano: string | null
          causer_claim_number: string | null
          causer_document: string | null
          causer_endereco: string | null
          causer_modelo: string | null
          causer_name: string | null
          causer_whatsapp: string | null
          client_claim_number: string | null
          client_id: string | null
          created_at: string | null
          data_finalizacao: string | null
          data_prescricao: string | null
          data_ultima_tentativa: string | null
          date: string | null
          financial_commission_value: number | null
          financial_fixed_value: number | null
          financial_total_value: number | null
          forma_pagamento: string | null
          has_positive_interaction: boolean | null
          id: string
          installments: Json | null
          insurance_id: string | null
          is_enriched: boolean | null
          is_validated: boolean | null
          judicial_process_number: string | null
          judicial_status: string | null
          motivo_finalizacao: string | null
          motorista_onibus: string | null
          phone: string | null
          placa_causador: string | null
          placa_onibus: string | null
          prefixo_onibus: string | null
          probability: number | null
          proprietario_veiculo_causador: string | null
          proxima_tentativa_repescagem: string | null
          ra: string
          relato_acidente: string | null
          return_scheduled_at: string | null
          return_subject: string | null
          stage: string | null
          status: string | null
          tags: string[] | null
          tipo_veiculo_causador: string | null
          vistoria_date: string | null
          vistoria_link: string | null
        }
        Insert: {
          agreement_generated?: boolean | null
          agreement_notes?: string | null
          agreement_signed?: boolean | null
          analyst_id?: string | null
          causer_ano?: string | null
          causer_claim_number?: string | null
          causer_document?: string | null
          causer_endereco?: string | null
          causer_modelo?: string | null
          causer_name?: string | null
          causer_whatsapp?: string | null
          client_claim_number?: string | null
          client_id?: string | null
          created_at?: string | null
          data_finalizacao?: string | null
          data_prescricao?: string | null
          data_ultima_tentativa?: string | null
          date?: string | null
          financial_commission_value?: number | null
          financial_fixed_value?: number | null
          financial_total_value?: number | null
          forma_pagamento?: string | null
          has_positive_interaction?: boolean | null
          id?: string
          installments?: Json | null
          insurance_id?: string | null
          is_enriched?: boolean | null
          is_validated?: boolean | null
          judicial_process_number?: string | null
          judicial_status?: string | null
          motivo_finalizacao?: string | null
          motorista_onibus?: string | null
          phone?: string | null
          placa_causador?: string | null
          placa_onibus?: string | null
          prefixo_onibus?: string | null
          probability?: number | null
          proprietario_veiculo_causador?: string | null
          proxima_tentativa_repescagem?: string | null
          ra: string
          relato_acidente?: string | null
          return_scheduled_at?: string | null
          return_subject?: string | null
          stage?: string | null
          status?: string | null
          tags?: string[] | null
          tipo_veiculo_causador?: string | null
          vistoria_date?: string | null
          vistoria_link?: string | null
        }
        Update: {
          agreement_generated?: boolean | null
          agreement_notes?: string | null
          agreement_signed?: boolean | null
          analyst_id?: string | null
          causer_ano?: string | null
          causer_claim_number?: string | null
          causer_document?: string | null
          causer_endereco?: string | null
          causer_modelo?: string | null
          causer_name?: string | null
          causer_whatsapp?: string | null
          client_claim_number?: string | null
          client_id?: string | null
          created_at?: string | null
          data_finalizacao?: string | null
          data_prescricao?: string | null
          data_ultima_tentativa?: string | null
          date?: string | null
          financial_commission_value?: number | null
          financial_fixed_value?: number | null
          financial_total_value?: number | null
          forma_pagamento?: string | null
          has_positive_interaction?: boolean | null
          id?: string
          installments?: Json | null
          insurance_id?: string | null
          is_enriched?: boolean | null
          is_validated?: boolean | null
          judicial_process_number?: string | null
          judicial_status?: string | null
          motivo_finalizacao?: string | null
          motorista_onibus?: string | null
          phone?: string | null
          placa_causador?: string | null
          placa_onibus?: string | null
          prefixo_onibus?: string | null
          probability?: number | null
          proprietario_veiculo_causador?: string | null
          proxima_tentativa_repescagem?: string | null
          ra?: string
          relato_acidente?: string | null
          return_scheduled_at?: string | null
          return_subject?: string | null
          stage?: string | null
          status?: string | null
          tags?: string[] | null
          tipo_veiculo_causador?: string | null
          vistoria_date?: string | null
          vistoria_link?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          AGÊNCIA: string | null
          BANCO: string | null
          CEP: string | null
          'CHAVE PIX': string | null
          CIDADE: string | null
          CNPJ: string | null
          COMISSÃO: number | null
          CONTA: string | null
          created_at: string
          ENDEREÇO: string | null
          id: string
          is_enriched: boolean | null
          'RAZÃO SOCIAL': string
          STATUS: string | null
          TELEFONE: string | null
          UF: string | null
        }
        Insert: {
          AGÊNCIA?: string | null
          BANCO?: string | null
          CEP?: string | null
          'CHAVE PIX'?: string | null
          CIDADE?: string | null
          CNPJ?: string | null
          COMISSÃO?: number | null
          CONTA?: string | null
          created_at?: string
          ENDEREÇO?: string | null
          id?: string
          is_enriched?: boolean | null
          'RAZÃO SOCIAL': string
          STATUS?: string | null
          TELEFONE?: string | null
          UF?: string | null
        }
        Update: {
          AGÊNCIA?: string | null
          BANCO?: string | null
          CEP?: string | null
          'CHAVE PIX'?: string | null
          CIDADE?: string | null
          CNPJ?: string | null
          COMISSÃO?: number | null
          CONTA?: string | null
          created_at?: string
          ENDEREÇO?: string | null
          id?: string
          is_enriched?: boolean | null
          'RAZÃO SOCIAL'?: string
          STATUS?: string | null
          TELEFONE?: string | null
          UF?: string | null
        }
        Relationships: []
      }
      financial_transactions: {
        Row: {
          amount: number
          category: string
          claim_id: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          status: string | null
          type: string
        }
        Insert: {
          amount?: number
          category: string
          claim_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string | null
          type: string
        }
        Update: {
          amount?: number
          category?: string
          claim_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: 'financial_transactions_claim_id_fkey'
            columns: ['claim_id']
            isOneToOne: false
            referencedRelation: 'claims'
            referencedColumns: ['id']
          },
        ]
      }
      insurers: {
        Row: {
          CEP: string | null
          CIDADE: string | null
          CNPJ: string | null
          created_at: string
          DF: string | null
          ENDERECO: string | null
          id: string
          NOME: string | null
          TELEFONE: string | null
        }
        Insert: {
          CEP?: string | null
          CIDADE?: string | null
          CNPJ?: string | null
          created_at?: string
          DF?: string | null
          ENDERECO?: string | null
          id?: string
          NOME?: string | null
          TELEFONE?: string | null
        }
        Update: {
          CEP?: string | null
          CIDADE?: string | null
          CNPJ?: string | null
          created_at?: string
          DF?: string | null
          ENDERECO?: string | null
          id?: string
          NOME?: string | null
          TELEFONE?: string | null
        }
        Relationships: []
      }
      internal_messages: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          sender_email: string | null
          sender_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          sender_email?: string | null
          sender_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          sender_email?: string | null
          sender_id?: string | null
        }
        Relationships: []
      }
      internal_team: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          role: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          role?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          role?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          analista_id: string | null
          created_at: string | null
          data_entrada: string | null
          empresa: string | null
          id: string
          ra: string | null
          status: string | null
          valor: number | null
        }
        Insert: {
          analista_id?: string | null
          created_at?: string | null
          data_entrada?: string | null
          empresa?: string | null
          id?: string
          ra?: string | null
          status?: string | null
          valor?: number | null
        }
        Update: {
          analista_id?: string | null
          created_at?: string | null
          data_entrada?: string | null
          empresa?: string | null
          id?: string
          ra?: string | null
          status?: string | null
          valor?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          is_admin: boolean | null
          name: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          is_admin?: boolean | null
          name?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_admin?: boolean | null
          name?: string | null
        }
        Relationships: []
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

// ====== DATABASE EXTENDED CONTEXT (auto-generated) ======
// This section contains actual PostgreSQL column types, constraints, RLS policies,
// functions, triggers, indexes and materialized views not present in the type definitions above.
// IMPORTANT: The TypeScript types above map UUID, TEXT, VARCHAR all to "string".
// Use the COLUMN TYPES section below to know the real PostgreSQL type for each column.
// Always use the correct PostgreSQL type when writing SQL migrations.

// --- COLUMN TYPES (actual PostgreSQL types) ---
// Use this to know the real database type when writing migrations.
// "string" in TypeScript types above may be uuid, text, varchar, timestamptz, etc.
// Table: CASOS DIFICEIS
//   id: bigint (not null)
//   created_at: timestamp with time zone (not null, default: now())
// Table: ai_knowledge_base
//   id: uuid (not null, default: gen_random_uuid())
//   objection_type: text (not null)
//   difficulty: text (not null)
//   suggested_response: text (not null)
//   evidence_text: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
// Table: analysts
//   id: uuid (not null, default: gen_random_uuid())
//   NOME: text (not null)
//   CNPJ: text (nullable)
//   TELEFONE: text (nullable)
//   ENDERECO: text (nullable)
//   MENSALIDADE: numeric (nullable)
//   COMISSAO - 0 A 9.999,99: numeric (nullable)
//   COMISSAO - 9.999,99 ACIMA: numeric (nullable)
// Table: attachments
//   id: uuid (not null, default: gen_random_uuid())
//   claim_id: uuid (nullable)
//   file_name: text (nullable)
//   file_type: text (nullable)
//   url: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: caixa_entrada
//   id_ra: text (not null)
//   cliente_nome: text (nullable)
//   cliente_cnpj: text (nullable)
//   placa_onibus: text (nullable)
//   prefixo_onibus: text (nullable)
//   causador_nome: text (nullable)
//   causador_cpf: text (nullable)
//   causador_telefone: text (nullable)
//   causador_whatsapp: text (nullable)
//   causador_endereco: text (nullable)
//   proprietario_veiculo_causador: text (nullable)
//   placa_causador: text (nullable)
//   modelo_causador: text (nullable)
//   ano_causador: text (nullable)
//   cor_causador: text (nullable)
//   data_acidente: date (nullable)
//   hora_acidente: time without time zone (nullable)
//   local_acidente: text (nullable)
//   dinamica_acidente: text (nullable)
//   valor_dano_estimado: numeric (nullable)
//   status_processamento: text (nullable, default: 'AGUARDANDO PROCESSAMENTO'::text)
//   status_conformidade: text (nullable, default: 'PENDENTE'::text)
//   documentos_anexados: jsonb (nullable, default: '[]'::jsonb)
//   texto_extraido_ocr: text (nullable)
//   dados_odoo_anteriores: jsonb (nullable)
//   comparacao_odoo: jsonb (nullable)
//   historico_processamento: jsonb (nullable, default: '[]'::jsonb)
//   data_criacao: timestamp with time zone (nullable, default: now())
//   data_processamento: timestamp with time zone (nullable)
//   id_transferencia: uuid (nullable)
//   data_transferencia: timestamp with time zone (nullable)
//   lote_numero: integer (nullable)
// Table: caixa_entrada_importacao
//   id_ra: text (not null)
//   cliente_nome: text (nullable)
//   cliente_cnpj: text (nullable)
//   placa_onibus: text (nullable)
//   prefixo_onibus: text (nullable)
//   causador_nome: text (nullable)
//   causador_cpf: text (nullable)
//   causador_telefone: text (nullable)
//   causador_whatsapp: text (nullable)
//   causador_endereco: text (nullable)
//   proprietario_veiculo_causador: text (nullable)
//   placa_causador: text (nullable)
//   modelo_causador: text (nullable)
//   ano_causador: text (nullable)
//   cor_causador: text (nullable)
//   data_acidente: date (nullable)
//   hora_acidente: time without time zone (nullable)
//   local_acidente: text (nullable)
//   dinamica_acidente: text (nullable)
//   valor_dano_estimado: numeric (nullable)
//   status_atual: text (nullable)
//   status_validacao: text (nullable, default: 'VÁLIDO'::text)
//   status_transferencia: text (nullable, default: 'PENDENTE'::text)
//   analista_atribuido: text (nullable)
//   documentos_anexados: jsonb (nullable, default: '[]'::jsonb)
//   data_criacao: timestamp with time zone (nullable, default: now())
//   data_importacao: timestamp with time zone (nullable, default: now())
//   lote_importacao: integer (nullable)
//   id_transferencia: uuid (nullable)
// Table: claim_messages
//   id: uuid (not null, default: gen_random_uuid())
//   claim_id: uuid (not null)
//   sender_phone: text (nullable)
//   content: text (nullable)
//   is_from_client: boolean (nullable, default: true)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: claims
//   id: uuid (not null, default: gen_random_uuid())
//   ra: text (not null)
//   stage: text (nullable)
//   status: text (nullable)
//   date: timestamp with time zone (nullable, default: now())
//   created_at: timestamp with time zone (nullable, default: now())
//   client_id: text (nullable)
//   causer_name: text (nullable)
//   analyst_id: text (nullable)
//   insurance_id: text (nullable)
//   phone: text (nullable)
//   placa_onibus: text (nullable)
//   prefixo_onibus: text (nullable)
//   motorista_onibus: text (nullable)
//   placa_causador: text (nullable)
//   tipo_veiculo_causador: text (nullable)
//   relato_acidente: text (nullable)
//   return_scheduled_at: timestamp with time zone (nullable)
//   is_validated: boolean (nullable, default: false)
//   has_positive_interaction: boolean (nullable, default: false)
//   vistoria_date: timestamp with time zone (nullable)
//   vistoria_link: text (nullable)
//   judicial_process_number: text (nullable)
//   judicial_status: text (nullable)
//   agreement_notes: text (nullable)
//   agreement_signed: boolean (nullable, default: false)
//   agreement_generated: boolean (nullable, default: false)
//   tags: _text (nullable, default: '{}'::text[])
//   financial_total_value: numeric (nullable, default: 0)
//   financial_fixed_value: numeric (nullable, default: 0)
//   financial_commission_value: numeric (nullable, default: 0)
//   installments: jsonb (nullable, default: '[]'::jsonb)
//   probability: numeric (nullable, default: 0)
//   causer_document: text (nullable)
//   return_subject: text (nullable)
//   causer_claim_number: text (nullable)
//   client_claim_number: text (nullable)
//   is_enriched: boolean (nullable, default: false)
//   causer_modelo: text (nullable)
//   causer_ano: text (nullable)
//   causer_whatsapp: text (nullable)
//   causer_endereco: text (nullable)
//   proprietario_veiculo_causador: text (nullable)
//   data_prescricao: timestamp with time zone (nullable)
//   forma_pagamento: text (nullable)
//   data_ultima_tentativa: timestamp with time zone (nullable)
//   proxima_tentativa_repescagem: timestamp with time zone (nullable)
//   motivo_finalizacao: text (nullable)
//   data_finalizacao: timestamp with time zone (nullable)
// Table: clients
//   id: uuid (not null, default: gen_random_uuid())
//   RAZÃO SOCIAL: text (not null)
//   CNPJ: text (nullable)
//   ENDEREÇO: text (nullable)
//   TELEFONE: text (nullable)
//   COMISSÃO: numeric (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   CEP: text (nullable)
//   CIDADE: text (nullable)
//   UF: text (nullable)
//   BANCO: text (nullable)
//   CONTA: text (nullable)
//   CHAVE PIX: text (nullable)
//   STATUS: text (nullable)
//   AGÊNCIA: text (nullable)
//   is_enriched: boolean (nullable, default: false)
// Table: financial_transactions
//   id: uuid (not null, default: gen_random_uuid())
//   type: text (not null)
//   category: text (not null)
//   amount: numeric (not null, default: 0)
//   description: text (nullable)
//   due_date: timestamp with time zone (nullable)
//   status: text (nullable, default: 'pending'::text)
//   claim_id: uuid (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: insurers
//   id: uuid (not null, default: gen_random_uuid())
//   NOME: text (nullable)
//   TELEFONE: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   CNPJ: text (nullable)
//   ENDERECO: text (nullable)
//   CIDADE: text (nullable)
//   DF: text (nullable)
//   CEP: text (nullable)
// Table: internal_messages
//   id: uuid (not null, default: gen_random_uuid())
//   sender_id: uuid (nullable)
//   sender_email: text (nullable)
//   content: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: internal_team
//   id: uuid (not null, default: gen_random_uuid())
//   name: text (not null)
//   phone: text (nullable)
//   address: text (nullable)
//   email: text (nullable)
//   role: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
// Table: leads
//   id: uuid (not null, default: gen_random_uuid())
//   ra: text (nullable)
//   empresa: text (nullable)
//   valor: numeric (nullable)
//   status: text (nullable)
//   data_entrada: timestamp with time zone (nullable)
//   analista_id: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: profiles
//   id: uuid (not null)
//   email: text (not null)
//   name: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   is_admin: boolean (nullable, default: false)

// --- CONSTRAINTS ---
// Table: CASOS DIFICEIS
//   PRIMARY KEY CASOS DIFICEIS_pkey: PRIMARY KEY (id)
// Table: ai_knowledge_base
//   PRIMARY KEY ai_knowledge_base_pkey: PRIMARY KEY (id)
// Table: analysts
//   PRIMARY KEY analysts_pkey: PRIMARY KEY (id)
// Table: attachments
//   FOREIGN KEY attachments_claim_id_fkey: FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE
//   PRIMARY KEY attachments_pkey: PRIMARY KEY (id)
// Table: caixa_entrada
//   PRIMARY KEY caixa_entrada_pkey: PRIMARY KEY (id_ra)
// Table: caixa_entrada_importacao
//   PRIMARY KEY caixa_entrada_importacao_pkey: PRIMARY KEY (id_ra)
// Table: claim_messages
//   FOREIGN KEY claim_messages_claim_id_fkey: FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE
//   PRIMARY KEY claim_messages_pkey: PRIMARY KEY (id)
// Table: claims
//   PRIMARY KEY claims_pkey: PRIMARY KEY (id)
//   UNIQUE claims_ra_date_placa_key: UNIQUE (ra, date, placa_causador)
// Table: clients
//   PRIMARY KEY clients_pkey: PRIMARY KEY (id)
// Table: financial_transactions
//   FOREIGN KEY financial_transactions_claim_id_fkey: FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE SET NULL
//   PRIMARY KEY financial_transactions_pkey: PRIMARY KEY (id)
//   CHECK financial_transactions_type_check: CHECK ((type = ANY (ARRAY['income'::text, 'expense'::text, 'provision'::text])))
// Table: insurers
//   PRIMARY KEY insurers_pkey: PRIMARY KEY (id)
// Table: internal_messages
//   PRIMARY KEY internal_messages_pkey: PRIMARY KEY (id)
// Table: internal_team
//   PRIMARY KEY internal_team_pkey: PRIMARY KEY (id)
// Table: leads
//   PRIMARY KEY leads_pkey: PRIMARY KEY (id)
// Table: profiles
//   FOREIGN KEY profiles_id_fkey: FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
//   PRIMARY KEY profiles_pkey: PRIMARY KEY (id)

// --- ROW LEVEL SECURITY POLICIES ---
// Table: ai_knowledge_base
//   Policy "Authenticated Access AI KB" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
//   Policy "Public Access AI KB" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
// Table: analysts
//   Policy "Public Access Analysts" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
//   Policy "authenticated_delete_analysts" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "authenticated_insert_analysts" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "authenticated_select_analysts" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "authenticated_update_analysts" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: attachments
//   Policy "Authenticated Access Attachments" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
//   Policy "Public Access Attachments" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
// Table: caixa_entrada
//   Policy "auth_all_caixa_entrada" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: caixa_entrada_importacao
//   Policy "auth_all_caixa_entrada_importacao" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: claim_messages
//   Policy "Authenticated Access Claim Messages" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
//   Policy "Public Access Claim Messages" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
// Table: claims
//   Policy "Authenticated Access Claims" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
//   Policy "Public Access Claims" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
// Table: clients
//   Policy "Public Access Clients" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
//   Policy "authenticated_delete_clients" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "authenticated_insert_clients" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "authenticated_select_clients" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "authenticated_update_clients" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: financial_transactions
//   Policy "Authenticated Access Financial" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
//   Policy "Public Access Financial" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
// Table: insurers
//   Policy "Public Access Insurers" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
//   Policy "authenticated_delete_insurers" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "authenticated_insert_insurers" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "authenticated_select_insurers" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "authenticated_update_insurers" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: internal_messages
//   Policy "Authenticated Access Internal Messages" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
//   Policy "Public Access Internal Messages" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
// Table: internal_team
//   Policy "Public Access Internal Team" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
//   Policy "authenticated_delete_internal_team" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "authenticated_insert_internal_team" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "authenticated_select_internal_team" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "authenticated_update_internal_team" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: leads
//   Policy "anon_all_leads" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
//   Policy "authenticated_all_leads" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: profiles
//   Policy "Users can read own profile" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (auth.uid() = id)
//   Policy "Users can update own profile" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (auth.uid() = id)

// --- WARNING: TABLES WITH RLS ENABLED BUT NO POLICIES ---
// These tables have Row Level Security enabled but NO policies defined.
// This means ALL queries (SELECT, INSERT, UPDATE, DELETE) will return ZERO rows
// for non-superuser roles (including the anon and authenticated roles used by the app).
// You MUST create RLS policies for these tables to allow data access.
//   - CASOS DIFICEIS

// --- DATABASE FUNCTIONS ---
// FUNCTION format_claim_ra()
//   CREATE OR REPLACE FUNCTION public.format_claim_ra()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//       client_cnpj TEXT;
//   BEGIN
//       -- Obter o CNPJ do cliente selecionado
//       IF NEW.client_id IS NOT NULL THEN
//           SELECT "CNPJ" INTO client_cnpj FROM public.clients WHERE id::text = NEW.client_id LIMIT 1;
//
//           IF client_cnpj IS NOT NULL AND client_cnpj != '' THEN
//               -- Anexar o CNPJ caso ainda não esteja presente
//               IF NEW.ra NOT LIKE '%' || client_cnpj || '%' THEN
//                   NEW.ra := NEW.ra || '-' || client_cnpj;
//               END IF;
//
//               -- Garantir o padrão de prefixo 'RA - '
//               IF NEW.ra NOT ILIKE 'RA%' THEN
//                   NEW.ra := 'RA - ' || NEW.ra;
//               END IF;
//           END IF;
//       END IF;
//
//       RETURN NEW;
//   END;
//   $function$
//
// FUNCTION handle_new_user()
//   CREATE OR REPLACE FUNCTION public.handle_new_user()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     INSERT INTO public.profiles (id, email, name)
//     VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name')
//     ON CONFLICT (id) DO NOTHING;
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION rls_auto_enable()
//   CREATE OR REPLACE FUNCTION public.rls_auto_enable()
//    RETURNS event_trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//    SET search_path TO 'pg_catalog'
//   AS $function$
//   DECLARE
//     cmd record;
//   BEGIN
//     FOR cmd IN
//       SELECT *
//       FROM pg_event_trigger_ddl_commands()
//       WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
//         AND object_type IN ('table','partitioned table')
//     LOOP
//        IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
//         BEGIN
//           EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
//           RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
//         EXCEPTION
//           WHEN OTHERS THEN
//             RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
//         END;
//        ELSE
//           RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
//        END IF;
//     END LOOP;
//   END;
//   $function$
//
// FUNCTION sync_lead_to_claim()
//   CREATE OR REPLACE FUNCTION public.sync_lead_to_claim()
//    RETURNS trigger
//    LANGUAGE plpgsql
//   AS $function$
//     BEGIN
//       INSERT INTO public.claims (
//         ra,
//         causer_name,
//         financial_total_value,
//         stage,
//         date,
//         analyst_id
//       ) VALUES (
//         COALESCE(NEW.ra, 'RA-' || substr(gen_random_uuid()::text, 1, 6)),
//         NEW.empresa,
//         NEW.valor,
//         COALESCE(NEW.status, 'Atribuir'),
//         COALESCE(NEW.data_entrada, NOW()),
//         NEW.analista_id
//       );
//       RETURN NEW;
//     END;
//     $function$
//

// --- TRIGGERS ---
// Table: claims
//   trigger_format_claim_ra: CREATE TRIGGER trigger_format_claim_ra BEFORE INSERT OR UPDATE OF client_id, ra ON public.claims FOR EACH ROW EXECUTE FUNCTION format_claim_ra()
// Table: leads
//   on_lead_inserted: CREATE TRIGGER on_lead_inserted AFTER INSERT ON public.leads FOR EACH ROW EXECUTE FUNCTION sync_lead_to_claim()

// --- INDEXES ---
// Table: claim_messages
//   CREATE INDEX claim_messages_claim_id_idx ON public.claim_messages USING btree (claim_id)
// Table: claims
//   CREATE UNIQUE INDEX claims_ra_date_placa_key ON public.claims USING btree (ra, date, placa_causador)
