import React, { createContext, useContext, useState, useEffect } from 'react'

export type ModuleId =
  | 'kanban'
  | 'intake'
  | 'vistorias'
  | 'repescagem'
  | 'juridico'
  | 'contatos'
  | 'dashboard'
  | 'financeiro'
  | 'import'
  | 'settings'
  | 'sandbox'

export const DEFAULT_PERMISSIONS: Record<string, ModuleId[]> = {
  Admin: [
    'kanban',
    'intake',
    'vistorias',
    'repescagem',
    'juridico',
    'contatos',
    'dashboard',
    'financeiro',
    'import',
    'settings',
    'sandbox',
  ],
  Analista: ['kanban', 'intake', 'vistorias', 'repescagem', 'contatos', 'dashboard'],
  Financeiro: ['kanban', 'financeiro', 'dashboard', 'contatos'],
  Visualizador: ['kanban', 'dashboard'],
}

export const ROLES = ['Admin', 'Analista', 'Financeiro', 'Visualizador']

interface PermissionsState {
  permissions: Record<string, ModuleId[]>
  updatePermission: (role: string, module: ModuleId, hasAccess: boolean) => void
  hasAccess: (role: string, module: ModuleId) => boolean
}

const PermissionsContext = createContext<PermissionsState | null>(null)

export const PermissionsProvider = ({ children }: { children: React.ReactNode }) => {
  const [permissions, setPermissions] = useState<Record<string, ModuleId[]>>(() => {
    const saved = localStorage.getItem('rdc_permissions')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error('Failed to parse permissions from local storage', e)
      }
    }
    return DEFAULT_PERMISSIONS
  })

  useEffect(() => {
    localStorage.setItem('rdc_permissions', JSON.stringify(permissions))
  }, [permissions])

  const updatePermission = (role: string, module: ModuleId, hasAccess: boolean) => {
    setPermissions((prev) => {
      const rolePerms = prev[role] || []
      if (hasAccess) {
        return { ...prev, [role]: Array.from(new Set([...rolePerms, module])) }
      } else {
        return { ...prev, [role]: rolePerms.filter((m) => m !== module) }
      }
    })
  }

  const hasAccess = (role: string, module: ModuleId) => {
    if (role?.toLowerCase() === 'admin') return true // Admin always has full access
    const perms = permissions[role] || []
    return perms.includes(module)
  }

  return React.createElement(
    PermissionsContext.Provider,
    { value: { permissions, updatePermission, hasAccess } },
    children,
  )
}

export default function usePermissionsStore() {
  const ctx = useContext(PermissionsContext)
  if (!ctx) throw new Error('usePermissionsStore must be used within PermissionsProvider')
  return ctx
}
