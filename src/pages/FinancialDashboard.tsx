import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts'
import { DollarSign, AlertCircle, Building2, Landmark, Wallet, Plus, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

const cashFlowData = [
  { name: 'Jan', Entradas: 45000, Saídas: 12000, Provisoes: 8000 },
  { name: 'Fev', Entradas: 52000, Saídas: 15000, Provisoes: 10000 },
  { name: 'Mar', Entradas: 61000, Saídas: 14000, Provisoes: 12500 },
  { name: 'Abr', Entradas: 75000, Saídas: 18000, Provisoes: 15000 },
  { name: 'Mai', Entradas: 82000, Saídas: 17500, Provisoes: 18000 },
]

export default function FinancialDashboard() {
  const [period, setPeriod] = useState('Mês')

  return (
    <div className="flex flex-col h-[calc(100vh-48px)] bg-gray-50 overflow-auto p-4 lg:p-8 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Landmark className="text-solved w-6 h-6" /> Gestão Financeira (DRE)
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Fluxo de caixa, provisões e demonstrativo de resultados integrados.
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px] bg-white font-medium shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Hoje">Hoje</SelectItem>
                <SelectItem value="Semana">Semana</SelectItem>
                <SelectItem value="Mês">Mês</SelectItem>
                <SelectItem value="Ano">Ano</SelectItem>
              </SelectContent>
            </Select>
            <Button className="bg-solved hover:bg-solved-dark text-white shadow-sm gap-2">
              <Plus className="w-4 h-4" /> Lançamento
            </Button>
            <Button variant="outline" size="icon" className="shadow-sm">
              <Download className="w-4 h-4 text-gray-600" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-sm border-gray-200 bg-white">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs uppercase font-bold text-gray-500">
                Faturamento Bruto
              </CardTitle>
              <DollarSign className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">R$ 315.000</div>
              <p className="text-xs text-green-600 font-medium mt-1">
                +18% em relação ao período anterior
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-gray-200 bg-white">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs uppercase font-bold text-gray-500">
                Provisão de Comissões
              </CardTitle>
              <Wallet className="w-4 h-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900">R$ 63.500</div>
              <p className="text-xs text-gray-500 font-medium mt-1">A serem pagas aos analistas</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-gray-200 bg-white">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs uppercase font-bold text-gray-500">
                Despesas e Impostos
              </CardTitle>
              <Building2 className="w-4 h-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-700">R$ 42.000</div>
              <p className="text-xs text-red-600 font-medium mt-1">DAS, Custos Fixos e Operação</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-transparent bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs uppercase font-bold text-green-100">
                Lucro Líquido Previsto
              </CardTitle>
              <AlertCircle className="w-4 h-4 text-green-100" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">R$ 209.500</div>
              <p className="text-xs text-green-100 font-medium mt-1">Margem líquida de 66.5%</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-sm border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg text-gray-800">Fluxo de Caixa Consolidado</CardTitle>
              <CardDescription>
                Visão comparativa de Entradas Reais vs. Saídas Totais
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashFlowData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorSaidas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickFormatter={(val) => `R$${val / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Entradas"
                    stroke="#22c55e"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorEntradas)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Saídas"
                    stroke="#ef4444"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorSaidas)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg text-gray-800">Composição de Despesas</CardTitle>
              <CardDescription>Detalhamento de Provisões e Custos Mensais</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={cashFlowData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                  barGap={0}
                  barCategoryGap="20%"
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickFormatter={(val) => `R$${val / 1000}k`}
                  />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Bar
                    dataKey="Provisoes"
                    name="Comissões (Time)"
                    stackId="a"
                    fill="#8b5cf6"
                    radius={[0, 0, 4, 4]}
                  />
                  <Bar
                    dataKey="Saídas"
                    name="Impostos/Fixas"
                    stackId="a"
                    fill="#f43f5e"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
