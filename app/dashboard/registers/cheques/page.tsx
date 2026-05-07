import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/authorization"
import { ChequeRegisterClient } from "@/components/registers/cheque-register-client"

export default async function ChequeRegisterPage() {
  await requirePermission("registers", "read")

  const cheques = await prisma.chequeRegister.findMany({
    orderBy: [{ chequeDate: "desc" }, { createdAt: "desc" }],
    take: 200,
    include: {
      account: { select: { name: true } },
      donation: { select: { receiptNo: true } },
      expense: { select: { title: true } },
    },
  })
  const [leaves, accounts] = await Promise.all([
    prisma.chequeBookLeaf.findMany({
      include: { account: { select: { name: true } } },
      orderBy: [{ createdAt: "desc" }],
      take: 300,
    }),
    prisma.bankAccount.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  return (
    <ChequeRegisterClient
      cheques={JSON.parse(JSON.stringify(cheques))}
      leaves={JSON.parse(JSON.stringify(leaves))}
      accounts={accounts}
    />
  )
}
