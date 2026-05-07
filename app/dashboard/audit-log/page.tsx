import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { AuditLogClient } from "@/components/users/audit-log-client"

export const metadata = {
  title: "Audit Log | Account Management",
  description: "Track all system actions and user activities",
}

export default async function AuditLogPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const isAdmin = ["SUPER_ADMIN", "COMMITTEE_ADMIN"].includes(session.user.role)

  return <AuditLogClient isAdmin={isAdmin} />
}
