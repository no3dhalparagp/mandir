import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/authorization'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'

export default async function AuditLogPage() {
  await requirePermission('audit', 'read')

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      user: { select: { name: true, email: true } },
    },
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
        <p className="text-muted-foreground">Track all system activities and changes.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm whitespace-nowrap">
                    {format(log.createdAt, 'dd MMM yyyy HH:mm:ss')}
                  </TableCell>
                  <TableCell className="text-sm">
                    {log.user?.name ?? log.user?.email ?? 'System'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.action}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{log.entity}</TableCell>
                  <TableCell className="text-sm max-w-xs truncate">{log.details ?? '-'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{log.ipAddress ?? '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
