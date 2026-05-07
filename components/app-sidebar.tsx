"use client";

import {
  BadgeIndianRupee,
  Building2,
  Calendar,
  ChevronRight,
  ClipboardList,
  GitMerge,
  Home,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
  ArrowLeftRight,
  FileBarChart2,
  UserCheck,
  Landmark,
  ClipboardCheck,
  BookOpen,
  ScrollText,
  Lock,
  User,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";

import type { LucideIcon } from "lucide-react";

type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  children?: { title: string; url: string; roles?: string[] }[];
  roles?: string[];
};

type NavGroup = {
  label: string;
  items: NavItem[];
  roles?: string[];
};

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", url: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Finance",
    items: [
      {
        title: "Donations",
        url: "/dashboard/donations",
        icon: BadgeIndianRupee,
      },
      {
        title: "Expenses",
        url: "/dashboard/expenses",
        icon: Wallet,
      },
      {
        title: "Member Collections",
        url: "/dashboard/collections",
        icon: UserCheck,
      },
    ],
  },
  {
    label: "Banking",
    roles: ["SUPER_ADMIN", "COMMITTEE_ADMIN", "ACCOUNTANT"],
    items: [
      {
        title: "Bank Accounts",
        url: "/dashboard/bank",
        icon: Building2,
      },
      {
        title: "Deposit Verification",
        url: "/dashboard/deposits",
        icon: CheckCircle2,
      },
      {
        title: "Chart of Accounts",
        url: "/dashboard/coa",
        icon: BookOpen,
      },
      {
        title: "Journal / Master Ledger",
        url: "/dashboard/journal",
        icon: ClipboardList,
      },
      {
        title: "Fund Transfers",
        url: "/dashboard/bank/transfers",
        icon: ArrowLeftRight,
      },
      {
        title: "Reconciliation",
        url: "/dashboard/bank/reconciliation",
        icon: GitMerge,
      },
    ],
  },
  {
    label: "Administration",
    roles: ["SUPER_ADMIN", "COMMITTEE_ADMIN"],
    items: [
      { title: "Members", url: "/dashboard/members", icon: Users },
      { title: "Events & Pujas", url: "/dashboard/events", icon: Calendar },
    ],
  },
  {
    label: "Reports",
    items: [
      {
        title: "Reports",
        url: "/dashboard/reports",
        icon: FileBarChart2,
        children: [
          { title: "Daily Collection", url: "/dashboard/reports/daily" },
          { title: "Monthly Statement", url: "/dashboard/reports/monthly" },
          { title: "Yearly Audit", url: "/dashboard/reports/yearly" },
          { title: "Month Close", url: "/dashboard/reports/month-close" },
          { title: "Donation Summary", url: "/dashboard/reports/donations" },
          { title: "Expense Summary", url: "/dashboard/reports/expenses" },
          { title: "Cash Book", url: "/dashboard/reports/cash-book" },
        ],
      },
    ],
  },
  {
    label: "Registers",
    roles: [
      "SUPER_ADMIN",
      "COMMITTEE_ADMIN",
      "ACCOUNTANT",
      "DATA_ENTRY_OPERATOR",
      "VIEWER",
    ],
    items: [
      {
        title: "Cheque Register",
        url: "/dashboard/registers/cheques",
        icon: ClipboardCheck,
      },
      {
        title: "Asset Register",
        url: "/dashboard/registers/assets",
        icon: Landmark,
      },
    ],
  },
  {
    label: "Account",
    items: [
      { title: "My Profile", url: "/dashboard/profile", icon: User },
    ],
  },
  {
    label: "System",
    roles: ["SUPER_ADMIN", "COMMITTEE_ADMIN"],
    items: [
      { title: "User Management", url: "/dashboard/users", icon: ShieldCheck },
      {
        title: "Audit Log",
        url: "/dashboard/audit-log",
        icon: ScrollText,
        roles: ["SUPER_ADMIN", "COMMITTEE_ADMIN"],
      },
      { title: "Settings", url: "/dashboard/settings", icon: Settings },
    ],
  },
];

export function AppSidebar({ role = "VIEWER" }: { role?: string }) {
  const pathname = usePathname();

  const filteredNavGroups = navGroups
    .filter((group) => !group.roles || group.roles.includes(role))
    .map((group) => ({
      ...group,
      items: group.items
        .filter((item) => !item.roles || item.roles.includes(role))
        .map((item) => ({
          ...item,
          children: item.children?.filter(
            (child) => !child.roles || child.roles.includes(role),
          ),
        })),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Home className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-bold leading-none">Mandir System</p>
            <p className="text-xs text-muted-foreground leading-none mt-0.5">
              Committee Accounts
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {filteredNavGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) =>
                  item.children ? (
                    <Collapsible
                      key={item.title}
                      defaultOpen={pathname.startsWith(item.url)}
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger
                          render={
                            <SidebarMenuButton
                              isActive={pathname.startsWith(item.url)}
                              tooltip={item.title}
                            />
                          }
                        >
                          <item.icon />
                          <span>{item.title}</span>
                          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.children.map((child) => (
                              <SidebarMenuSubItem key={child.title}>
                                <SidebarMenuSubButton
                                  render={<Link href={child.url} />}
                                  isActive={pathname === child.url}
                                >
                                  <span>{child.title}</span>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  ) : (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        render={<Link href={item.url} />}
                        isActive={pathname === item.url}
                        tooltip={item.title}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ),
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
