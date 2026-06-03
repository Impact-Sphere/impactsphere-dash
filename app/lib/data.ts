import type { NavItem, Project } from "../types/project";

export const navItems: NavItem[] = [
  {
    id: "discover",
    label: "Project Discovery",
    icon: "explore",
    href: "/discover",
  },
];

export const footerNavItems: NavItem[] = [
  { id: "settings", label: "Settings", icon: "settings", href: "/settings" },
  {
    id: "support",
    label: "Support",
    icon: "contact_support",
    href: "/support",
  },
];

export const categories = [
  { id: "all", label: "All Impacts", active: true },
  { id: "Environment", label: "Environment" },
  { id: "Education", label: "Education" },
  { id: "Healthcare", label: "Healthcare" },
  { id: "Tech Equity", label: "Tech Equity" },
  { id: "Disaster Relief", label: "Disaster Relief" },
];

export const featuredProject: Project = {
  id: "1",
  title: "Amazon Reforestation & Digital Mapping",
  category: "Environment",
  description:
    "Leveraging satellite AI to track growth in real-time while employing local communities for active restoration efforts.",
  image:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuC5GLw9pUiQMrYymt6xArKshFtU6IFjOlf762zvIFPglZy3-VbWV8gkDrCAVZLyT-XkgTDRLW07mS1KdOv0QQJhap_Gs0U8OJKBTSRw996kznDdzCXEEuhZWThNcy2ZbLt9u8PMgNuMNno9e_PjR8hyE4MZp5Mi-jKG8uLDWhMytF0SU1s34ZvPxr9gfexdrFrAxNMS96g62dxwN05vx1AMi4uwabYB_FaE07Gec3qsR7sS8wVxJD7qhID7P0rcGP8T6UeY-1gAUFmT",
  targetBudget: 1_600_000,
  currentAmount: 1_200_000,
  serviceSpent: 0,
  status: "ACTIVE",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ngoId: "",
  featured: true,
};

export const projects: Project[] = [
  {
    id: "2",
    title: "Code For Tomorrow: Rural India",
    category: "Education",
    description:
      "Bringing STEM education and fiber connectivity to over 50 remote villages.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAtfp5dVLkD69yqJzgXswisxaYnGNFOQkJVATnkl7tNJ4fRNx5fQQ_f8yDoefDFj2oDMhnKeMFXdjar151LEkXN61vwe2PhuX697NP2ereX_LhI0v0f_UI4nuD_JNLNZNEiQVho3o-j1TIn1LHVVDW_bacTIDlZ1pxBKo74rY0GQ74eCnIaLO444g9U3qUxG_YapdSjdK1uaC30cE_SgeSEEyQIXVdTHERmcvnc3gO5eKPVh0tf5gW62XFJrnzyV10e-_cUDQlppT6e",
    targetBudget: 100_000,
    currentAmount: 45_000,
    serviceSpent: 0,
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ngoId: "",
  },
  {
    id: "3",
    title: "Solar Powered Medical Hubs",
    category: "Healthcare",
    description:
      "Modular, solar-powered clinics providing 24/7 care in off-grid sub-Saharan Africa.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBNij-woQ2qMofaZk-inaPHThJWwEnR7SXPa64NCX8V1RHykpLOFLGKCGzzkxqRvsyo6An5sH7jPwu_s5p0EffY8GdWiZNChbd8tg_RgPCRRvOlquttXNwG48pSgGqGr5dg0QtMYLR3l4NTaiIZm3J1b-SGvaIXmE6Eru9aUvGtEh0t16GBIkTZ5wPCZ_w6URwPg-pmKEbQB9xdBWpN8dFftePWySbHff7WivpVkHJucdVd-Ca5BEPUWZYlI4BJQ_zu7bds-73hjX45",
    targetBudget: 300_000,
    currentAmount: 267_000,
    serviceSpent: 0,
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ngoId: "",
  },
  {
    id: "4",
    title: "Open Source Impact Ledger",
    category: "Tech Equity",
    description:
      "Blockchain infrastructure for transparent donation tracking for global NGOs.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBIWro5tzBBrFA8H1pExKvn-0QlnQ571WhO07lb9bXjkEyU-NZqu2o2VbRcbP6YtmPMy1odTNnFgkRQnHy5TN4p4bABXIBBdI_7nGOU0IDx_kd-2j7pdeiabFuhjSZNG9Lpuyi8-_hg5i7rwYowINzlt0I5d5SiKpjk1Wdxmegqb257O0XMUARyASbTl9j_CcEF0ZyPeKYBtoVaFM-Hw7jAttieXiadEpsaL5oqDkl3kKYf86DN678edeUrqLYWGZIN5WZIXguhWuQh",
    targetBudget: 150_000,
    currentAmount: 18_000,
    serviceSpent: 0,
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ngoId: "",
  },
];
