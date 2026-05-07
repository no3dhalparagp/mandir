import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { UsersPageClient } from "@/components/users/users-page-client"

export default async function UsersPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  // Only SUPER_ADMIN and COMMITTEE_ADMIN can access user management
  if (!["SUPER_ADMIN", "COMMITTEE_ADMIN"].includes(session.user.role)) {
    redirect("/dashboard")
  }

  return <UsersPageClient currentUserRole={session.user.role} />
}
