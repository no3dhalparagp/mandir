'use client';

import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import PartyForm from '@/components/parties/party-form';

export default function NewPartyPage() {
  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild className="mb-4">
        <Link href="/dashboard/parties">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Parties
        </Link>
      </Button>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add New Party</h1>
        <p className="text-muted-foreground mt-2">Create a new vendor, customer, or party account</p>
      </div>

      <PartyForm />
    </div>
  );
}
