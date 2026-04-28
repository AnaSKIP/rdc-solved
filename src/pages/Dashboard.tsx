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
  LineChart,
  Line,
} from 'recharts'
import { Users, TrendingUp, Calendar, CheckCircle, DollarSign } from 'lucide-react'
import { useState } from 'react'

const dataDay = [
  { name: 'Seg', RAs: 12, Valor: 45000 },
  { name: 'Ter', RAs: 19, Valor: 60000 },
  { name: 'Qua', RAs: 15, Valor: 55000 },
  { name: 'Qui', RAs: 22, Valor: 75000 },
  { name: 'Sex', RAs: 30, Valor: 95000 },
]

const dataMonth = [
  { name: 'Sem 1', RAs: 45, Valor: 150000 },
  { name: 'Sem 2', RAs: 52, Valor: 180000 },
  { name: 'Sem 3', RAs: 38, Valor: 120000 },
  { name: 'Sem 4', RAs: 65, Valor: 220000 },
]

const dataYear = [
  { name: 'Jan', RAs: 120, Valor: 450000 },
  { name: 'Fev', RAs: 150, Valor: 520000 },
  { name: 'Mar', RAs: 180, Valor: 610000 },
  { name: 'Abr', RAs: 210, Valor: 750000 },
]

export default function Dashboard() {
  const [filter, setFilter] = useState('month')

  const chartData = filter === 'day' ? dataDay : filter === 'month' ? dataMonth : dataYear

  return (
    <div className="flex flex-col h-[calc(100vh-48px)] bg-gray-50 overflow-auto p-4 lg:p-8 animate-in fade-in duration-500">
      <div className="max-w-6xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <TrendingUp className="text-solved w-6 h-6" /> Dashboard de Produtividade
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Métricas de performance dos analistas e Previsão de Ganho (Módulo 3)
            </p>
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px] bg-gray-50 font-semibold shadow-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Visão Diária</SelectItem>
              <SelectItem value="month">Visão Mensal</SelectItem>
              <SelectItem value="year">Visão Anual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-sm border-gray-200 hover:border-solved/50 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase font-bold text-gray-500 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" /> RAs Concluídos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">342</div>
              <p className="text-xs text-green-600 font-medium mt-1">+12% este mês</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-gray-200 hover:border-solved/50 transition-colors bg-gradient-to-br from-white to-purple-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase font-bold text-gray-500 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-purple-600" /> Previsão de Ganho (Time)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900">R$ 14.500,00</div>
              <p className="text-xs text-purple-600 font-medium mt-1">
                Baseado em comissões do sistema
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-gray-200 hover:border-solved/50 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase font-bold text-gray-500 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" /> Receita Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">R$ 670k</div>
              <p className="text-xs text-blue-600 font-medium mt-1">Acordos fechados</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-gray-200 hover:border-solved/50 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase font-bold text-gray-500 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-500" /> Retornos Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">28</div>
              <p className="text-xs text-gray-500 font-medium mt-1">Acompanhamento de analistas</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-sm border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg">Evolução de Tratativas</CardTitle>
              <CardDescription>
                Quantidade de RAs processados no período selecionado
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Bar dataKey="RAs" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg">Volume Financeiro (R$)</CardTitle>
              <CardDescription>Valores recuperados através de acordos</CardDescription>
            </CardHeader>
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickFormatter={(value) => `R${value / 1000}k`}
                  />
                  <Tooltip
                    cursor={{ stroke: '#cbd5e1', strokeWidth: 2 }}
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Valor"
                    stroke="#16a34a"
                    strokeWidth={4}
                    dot={{ r: 6, fill: '#16a34a', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
