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
          comprovante_endereco_url: string | null
          contrato_prestacao_servicos_url: string | null
          documento_identidade_url: string | null
          email: string | null
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
          comprovante_endereco_url?: string | null
          contrato_prestacao_servicos_url?: string | null
          documento_identidade_url?: string | null
          email?: string | null
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
          comprovante_endereco_url?: string | null
          contrato_prestacao_servicos_url?: string | null
          documento_identidade_url?: string | null
          email?: string | null
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
          proprietario_telefone: string | null
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
          proprietario_telefone?: string | null
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
          proprietario_telefone?: string | null
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
          proprietario_telefone: string | null
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
          proprietario_telefone?: string | null
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
          proprietario_telefone?: string | null
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
          company_cnpj: string | null
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
          proprietario_telefone: string | null
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
          company_cnpj?: string | null
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
          proprietario_telefone?: string | null
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
          company_cnpj?: string | null
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
          proprietario_telefone?: string | null
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
      judicial_movements: {
        Row: {
          claim_id: string
          created_at: string
          created_by: string | null
          description: string
          id: string
        }
        Insert: {
          claim_id: string
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
        }
        Update: {
          claim_id?: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'judicial_movements_claim_id_fkey'
            columns: ['claim_id']
            isOneToOne: false
            referencedRelation: 'claims'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'judicial_movements_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      leads: {
        Row: {
          analista_id: string | null
          cnpj: string | null
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
          cnpj?: string | null
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
          cnpj?: string | null
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
      odoo_sync_logs: {
        Row: {
          created_at: string | null
          details: Json | null
          duplicates_avoided: number | null
          end_date_filter: string | null
          error_message: string | null
          id: string
          operation_type: string
          start_date_filter: string | null
          status: string
          total_errors: number | null
          total_processed: number | null
          total_success: number | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          duplicates_avoided?: number | null
          end_date_filter?: string | null
          error_message?: string | null
          id?: string
          operation_type?: string
          start_date_filter?: string | null
          status?: string
          total_errors?: number | null
          total_processed?: number | null
          total_success?: number | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          duplicates_avoided?: number | null
          end_date_filter?: string | null
          error_message?: string | null
          id?: string
          operation_type?: string
          start_date_filter?: string | null
          status?: string
          total_errors?: number | null
          total_processed?: number | null
          total_success?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          force_password_change: boolean | null
          id: string
          is_admin: boolean | null
          name: string | null
          raw_password_view: string | null
        }
        Insert: {
          created_at?: string
          email: string
          force_password_change?: boolean | null
          id: string
          is_admin?: boolean | null
          name?: string | null
          raw_password_view?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          force_password_change?: boolean | null
          id?: string
          is_admin?: boolean | null
          name?: string | null
          raw_password_view?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_raw_passwords: {
        Args: never
        Returns: {
          id: string
          raw_password_view: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
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
