"use client"

import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  COMMITTEE_ADMIN: "Committee Admin",
  ACCOUNTANT: "Accountant",
  DATA_ENTRY_OPERATOR: "Data Entry Operator",
  VIEWER: "Viewer",
}

const roleColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  SUPER_ADMIN: "destructive",
  COMMITTEE_ADMIN: "default",
  ACCOUNTANT: "default",
  DATA_ENTRY_OPERATOR: "secondary",
  VIEWER: "outline",
}

interface ViewUserDialogProps {
  user: {
    id: string
    name: string | null
    email: string
    role: string
    isActive: boolean
    createdAt: Date
    lastLoginAt?: Date | null
  }
  onClose: () => void
}

export function ViewUserDialog({ user, onClose }: ViewUserDialogProps) {
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>View user account information</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
            <p className="text-lg font-semibold mt-1">{user.name || "—"}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
            <p className="text-lg font-semibold mt-1">{user.email}</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Role</h3>
              <div className="mt-1">
                <Badge variant={roleColors[user.role] || "outline"}>
                  {roleLabels[user.role] || user.role}
                </Badge>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
              <div className="mt-1">
                <Badge variant={user.isActive ? "default" : "secondary"}>
                  {user.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Created On</h3>
              <p className="text-sm mt-1">
                {format(new Date(user.createdAt), "dd MMM yyyy HH:mm")}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Last Login</h3>
              <p className="text-sm mt-1">
                {user.lastLoginAt ? format(new Date(user.lastLoginAt), "dd MMM yyyy HH:mm") : "Never"}
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
