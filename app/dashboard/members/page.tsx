import { getMembers } from "./actions"
import { Plus, UserCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AddMemberDialog } from "@/components/members/add-member-dialog"
import Link from "next/link"

const designationLabels: Record<string, string> = {
  PRESIDENT: "President",
  VICE_PRESIDENT: "Vice President",
  SECRETARY: "Secretary",
  JOINT_SECRETARY: "Jt. Secretary",
  TREASURER: "Treasurer",
  JOINT_TREASURER: "Jt. Treasurer",
  MEMBER: "Member",
  VOLUNTEER: "Volunteer",
}

const statusColors: Record<string, "default" | "secondary" | "destructive"> = {
  ACTIVE: "default",
  INACTIVE: "secondary",
  RETIRED: "destructive",
}

export default async function MembersPage() {
  const members = await getMembers()
  const activeCount = members.filter((m) => m.status === "ACTIVE").length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Committee Members</h1>
          <p className="text-muted-foreground">
            {activeCount} active member{activeCount !== 1 ? "s" : ""} · {members.length} total
          </p>
        </div>
        <AddMemberDialog />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Can Collect</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    <UserCircle className="mx-auto h-8 w-8 mb-2 text-muted-foreground/50" />
                    No members added yet.
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-mono text-xs">{member.memberId}</TableCell>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{designationLabels[member.designation] ?? member.designation}</TableCell>
                    <TableCell className="text-sm">{member.mobile ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={member.canCollect ? "default" : "outline"} className="text-xs">
                        {member.canCollect ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[member.status]} className="text-xs">{member.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/members/${member.id}/ledger`}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Ledger →
                      </Link>
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
