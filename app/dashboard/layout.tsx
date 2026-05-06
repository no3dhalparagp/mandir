import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  return (
    <SidebarProvider>
      <AppSidebar role={session.user.role} />
      <main className="flex-1 overflow-auto bg-muted/20">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-6 lg:h-[60px]">
          <SidebarTrigger />
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">{session.user.name} ({session.user.role})</span>
          </div>
        </header>
        <div className="p-6 md:p-8">
          {children}
        </div>
      </main>
    </SidebarProvider>
  )
}
