import { supabase } from '@/lib/supabase/client'

export const api = {
  clients: {
    fetch: () => supabase.from('clients').select('*').order('RAZÃO SOCIAL', { ascending: true }),
    update: (id: string, data: any) => supabase.from('clients').update(data).eq('id', id),
    insert: (data: any[]) => supabase.from('clients').insert(data),
    delete: (id: string) => supabase.from('clients').delete().eq('id', id),
    deleteAll: () =>
      supabase.from('clients').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
  },
  analysts: {
    fetch: () => supabase.from('analysts').select('*').order('NOME', { ascending: true }),
    update: (id: string, data: any) => supabase.from('analysts').update(data).eq('id', id),
    insert: (data: any[]) => supabase.from('analysts').insert(data),
    delete: (id: string) => supabase.from('analysts').delete().eq('id', id),
    deleteAll: () =>
      supabase.from('analysts').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
  },
  insurers: {
    fetch: () => supabase.from('insurers').select('*').order('NOME', { ascending: true }),
    update: (id: string, data: any) => supabase.from('insurers').update(data).eq('id', id),
    insert: (data: any[]) => supabase.from('insurers').insert(data),
    delete: (id: string) => supabase.from('insurers').delete().eq('id', id),
    deleteAll: () =>
      supabase.from('insurers').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
  },
  internal_team: {
    fetch: () => supabase.from('internal_team').select('*').order('name', { ascending: true }),
    update: (id: string, data: any) => supabase.from('internal_team').update(data).eq('id', id),
    insert: (data: any[]) => supabase.from('internal_team').insert(data),
    delete: (id: string) => supabase.from('internal_team').delete().eq('id', id),
    deleteAll: () =>
      supabase.from('internal_team').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
  },
}
