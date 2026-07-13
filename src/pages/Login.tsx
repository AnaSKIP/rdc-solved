import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldCheck, Loader2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localLoading, setLocalLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const { signIn } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalLoading(true)
    setErrorMsg('')
    const { error } = await signIn(email, password)
    if (error) {
      setErrorMsg('Credenciais inválidas. Verifique seu e-mail e senha e tente novamente.')
    }
    setLocalLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 animate-in fade-in duration-500">
      <div className="absolute inset-0 bg-[url('https://img.usecurling.com/p/1920/1080?q=office%20building')] bg-cover bg-center opacity-5"></div>

      <Card className="w-full max-w-md shadow-xl border-slate-200 relative z-10 bg-white/95 backdrop-blur-sm">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="w-16 h-16 bg-solved rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/20">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
            RDC Sinistros
          </CardTitle>
          <CardDescription className="text-slate-500 font-medium">
            Acesso Restrito ao Ambiente Corporativo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-5">
            {errorMsg && (
              <Alert
                variant="destructive"
                className="bg-red-50 border-red-200 text-red-900 animate-in slide-in-from-top-2"
              >
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-xs font-medium">{errorMsg}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700">
                E-mail Corporativo
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="nome@rdccobrancas.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white border-slate-300 focus-visible:ring-solved h-11"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-700">
                  Senha
                </Label>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white border-slate-300 focus-visible:ring-solved h-11"
                placeholder="••••••••"
              />
            </div>
            <Button
              type="submit"
              disabled={localLoading}
              className="w-full bg-solved hover:bg-solved-dark text-white shadow-md h-12 text-base font-semibold transition-all"
            >
              {localLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar no Sistema'}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-500">
              Para acessos novos, utilize a senha inicial{' '}
              <strong className="text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                1234
              </strong>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
