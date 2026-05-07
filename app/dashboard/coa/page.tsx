import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authorization";
import { CoaPageClient } from "@/components/coa/coa-page-client";

export default async function CoaPage() {
  await requirePermission("coa", "read");

  const accounts = await prisma.chartOfAccount.findMany({
    orderBy: [{ type: "asc" }, { code: "asc" }],
    include: {
      parent: { select: { code: true, name: true } },
    },
  });

  return <CoaPageClient initialAccounts={accounts} />;
}
