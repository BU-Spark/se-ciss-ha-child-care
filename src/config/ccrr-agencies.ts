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
