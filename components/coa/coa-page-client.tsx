'use client'

import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Edit, RefreshCcw } from 'lucide-react'
import { AddCoaDialog } from './add-coa-dialog'
import type { ChartOfAccount } from '@prisma/client'

const typeLabels: Record<string, string> = {
  ASSET: 'Asset',
  LIABILITY: 'Liability',
  EQUITY: 'Equity',
  INCOME: 'Income',
  EXPENSE: 'Expense',
}

interface Props {
  initialAccounts: (ChartOfAccount & { parent?: { code: string; name: string } | null })[]
}

export function CoaPageClient({ initialAccounts }: Props) {
  const [accounts, setAccounts] = React.useState(initialAccounts)
  const [editAccount, setEditAccount] = React.useState<ChartOfAccount | null>(null)

  const groupedAccounts = accounts.reduce((acc, account) => {
    if (!acc[account.type]) acc[account.type] = []
    acc[account.type].push(account)
    return acc
  }, {} as Record<string, (ChartOfAccount & { parent?: { code: string; name: string } | null })[]>)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chart of Accounts</h1>
          <p className="text-muted-foreground">Manage your chart of accounts for double-entry bookkeeping.</p>
        </div>
        <div className="flex gap-2">
          <AddCoaDialog 
            accounts={accounts} 
            editAccount={editAccount} 
            onSuccess={() => window.location.reload()}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        {Object.entries(typeLabels).map(([key, label]) => (
          <Card key={key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{groupedAccounts[key]?.length ?? 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {Object.entries(groupedAccounts).map(([type, typeAccounts]) => (
        <Card key={type}>
          <CardHeader>
            <CardTitle>{typeLabels[type]} Accounts</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {typeAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.code}</TableCell>
                    <TableCell>{account.name}</TableCell>
                    <TableCell>{account.parent ? `${account.parent.code} - ${account.parent.name}` : '-'}</TableCell>
                    <TableCell>
                      <Badge variant={account.isActive ? 'default' : 'outline'}>
                        {account.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setEditAccount(account)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
