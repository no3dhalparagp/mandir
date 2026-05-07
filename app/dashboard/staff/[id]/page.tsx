'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import StaffForm from '@/components/staff/staff-form';

export default function StaffDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchStaff();
    }
  }, [id]);

  const fetchStaff = async () => {
    try {
      const response = await fetch(`/api/staff/${id}`);
      if (!response.ok) throw new Error('Failed to fetch staff');
      const data = await response.json();
      setStaff(data.staff);
    } catch (error) {
      console.error('[v0] Failed to fetch staff:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild className="mb-4">
        <Link href="/dashboard/staff">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Staff
        </Link>
      </Button>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Staff Details</h1>
        <p className="text-muted-foreground mt-2">Update staff information and banking details</p>
      </div>

      {staff && <StaffForm initialData={staff} />}
    </div>
  );
}
