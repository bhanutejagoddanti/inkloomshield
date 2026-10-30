'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Sliders, Zap, ImagePlus, Menu, X } from 'lucide-react';
import { AuditReport } from '@/lib/types';

interface NavbarProps {
  currentReport?: AuditReport | null;
  onOpenSettings?: () => void;
  onLoadJudgePreset?: () => void;
}

export function Navbar({ currentReport, onOpenSettings, onLoadJudgePreset }: NavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 relative flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center shadow-sm">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-slate-900">
                Inkloom<span className="text-indigo-600">Shield</span>
              </span>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200 hidden sm:inline">
                v2.4
              </span>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-0.5 text-sm text-slate-500">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-md transition-colors font-medium ${
                pathname === '/'
                  ? 'text-slate-900 bg-slate-100'
                  : 'hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              Audit
            </Link>
            <Link
              href="/workspace"
              className={`px-3 py-1.5 rounded-md transition-colors font-medium flex items-center gap-1.5 ${
                pathname === '/workspace'
                  ? 'text-slate-900 bg-slate-100'
                  : 'hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              Workspace
              {currentReport && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                  currentReport.currentScore >= 85
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-red-50 text-red-600 border border-red-200'
                }`}>
                  {currentReport.currentScore}%
                </span>
              )}
            </Link>
            <Link
              href="/creative-audit"
              className={`px-3 py-1.5 rounded-md transition-colors font-medium ${
                pathname === '/creative-audit' ? 'text-slate-900 bg-slate-100' : 'hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              Creative Audit
            </Link>
            <Link
              href="/governance"
              className={`px-3 py-1.5 rounded-md transition-colors font-medium ${
                pathname === '/governance' ? 'text-slate-900 bg-slate-100' : 'hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              Governance Hub
            </Link>
          </nav>
        </div>

        {/* Mobile navigation */}
        <div className="md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="p-2 rounded-md text-slate-600 hover:bg-slate-100 transition-colors"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          {mobileMenuOpen && (
            <div className="absolute top-full left-4 right-4 mt-2 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
              <nav className="flex flex-col gap-1" aria-label="Mobile">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2.5 rounded-lg text-sm font-medium ${pathname === '/' ? 'text-slate-900 bg-slate-100' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  Audit
                </Link>
                <Link
                  href="/workspace"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 ${pathname === '/workspace' ? 'text-slate-900 bg-slate-100' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  Workspace
                  {currentReport && <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${currentReport.currentScore >= 85 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>{currentReport.currentScore}%</span>}
                </Link>
                <Link
                  href="/creative-audit"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2.5 rounded-lg text-sm font-medium ${pathname === '/creative-audit' ? 'text-slate-900 bg-slate-100' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  Creative Audit
                </Link>
                <Link
                  href="/governance"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2.5 rounded-lg text-sm font-medium ${pathname === '/governance' ? 'text-slate-900 bg-slate-100' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  Governance Hub
                </Link>
              </nav>
            </div>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {onLoadJudgePreset && (
            <button
              onClick={onLoadJudgePreset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 transition-colors"
              title="Load pre-configured judge demo with intentional errors"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Demo Preset</span>
              <span className="sm:hidden">Demo</span>
            </button>
          )}

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
              title="Configure AI Engine / API Keys"
            >
              <Sliders className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
