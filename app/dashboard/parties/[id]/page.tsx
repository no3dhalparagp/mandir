'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import PartyForm from '@/components/parties/party-form';

export default function PartyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [party, setParty] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchParty();
    }
  }, [id]);

  const fetchParty = async () => {
    try {
      const response = await fetch(`/api/parties/${id}`);
      if (!response.ok) throw new Error('Failed to fetch party');
      const data = await response.json();
      setParty(data.party);
    } catch (error) {
      console.error('[v0] Failed to fetch party:', error);
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
        <Link href="/dashboard/parties">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Parties
        </Link>
      </Button>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Party Details</h1>
        <p className="text-muted-foreground mt-2">Update party information and account settings</p>
      </div>

      {party && <PartyForm initialData={party} />}
    </div>
  );
}
