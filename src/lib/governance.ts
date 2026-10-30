export type Tab = 'overview' | 'knowledge' | 'visual' | 'approvals' | 'integrations';
export type GuidelineStatus = 'Approved' | 'Draft';
export type ApprovalStatus = 'In review' | 'Approved' | 'Rejected';
export type Approval = {
  id: string;
  title: string;
  owner: string;
  status: ApprovalStatus;
  score: number;
  created: string;
  notes: string;
};
export type AuditRecord = {
  id: string;
  title: string;
  score: number;
  issues: number;
  created: string;
  status: string;
};
export type BrandAsset = {
  id: string;
  name: string;
  type: string;
  colors: string;
  updated: string;
};
export type Guideline = {
  id: string;
  name: string;
  kind: string;
  content: string;
  version: number;
  status: GuidelineStatus;
  updated: string;
};
export type GovernanceState = {
  guidelines: Guideline[];
  approvals: Approval[];
  assets: BrandAsset[];
  history: AuditRecord[];
};

export const GOVERNANCE_STORAGE_KEY = 'inkloom_round3_hub_v1';
export const STARTING_GOVERNANCE: GovernanceState = {
  guidelines: [
    { id: 'g1', name: 'Master Brand Voice', kind: 'Brand guidelines', content: 'Use clear, confident language. Avoid unsupported superlatives. Do not promise guaranteed outcomes. Prefer active voice and plain English.', version: 1, status: 'Approved', updated: '2026-10-30' },
    { id: 'g2', name: 'Product Claims & Specifications', kind: 'Product specification', content: 'All performance claims must be traceable to approved evidence. Do not invent specifications, certifications, customer results, or availability.', version: 1, status: 'Approved', updated: '2026-10-30' },
  ],
  approvals: [
    { id: 'a1', title: 'Q4 product launch announcement', owner: 'Marketing', status: 'In review', score: 82, created: 'Today', notes: 'Review performance claims and brand color usage.' },
    { id: 'a2', title: 'Customer onboarding email', owner: 'Customer success', status: 'Approved', score: 100, created: 'Yesterday', notes: 'All required checks passed.' },
  ],
  assets: [
    { id: 'b1', name: 'Primary brand palette', type: 'Color system', colors: '#4338CA, #0F172A, #FFFFFF', updated: '2026-10-30' },
    { id: 'b2', name: 'Official logo reference', type: 'Logo reference', colors: 'Reference file not uploaded', updated: '2026-10-30' },
  ],
  history: [],
};

export function contrastRatio(a: string, b: string): number | null {
  const lum = (hex: string) => {
    if (!/^#?([0-9a-f]{6})$/i.test(hex)) return null;
    const h = hex.replace('#', '');
    const c = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const l1 = lum(a);
  const l2 = lum(b);
  if (l1 === null || l2 === null) return null;
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}
