export type ProjectCategory =
  | "Environment"
  | "Education"
  | "Healthcare"
  | "Tech Equity"
  | "Disaster Relief";

export interface ProjectDocument {
  id: string;
  url: string;
  fileName: string;
  mimeType?: string | null;
  size?: number | null;
}

export interface Project {
  id: string;
  title: string;
  category: string;
  description: string;
  image: string | null;
  targetBudget: number;
  currentAmount: number;
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
  featured?: boolean;
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
