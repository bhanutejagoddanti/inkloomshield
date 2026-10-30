'use client';

import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface ScoreGaugeProps {
  score: number;
  breakdown: {
    factualAccuracy: number;
    toneAlignment: number;
    guidelineCompliance: number;
  };
  totalIssues: number;
  resolvedIssues: number;
}

export function ScoreGauge({ score, breakdown, totalIssues, resolvedIssues }: ScoreGaugeProps) {
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let strokeColor = '#ef4444';
  let statusLabel = 'High Risk';
  let statusClass = 'bg-red-50 text-red-700 border-red-200';
  let Icon = ShieldAlert;

  if (score >= 85) {
    strokeColor = '#10b981';
    statusLabel = score === 100 ? 'Publication Ready' : 'Brand Compliant';
    statusClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    Icon = ShieldCheck;
  } else if (score >= 60) {
    strokeColor = '#f59e0b';
    statusLabel = 'Needs Review';
    statusClass = 'bg-amber-50 text-amber-700 border-amber-200';
    Icon = AlertTriangle;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Brand Trust Score</p>
          <h3 className="text-base font-semibold text-slate-900 mt-0.5">Compliance Overview</h3>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusClass}`}>
          <Icon className="w-3.5 h-3.5" />
          {statusLabel}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Gauge */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg className="w-32 h-32 -rotate-90" viewBox="0 0 140 140">
            <circle
              cx="70" cy="70" r={radius}
              stroke="#f1f5f9" strokeWidth="10" fill="transparent"
            />
            <circle
              cx="70" cy="70" r={radius}
              stroke={strokeColor}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center text-center">
            <span className="text-2xl font-bold text-slate-900 tabular-nums leading-none">
              {score}<span className="text-sm font-medium text-slate-400">%</span>
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 font-medium">
              {resolvedIssues}/{totalIssues} cleared
            </span>
          </div>
        </div>

        {/* Breakdown bars */}
        <div className="flex-1 w-full space-y-3">
          {[
            { label: 'Factual Accuracy', value: breakdown.factualAccuracy, color: 'bg-red-500' },
            { label: 'Tone Alignment', value: breakdown.toneAlignment, color: 'bg-amber-400' },
            { label: 'Policy Compliance', value: breakdown.guidelineCompliance, color: 'bg-indigo-500' },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 font-medium">{item.label}</span>
                <span className="text-slate-800 font-semibold tabular-nums">{item.value}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${item.color} rounded-full transition-all duration-500`}
                  style={{ width: `${item.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {score === 100 && (
        <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 font-medium text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5" />
            All compliance gates passed. Ready for distribution.
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[10px] uppercase tracking-wide">
            Passed
          </span>
        </div>
      )}
    </div>
  );
}
