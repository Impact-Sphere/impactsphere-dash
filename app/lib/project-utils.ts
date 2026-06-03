const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&auto=format&fit=crop&q=60";

export function getProjectImage(image: string | null): string {
  return image || FALLBACK_IMAGE;
}

export function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `€${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `€${(amount / 1_000).toFixed(amount >= 10_000 ? 0 : 1)}k`;
  }
  return `€${amount}`;
}

export function getFundedPercent(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(Math.round((current / target) * 100), 100);
}

export function getNgoName(project: {
  ngo?: { name: string | null; ngoInfo?: { ngoName: string } | null } | null;
}): string {
  return project.ngo?.ngoInfo?.ngoName || project.ngo?.name || "Unknown NGO";
}

export function getCompanyName(user: {
  companyInfo?: { companyName: string } | null;
  name?: string | null;
}): string {
  return user.companyInfo?.companyName || user.name || "Unknown Company";
}
