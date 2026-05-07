"use client"

import * as React from "react"
import { format } from "date-fns"
import { Loader2, LogOut } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Session {
  id: string
  ipAddress: string
  device?: string
  userAgent?: string
  createdAt: string
  expiresAt: string
  lastActivityAt: string
}

interface ActiveSessionsClientProps {
  userId: string
}

export function ActiveSessionsClient({ userId }: ActiveSessionsClientProps) {
  const [sessions, setSessions] = React.useState<Session[]>([])
  const [loading, setLoading] = React.useState(true)
  const [revokingId, setRevokingId] = React.useState<string | null>(null)

  const fetchSessions = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/users/${userId}/sessions`)
      if (!res.ok) throw new Error("Failed to fetch sessions")

      const data = await res.json()
      setSessions(data.sessions)
    } catch (error) {
      console.error("Error fetching sessions:", error)
      toast.error("Failed to fetch sessions")
    } finally {
      setLoading(false)
    }
  }, [userId])

  React.useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingId(sessionId)
    try {
      const res = await fetch(`/api/users/${userId}/sessions`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })

      if (!res.ok) throw new Error("Failed to revoke session")

      toast.success("Session revoked successfully")
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
    } catch (error) {
      console.error("Error revoking session:", error)
      toast.error("Failed to revoke session")
    } finally {
      setRevokingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Active Sessions</h2>
        <p className="text-muted-foreground">Manage your active login sessions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Active Sessions</CardTitle>
          <CardDescription>You can revoke any session to log out from that device</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>IP Address</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No active sessions found
                  </TableCell>
                </TableRow>
              ) : (
                sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="text-sm font-mono">{session.ipAddress}</TableCell>
                    <TableCell className="text-sm">{session.device || "Unknown"}</TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(session.lastActivityAt), "dd MMM yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(session.expiresAt), "dd MMM yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeSession(session.id)}
                        disabled={revokingId === session.id}
                        className="text-destructive hover:text-destructive"
                      >
                        {revokingId === session.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <LogOut className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
