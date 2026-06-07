export type ProjectCategory =
  | "Education"
  | "Healthcare"
  | "Tech Equity"
  | "Disaster Relief"
  | "Housing";

export interface ProjectDocument {
  id: string;
  url: string;
  fileName: string;
  mimeType?: string | null;
  size?: number | null;
}
export interface ServiceAcquisitionItem {
  id: string;
  status: string;
  startDate: string;
  endDate: string | null;
  deliveredAt: string | null;
  completedAt: string | null;
  revisionsUsed: number;
  deliveryMessage: string | null;
  createdAt: string;
  service: {
    id: string;
    name: string;
    category: string;
    provider: { name: string | null; email: string };
  };
  package: {
    name: string;
    price: number;
    deliveryDays: number;
    revisions: number;
  };
  chat: { id: string } | null;
  review: { id: string; rating: number; comment: string | null } | null;
}

export interface Project {
  id: string;
  title: string;
  category: string;
  description: string;
  image: string | null;
  targetBudget: number;
  currentAmount: number;
  serviceSpent: number;
  status: string;
  approvalStatus?: string;
  createdAt: string;
  updatedAt: string;
  ngoId: string;
  ngo?: {
    name: string | null;
    image: string | null;
    ngoInfo?: { ngoName: string } | null;
  };
  projectDocuments?: ProjectDocument[];
  _count?: { donations: number };
  donations?: DonationItem[];
  serviceAcquisitions?: ServiceAcquisitionItem[];
  featured?: boolean;
  isFavorited?: boolean;
}

export interface DonationItem {
  id: string;
  amount: number;
  createdAt: string;
  company: {
    id: string;
    name: string | null;
    image: string | null;
    companyInfo?: { companyName: string } | null;
  };
}

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
}

export interface CategoryFilterItem {
  id: string;
  label: string;
  active?: boolean;
}
