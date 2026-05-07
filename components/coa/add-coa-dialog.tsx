'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

import { createChartOfAccount, updateChartOfAccount } from '@/app/dashboard/coa/actions'
import type { ChartOfAccount } from '@prisma/client'

const schema = z.object({
  code: z.string().min(1, 'Account code is required'),
  name: z.string().min(2, 'Account name is required'),
  type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE']),
  parentId: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  accounts?: ChartOfAccount[]
  editAccount?: ChartOfAccount | null
  onSuccess?: () => void
}

export function AddCoaDialog({ accounts = [], editAccount = null, onSuccess }: Props) {
  const [open, setOpen] = React.useState(false)
  const [pending, startTransition] = React.useTransition()
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'ASSET',
      isActive: true,
    },
  })

  React.useEffect(() => {
    if (editAccount) {
      form.reset({
        code: editAccount.code,
        name: editAccount.name,
        type: editAccount.type,
        parentId: editAccount.parentId ?? undefined,
        description: editAccount.description ?? undefined,
        isActive: editAccount.isActive,
      })
      setOpen(true)
    }
  }, [editAccount, form])

  function onSubmit(data: FormData) {
    startTransition(async () => {
      let res
      if (editAccount) {
        res = await updateChartOfAccount({ ...data, id: editAccount.id })
      } else {
        res = await createChartOfAccount(data)
      }
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(editAccount ? 'Account updated!' : 'Account created!')
        form.reset()
        setOpen(false)
        onSuccess?.()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button className="gap-2" onClick={() => form.reset()}>
          <Plus className="h-4 w-4" /> New Account
        </Button>
      } />
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader><DialogTitle>{editAccount ? 'Edit Chart of Account' : 'Add Chart of Account'}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="code" render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Code *</FormLabel>
                  <FormControl><Input {...field} placeholder="e.g. 1001" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="ASSET">Asset</SelectItem>
                      <SelectItem value="LIABILITY">Liability</SelectItem>
                      <SelectItem value="EQUITY">Equity</SelectItem>
                      <SelectItem value="INCOME">Income</SelectItem>
                      <SelectItem value="EXPENSE">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Account Name *</FormLabel>
                <FormControl><Input {...field} placeholder="e.g. Cash in Hand" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="parentId" render={({ field }) => (
              <FormItem>
                <FormLabel>Parent Account (Optional)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select parent" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {accounts.filter(a => !editAccount || a.id !== editAccount.id).map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea {...field} placeholder="Account description" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            {editAccount && (
              <FormField control={form.control} name="isActive" render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <FormLabel>Active</FormLabel>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
            )}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {editAccount ? 'Update' : 'Create'} Account
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
