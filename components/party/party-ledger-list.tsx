"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye } from "lucide-react";
import { formatINR } from "@/lib/utils";

interface Party {
  id: string;
  partyCode: string;
  partyName: string;
  partyType: string;
  email?: string;
  mobile?: string;
  openingBalance: number;
  currentBalance: number;
  isActive: boolean;
}

export default function PartyLedgerList() {
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchParties = async () => {
      try {
        const params = new URLSearchParams();
        if (search) params.append("search", search);

        const response = await fetch(`/api/parties?${params}`);
        if (response.ok) {
          const data = await response.json();
          setParties(data.parties);
        }
      } catch (error) {
        console.error("[v0] Failed to fetch parties:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchParties();
  }, [search]);

  const getPartyTypeColor = (type: string) => {
    switch (type) {
      case "VENDOR":
        return "bg-blue-100 text-blue-800";
      case "CUSTOMER":
        return "bg-green-100 text-green-800";
      case "MEMBER":
        return "bg-purple-100 text-purple-800";
      case "PARTY":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading party ledger...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="flex gap-4">
        <Input
          placeholder="Search by party name or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Code</TableHead>
              <TableHead>Party Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-right">Opening Balance</TableHead>
              <TableHead className="text-right">Current Balance</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parties.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No parties found
                </TableCell>
              </TableRow>
            ) : (
              parties.map((party) => (
                <TableRow key={party.id}>
                  <TableCell className="font-medium">{party.partyCode}</TableCell>
                  <TableCell className="font-medium">{party.partyName}</TableCell>
                  <TableCell>
                    <Badge className={getPartyTypeColor(party.partyType)}>
                      {party.partyType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {party.email && <p>{party.email}</p>}
                      {party.mobile && <p className="text-muted-foreground">{party.mobile}</p>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatINR(party.openingBalance)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    <span className={party.currentBalance > 0 ? "text-green-600" : party.currentBalance < 0 ? "text-red-600" : ""}>
                      {formatINR(party.currentBalance)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/dashboard/party-ledger/${party.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
