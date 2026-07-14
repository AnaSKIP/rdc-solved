import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Index from './pages/Index'
import KanbanPage from './pages/KanbanPage'
import Repescagem from './pages/Repescagem'
import ImportDashboard from './pages/ImportDashboard'
import IntakeDashboard from './pages/IntakeDashboard'
import Settings from './pages/Settings'
import Contacts from './pages/Contacts'
import ContactProfile from './pages/ContactProfile'
import Dashboard from './pages/Dashboard'
import FinancialDashboard from './pages/FinancialDashboard'
import VistoriasDashboard from './pages/VistoriasDashboard'
import JuridicoDashboard from './pages/JuridicoDashboard'
import Sandbox from './pages/Sandbox'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import RequireAuth from './components/RequireAuth'
import { CaseProvider } from './stores/useCaseStore'
import { OdooImportProvider } from './stores/useOdooImportStore'
import { ContactProvider } from './stores/useContactStore'
import { IntakeProvider } from './stores/useIntakeStore'
import { KanbanProvider } from './stores/useKanbanStore'
import { PermissionsProvider } from './stores/usePermissionsStore'
import { AuthProvider } from './hooks/use-auth'

const App = () => (
  <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
    <AuthProvider>
      <PermissionsProvider>
        <CaseProvider>
          <OdooImportProvider>
            <ContactProvider>
              <KanbanProvider>
                <IntakeProvider>
                  <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    <Routes>
                      <Route
                        element={
                          <RequireAuth>
                            <Layout />
                          </RequireAuth>
                        }
                      >
                        <Route path="/" element={<Index />} />
                        <Route path="/kanban" element={<KanbanPage />} />
                        <Route path="/intake" element={<IntakeDashboard />} />
                        <Route path="/repescagem" element={<Repescagem />} />
                        <Route path="/import" element={<ImportDashboard />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/contatos" element={<Contacts />} />
                        <Route path="/contatos/:id" element={<ContactProfile />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/financeiro" element={<FinancialDashboard />} />
                        <Route path="/vistorias" element={<VistoriasDashboard />} />
                        <Route path="/juridico" element={<JuridicoDashboard />} />
                        <Route path="/sandbox" element={<Sandbox />} />
                      </Route>
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </TooltipProvider>
                </IntakeProvider>
              </KanbanProvider>
            </ContactProvider>
          </OdooImportProvider>
        </CaseProvider>
      </PermissionsProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
