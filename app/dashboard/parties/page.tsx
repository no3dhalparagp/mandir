'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import PartiesList from '@/components/parties/parties-list';

export default function PartiesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Parties Management</h1>
          <p className="text-muted-foreground mt-2">Manage vendors, customers, and payment parties with ledger tracking</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/parties/new">
            <Plus className="w-4 h-4 mr-2" />
            Add Party
          </Link>
        </Button>
      </div>

      <PartiesList />
    </div>
  );
}
