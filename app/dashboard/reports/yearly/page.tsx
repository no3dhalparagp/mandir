import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileBarChart2 } from "lucide-react"

export default function YearlyReportPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Yearly Audit Report</h1>
        <p className="text-muted-foreground">Financial year 2025–2026</p>
      </div>
      <Card className="flex flex-col items-center justify-center p-12 text-center">
        <FileBarChart2 className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">
          Yearly audit report generation will be available once sufficient transaction history exists.
        </p>
      </Card>
    </div>
  )
}
