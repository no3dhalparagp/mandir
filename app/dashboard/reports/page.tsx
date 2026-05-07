import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  FileBarChart2,
  Calendar,
  TrendingUp,
  IndianRupee,
  Wallet,
  Lock,
  BookOpen,
} from "lucide-react";

export default async function ReportsPage() {
  const [donationCount, expenseCount, memberCount, closureCount] =
    await Promise.all([
      prisma.donation.count(),
      prisma.expense.count(),
      prisma.member.count(),
      prisma.bookClosure.count({ where: { closureType: "MONTH" } }),
    ]);

  const reportCards = [
    {
      title: "Daily Collection Report",
      description:
        "View today's donations and collections with detailed breakdown.",
      href: "/dashboard/reports/daily",
      icon: Calendar,
    },
    {
      title: "Monthly Financial Statement",
      description: "Income vs expense summary for the current month.",
      href: "/dashboard/reports/monthly",
      icon: TrendingUp,
    },
    {
      title: "Yearly Audit Report",
      description:
        "Complete financial year audit with opening & closing balances.",
      href: "/dashboard/reports/yearly",
      icon: FileBarChart2,
    },
    {
      title: "Month Close",
      description: `${closureCount} months closed. Lock transactions for finished periods.`,
      href: "/dashboard/reports/month-close",
      icon: Lock,
    },
    {
      title: "Donation Summary",
      description: `${donationCount} total donations. Category-wise and mode-wise breakdown.`,
      href: "/dashboard/reports/donations",
      icon: IndianRupee,
    },
    {
      title: "Expense Summary",
      description: `${expenseCount} total expenses. Category and approval status analysis.`,
      href: "/dashboard/reports/expenses",
      icon: Wallet,
    },
    {
      title: "Cash Book / Bank Book",
      description:
        "Subsidiary ledger view for specific cash and bank accounts.",
      href: "/dashboard/reports/cash-book",
      icon: IndianRupee,
    },
    {
      title: "Member Passbook",
      description:
        "Track individual member account transactions and balance history.",
      href: "/dashboard/reports/passbook",
      icon: BookOpen,
    },
    {
      title: "Bank Passbook",
      description:
        "View bank-wise deposits with verification status and collection details.",
      href: "/dashboard/reports/bank-passbook",
      icon: BookOpen,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Reports & Analytics
        </h1>
        <p className="text-muted-foreground">
          Generate and view financial reports.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reportCards.map((card) => (
          <Link key={card.href} href={card.href}>
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer hover:border-primary/30">
              <CardHeader className="flex flex-row items-start gap-3">
                <div className="rounded-md bg-primary/10 p-2">
                  <card.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{card.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {card.description}
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
