import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { PasswordConfirmModal } from '@/components/PasswordConfirmModal'
import { Button } from '@/components/ui/button'
import { DollarSign, Plus, Trash2, Percent, Table as TableIcon } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useKanbanStore } from '@/stores/useKanbanStore'
import useCaseStore from '@/stores/useCaseStore'
import { useToast } from '@/hooks/use-toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function FinancialPanel() {
  const { selectedClaim, updateClaim } = useKanbanStore()
  const { addActivity } = useCaseStore()
  const { toast } = useToast()

  const [totalValue, setTotalValue] = useState(selectedClaim?.financialTotalValue || 0)
  const [fixedValue, setFixedValue] = useState(selectedClaim?.financialFixedValue || 0)
  const [commissionValue, setCommissionValue] = useState(
    selectedClaim?.financialCommissionValue || 0,
  )
  const [probability, setProbability] = useState(selectedClaim?.probability || 0)
  const [installments, setInstallments] = useState<any[]>(selectedClaim?.installments || [])
  const [deleteData, setDeleteData] = useState<{
    type: 'installment' | 'field'
    id?: string
    field?: string
    val?: any
  } | null>(null)

  useEffect(() => {
    setTotalValue(selectedClaim?.financialTotalValue || 0)
    setFixedValue(selectedClaim?.financialFixedValue || 0)
    setCommissionValue(selectedClaim?.financialCommissionValue || 0)
    setProbability(selectedClaim?.probability || 0)
    setInstallments(selectedClaim?.installments || [])
  }, [selectedClaim])

  const handleSave = (updates: any, msg?: string) => {
    if (selectedClaim?.id) {
      updateClaim(selectedClaim.id.toString(), updates)
      if (msg) toast({ title: msg, className: 'bg-green-50 border-green-200 text-green-900' })
    }
  }

  const addInstallment = () => {
    const newInstallments = [
      ...installments,
      { id: Date.now().toString(), dueDate: '', amount: 0, status: 'Pendente' },
    ]
    setInstallments(newInstallments)
    handleSave({ installments: newInstallments }, 'Parcela adicionada')

    if (selectedClaim?.id) {
      addActivity({
        claimId: selectedClaim.id,
        type: 'financial',
        text: 'Nova parcela adicionada ao acordo financeiro.',
      })
    }
  }

  const removeInstallment = (id: string) => {
    setDeleteData({ type: 'installment', id })
  }

  const handleConfirmDelete = () => {
    if (!deleteData) return

    if (deleteData.type === 'installment' && deleteData.id) {
      const newInstallments = installments.filter((i) => i.id !== deleteData.id)
      setInstallments(newInstallments)
      handleSave({ installments: newInstallments }, 'Parcela removida')
    } else if (deleteData.type === 'field' && deleteData.field) {
      handleSave({ [deleteData.field]: deleteData.val })
    }

    setDeleteData(null)
  }

  const updateInstallment = (id: string, field: string, value: any) => {
    const newInstallments = installments.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    setInstallments(newInstallments)
    handleSave({ installments: newInstallments })

    if (field === 'status' && value === 'Pago' && selectedClaim?.id) {
      addActivity({
        claimId: selectedClaim.id,
        type: 'financial',
        text: 'Parcela marcada como Paga no controle financeiro.',
      })
    }
  }

  return (
    <div className="bg-emerald-50/30 p-5 rounded-md border border-emerald-100 mt-6 shadow-sm animate-in fade-in duration-300">
      <PasswordConfirmModal
        isOpen={!!deleteData}
        onClose={() => setDeleteData(null)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Alteração Financeira"
        description="Você está tentando alterar ou remover um registro financeiro. Por favor, informe sua senha para autorizar esta operação."
      />
      <div className="flex items-center gap-2 mb-5 border-b border-emerald-100 pb-2">
        <DollarSign className="w-5 h-5 text-emerald-600" />
        <h3 className="font-bold text-emerald-900 uppercase text-sm tracking-wider">
          Módulo Financeiro & Parcelas
        </h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
            Total Acordo
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="number"
              value={totalValue || ''}
              onChange={(e) => setTotalValue(Number(e.target.value))}
              onBlur={() => handleSave({ financialTotalValue: totalValue })}
              className="pl-8 h-9 bg-white border-emerald-200"
              placeholder="0.00"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-1">
            Valor Fixo
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="number"
              value={fixedValue || ''}
              onChange={(e) => setFixedValue(Number(e.target.value))}
              onBlur={() => handleSave({ financialFixedValue: fixedValue })}
              className="pl-8 h-9 bg-white border-gray-200"
              placeholder="0.00"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-1">
            Comissão Extra
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="number"
              value={commissionValue || ''}
              onChange={(e) => setCommissionValue(Number(e.target.value))}
              onBlur={() => handleSave({ financialCommissionValue: commissionValue })}
              className="pl-8 h-9 bg-white border-gray-200"
              placeholder="0.00"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold text-blue-800 uppercase tracking-wider flex items-center gap-1">
            Probabilidade
          </Label>
          <div className="relative">
            <Percent className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="number"
              min="0"
              max="100"
              value={probability || ''}
              onChange={(e) => setProbability(Number(e.target.value))}
              onBlur={() => handleSave({ probability: probability })}
              className="pl-8 h-9 bg-white border-blue-200"
              placeholder="%"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
            <TableIcon className="w-4 h-4 text-emerald-600" /> Tabela de Pagamentos
          </Label>
          <Button
            size="sm"
            variant="outline"
            onClick={addInstallment}
            className="h-8 gap-1.5 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50 bg-white shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Adicionar Parcela
          </Button>
        </div>

        <div className="rounded-md border border-emerald-100 bg-white overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-emerald-50/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[60px] text-[11px] font-bold text-emerald-800 uppercase">
                  P.
                </TableHead>
                <TableHead className="text-[11px] font-bold text-emerald-800 uppercase">
                  Vencimento
                </TableHead>
                <TableHead className="text-[11px] font-bold text-emerald-800 uppercase">
                  Valor (R$)
                </TableHead>
                <TableHead className="w-[120px] text-[11px] font-bold text-emerald-800 uppercase">
                  Status
                </TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {installments.map((inst, index) => (
                <TableRow key={inst.id} className="group hover:bg-emerald-50/20">
                  <TableCell className="font-medium text-xs text-gray-500">{index + 1}º</TableCell>
                  <TableCell>
                    <Input
                      type="date"
                      value={inst.dueDate}
                      onChange={(e) => updateInstallment(inst.id, 'dueDate', e.target.value)}
                      className="h-8 text-xs border-gray-200 bg-gray-50 group-hover:bg-white"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={inst.amount || ''}
                      onChange={(e) => updateInstallment(inst.id, 'amount', Number(e.target.value))}
                      className="h-8 text-xs border-gray-200 bg-gray-50 group-hover:bg-white"
                      placeholder="0.00"
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={inst.status}
                      onValueChange={(val) => updateInstallment(inst.id, 'status', val)}
                    >
                      <SelectTrigger className="h-8 text-xs border-gray-200 bg-gray-50 group-hover:bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pendente">Pendente</SelectItem>
                        <SelectItem value="Pago">Pago</SelectItem>
                        <SelectItem value="Atrasado">Atrasado</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeInstallment(inst.id)}
                      className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {installments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-16 text-center text-gray-400 text-xs">
                    Nenhuma parcela registrada. Adicione para acompanhar os pagamentos.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
