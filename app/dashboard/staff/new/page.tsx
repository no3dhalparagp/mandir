'use client';

import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import StaffForm from '@/components/staff/staff-form';

export default function NewStaffPage() {
  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild className="mb-4">
        <Link href="/dashboard/staff">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Staff
        </Link>
      </Button>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add Staff Member</h1>
        <p className="text-muted-foreground mt-2">Create a new staff profile with designation and banking details</p>
      </div>

      <StaffForm />
    </div>
  );
}
