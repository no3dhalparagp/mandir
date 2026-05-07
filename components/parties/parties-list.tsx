'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, Trash2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { formatINR } from '@/lib/utils';

interface Party {
  id: string;
  partyName: string;
  partyCode: string;
  partyType: string;
  email?: string;
  mobile?: string;
  openingBalance: number;
  currentBalance: number;
  isActive: boolean;
}

export default function PartiesList() {
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  useEffect(() => {
    fetchParties();
  }, []);

  const fetchParties = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter !== 'ALL') params.append('type', typeFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/parties?${params}`);
      if (!response.ok) throw new Error('Failed to fetch parties');
      const data = await response.json();
      setParties(data.parties || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load parties');
    } finally {
      setLoading(false);
    }
  };

  const deleteParty = async (id: string) => {
    if (!confirm('Are you sure? This will deactivate the party. All transactions will remain.')) return;
    
    try {
      const response = await fetch(`/api/parties/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete party');
      await fetchParties();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete party');
    }
  };

  const getPartyTypeColor = (type: string) => {
    switch (type) {
      case 'VENDOR':
        return 'bg-blue-100 text-blue-800';
      case 'CUSTOMER':
        return 'bg-green-100 text-green-800';
      case 'MEMBER':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'text-red-600'; // Party owes us
    if (balance < 0) return 'text-green-600'; // We owe party
    return 'text-gray-600';
  };

  if (loading) {
    return <div className="text-center py-10">Loading parties...</div>;
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2 flex-wrap">
        <Input
          placeholder="Search by name or code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="VENDOR">Vendor</SelectItem>
            <SelectItem value="CUSTOMER">Customer</SelectItem>
            <SelectItem value="MEMBER">Member</SelectItem>
            <SelectItem value="PARTY">Party</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => fetchParties()}>Apply Filters</Button>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-right">Opening Balance</TableHead>
              <TableHead className="text-right">Current Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parties.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  No parties found
                </TableCell>
              </TableRow>
            ) : (
              parties.map((party) => (
                <TableRow key={party.id}>
                  <TableCell className="font-mono text-sm font-semibold">{party.partyCode}</TableCell>
                  <TableCell className="font-medium">{party.partyName}</TableCell>
                  <TableCell>
                    <Badge className={getPartyTypeColor(party.partyType)}>{party.partyType}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {party.email && <div>{party.email}</div>}
                    {party.mobile && <div>{party.mobile}</div>}
                    {!party.email && !party.mobile && <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="text-right font-mono">{formatINR(party.openingBalance)}</TableCell>
                  <TableCell className={`text-right font-mono font-semibold ${getBalanceColor(party.currentBalance)}`}>
                    {formatINR(party.currentBalance)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={party.isActive ? 'default' : 'secondary'}>
                      {party.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                    >
                      <Link href={`/dashboard/parties/${party.id}`}>
                        <Eye className="w-4 h-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteParty(party.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
