import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Configure system preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Temple Information</CardTitle>
          <CardDescription>This information appears on receipts and reports.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Temple Name</Label>
              <Input placeholder="Shree Mandir" defaultValue="Shree Mandir" />
            </div>
            <div className="space-y-2">
              <Label>Registration No.</Label>
              <Input placeholder="REG-XXXX" />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input placeholder="Village, District, State" />
            </div>
            <div className="space-y-2">
              <Label>Contact Phone</Label>
              <Input placeholder="+91 XXXXX XXXXX" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Financial Year</CardTitle>
          <CardDescription>Set the current financial year for reports.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" defaultValue="2025-04-01" />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" defaultValue="2026-03-31" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Receipt Settings</CardTitle>
          <CardDescription>Customize auto-generated receipt numbers.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prefix</Label>
              <Input defaultValue="RCPT" />
            </div>
            <div className="space-y-2">
              <Label>Next Number</Label>
              <Input type="number" defaultValue="1001" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
