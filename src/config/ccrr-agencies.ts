/**
 * Official CCR&R agencies used by Massachusetts EEC (client list, June 2026).
 * Used for the Resources tab and as the canonical agency directory.
 */
export type CcrrAgencyResource = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  region: string;
  phone: string;
  website: string;
  /** When paperwork PDFs are available under /public/resources/ */
  paperwork: {
    label: string;
    href: string;
  } | null;
  paperworkStatus: "available" | "pending";
};

export const OFFICIAL_CCRR_AGENCIES: CcrrAgencyResource[] = [
  {
    id: "agency-child-care-choices",
    name: "Child Care Choices of Boston",
    address: "105 Chauncy St.",
    city: "Boston",
    state: "MA",
    zip: "02111",
    region: "Metro Boston",
    phone: "617-542-5437",
    website: "https://cccboston.org",
    paperwork: {
      label: "Required paperwork (PDF)",
      href: "/resources/child-care-choices-of-boston.pdf",
    },
    paperworkStatus: "pending",
  },
  {
    id: "agency-child-care-network",
    name: "Child Care Network",
    address: "372 North St.",
    city: "Hyannis",
    state: "MA",
    zip: "02601",
    region: "Cape and Islands",
    phone: "508-778-9470",
    website: "https://www.cacci.cc",
    paperwork: null,
    paperworkStatus: "pending",
  },
  {
    id: "agency-child-care-circuit",
    name: "Child Care Circuit",
    address: "190 Hampshire St.",
    city: "Lawrence",
    state: "MA",
    zip: "01840",
    region: "Northeast",
    phone: "978-686-4288",
    website: "https://thecommunitygroupinc.org/child-care-circuit/",
    paperwork: null,
    paperworkStatus: "pending",
  },
  {
    id: "agency-community-care-for-kids",
    name: "Community Care for Kids",
    address: "1509 Hancock St.",
    city: "Quincy",
    state: "MA",
    zip: "02169",
    region: "Metro South",
    phone: "617-657-5305",
    website: "https://qcap.org",
    paperwork: null,
    paperworkStatus: "pending",
  },
  {
    id: "agency-child-care-works",
    name: "Child Care Works",
    address: "134 S 2nd St.",
    city: "New Bedford",
    state: "MA",
    zip: "02740",
    region: "Southeast",
    phone: "508-999-9930",
    website: "https://paceinfo.org",
    paperwork: null,
    paperworkStatus: "pending",
  },
  {
    id: "agency-seven-hills",
    name: "Seven Hills Child Care Resources",
    address: "799 West Boylston St.",
    city: "Worcester",
    state: "MA",
    zip: "01606",
    region: "Central",
    phone: "508-856-7930",
    website: "https://www.sevenhills.org",
    paperwork: {
      label: "Required paperwork (PDF)",
      href: "/resources/seven-hills-child-care-resources.pdf",
    },
    paperworkStatus: "pending",
  },
];

export function formatAgencyAddress(agency: CcrrAgencyResource) {
  return `${agency.address} ${agency.city}, ${agency.state} ${agency.zip}`;
}
