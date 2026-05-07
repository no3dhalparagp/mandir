'use server'

import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { auth } from '@/auth'
import { hasMinRole } from '@/lib/roles'

const createCoaSchema = z.object({
  code: z.string().min(1, 'Account code is required'),
  name: z.string().min(2, 'Account name is required'),
  type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE']),
  parentId: z.string().optional(),
  description: z.string().optional(),
})

const updateCoaSchema = z.object({
  id: z.string(),
  code: z.string().min(1, 'Account code is required'),
  name: z.string().min(2, 'Account name is required'),
  type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE']),
  parentId: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

export async function createChartOfAccount(data: z.infer<typeof createCoaSchema>) {
  const session = await auth()
  if (!session || !hasMinRole(session.user?.role ?? 'VIEWER', 'ACCOUNTANT')) {
    return { error: 'Unauthorized' }
  }

  try {
    const account = await prisma.chartOfAccount.create({
      data,
    })
    return { success: true, account }
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { error: 'Account code already exists' }
    }
    return { error: 'Failed to create account' }
  }
}

export async function updateChartOfAccount(data: z.infer<typeof updateCoaSchema>) {
  const session = await auth()
  if (!session || !hasMinRole(session.user?.role ?? 'VIEWER', 'ACCOUNTANT')) {
    return { error: 'Unauthorized' }
  }

  try {
    const account = await prisma.chartOfAccount.update({
      where: { id: data.id },
      data,
    })
    return { success: true, account }
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { error: 'Account code already exists' }
    }
    return { error: 'Failed to update account' }
  }
}
