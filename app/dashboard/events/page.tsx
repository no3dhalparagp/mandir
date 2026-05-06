import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AddEventDialog } from "@/components/events/add-event-dialog"

const statusColors: Record<string, "default" | "secondary" | "outline"> = {
  UPCOMING: "outline",
  ONGOING: "default",
  COMPLETED: "secondary",
}

export default async function EventsPage() {
  const events = await prisma.event.findMany({ orderBy: { date: "asc" } })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events & Pujas</h1>
          <p className="text-muted-foreground">Manage upcoming and past mandir events.</p>
        </div>
        <AddEventDialog />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Organizer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Budget (₹)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No events found.</TableCell>
                </TableRow>
              ) : (
                events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.name}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{event.eventType}</Badge></TableCell>
                    <TableCell className="text-sm">{format(event.date, "dd MMM yyyy")}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{event.organizer ?? "—"}</TableCell>
                    <TableCell><Badge variant={statusColors[event.status]} className="text-xs">{event.status}</Badge></TableCell>
                    <TableCell className="text-right font-medium">{event.budget ? `₹${event.budget.toLocaleString("en-IN")}` : "—"}</TableCell>
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
