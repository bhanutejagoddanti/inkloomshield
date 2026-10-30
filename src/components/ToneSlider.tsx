'use client';

import React from 'react';
import { ToneStyle } from '@/lib/types';
import { Flame, Scale, Landmark } from 'lucide-react';

interface ToneSliderProps {
  selectedTone: ToneStyle;
  onSelectTone: (tone: ToneStyle) => void;
  fixes: {
    hook: string;
    balanced: string;
    strict: string;
  };
  disabled?: boolean;
}

export function ToneSlider({ selectedTone, onSelectTone, fixes, disabled = false }: ToneSliderProps) {
  const options: { id: ToneStyle; label: string; icon: any; shortLabel: string }[] = [
    { id: 'hook', label: 'Persuasive', icon: Flame, shortLabel: 'Hook' },
    { id: 'balanced', label: 'Balanced', icon: Scale, shortLabel: 'Brand' },
    { id: 'strict', label: 'Corporate', icon: Landmark, shortLabel: 'Strict' },
  ];

  const currentFix = fixes[selectedTone] || fixes.balanced;
  const selectedOption = options.find((o) => o.id === selectedTone);

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
      {/* Header */}
      <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700">Tone Preference</span>
        <span className="text-[10px] text-slate-400 font-medium">Select before applying fix</span>
      </div>

      {/* Toggle */}
      <div className="p-2.5 bg-white">
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-md">
          {options.map((opt) => {
            const isSelected = selectedTone === opt.id;
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                type="button"
                disabled={disabled}
                onClick={() => onSelectTone(opt.id)}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-[5px] text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:text-slate-700 disabled:opacity-40'
                }`}
              >
                <Icon className={`w-3 h-3 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Preview */}
      <div className="px-3 pb-3 space-y-1.5">
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 uppercase tracking-wide">
          <span>{selectedOption?.label} rewrite preview</span>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-md p-2.5">
          <p className="text-xs text-emerald-800 leading-relaxed font-medium">
            &ldquo;{currentFix}&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}
