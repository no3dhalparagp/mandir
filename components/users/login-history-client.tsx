"use client"

import * as React from "react"
import { format } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface LoginEntry {
  id: string
  ipAddress: string
  device?: string
  userAgent?: string
  success: boolean
  reason?: string
  createdAt: string
}

interface LoginHistoryClientProps {
  userId: string
}

export function LoginHistoryClient({ userId }: LoginHistoryClientProps) {
  const [logins, setLogins] = React.useState<LoginEntry[]>([])
  const [loading, setLoading] = React.useState(true)
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)

  const fetchLogins = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/users/${userId}/login-history?page=${page}&limit=10`)
      if (!res.ok) throw new Error("Failed to fetch login history")

      const data = await res.json()
      setLogins(data.logins)
      setTotalPages(data.pagination.pages)
    } catch (error) {
      console.error("Error fetching login history:", error)
      toast.error("Failed to fetch login history")
    } finally {
      setLoading(false)
    }
  }, [userId, page])

  React.useEffect(() => {
    fetchLogins()
  }, [fetchLogins])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Login History</h2>
        <p className="text-muted-foreground">View your recent login activity</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Logins</CardTitle>
          <CardDescription>Shows your login attempts for the last 30 days</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : logins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No login history found
                  </TableCell>
                </TableRow>
              ) : (
                logins.map((login) => (
                  <TableRow key={login.id}>
                    <TableCell className="text-sm">
                      {format(new Date(login.createdAt), "dd MMM yyyy HH:mm:ss")}
                    </TableCell>
                    <TableCell className="text-sm font-mono">{login.ipAddress}</TableCell>
                    <TableCell className="text-sm">{login.device || "Unknown"}</TableCell>
                    <TableCell>
                      <Badge variant={login.success ? "default" : "destructive"}>
                        {login.success ? "Success" : login.reason || "Failed"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 text-sm border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-sm">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 text-sm border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
