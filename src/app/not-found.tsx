'use client';

import React from 'react';
import Link from 'next/link';
import { Shield } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="w-14 h-14 rounded-xl bg-slate-900 flex items-center justify-center">
          <Shield className="w-7 h-7 text-white" />
        </div>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900">Page not found</h1>
        <p className="mt-3 max-w-md text-sm text-slate-600 leading-relaxed">
          The page you requested is not part of the Inkloom Shield audit workflow.
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
        >
          Return to Audit
        </Link>
      </div>
    </main>
  );
}
