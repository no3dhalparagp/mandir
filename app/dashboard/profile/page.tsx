import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { UserProfileClient } from "@/components/users/user-profile-client"

export const metadata = {
  title: "My Profile | Account Management",
  description: "Manage your account settings and preferences",
}

export default async function ProfilePage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      lastLoginAt: true,
      createdAt: true,
    },
  })

  if (!user) {
    redirect("/login")
  }

  return (
    <UserProfileClient
      userId={user.id}
      initialName={user.name}
      initialEmail={user.email}
      role={user.role}
      lastLoginAt={user.lastLoginAt}
      createdAt={user.createdAt}
    />
  )
}
