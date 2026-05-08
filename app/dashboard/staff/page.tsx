'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import StaffList from '@/components/staff/staff-list';

export default function StaffPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Directory</h1>
          <p className="text-muted-foreground mt-2">Manage staff details, designations, and banking information</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/staff/new">
            <Plus className="w-4 h-4 mr-2" />
            Add Staff
          </Link>
        </Button>
      </div>

      <StaffList />
    </div>
  );
}
