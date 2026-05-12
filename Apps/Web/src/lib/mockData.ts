export type ReportStatus = "pending" | "assigned" | "resolved" | "rejected";

export interface Report {
  id: string;
  userId: string;
  image: string;
  proofImage?: string;
  lat: number;
  lng: number;
  status: ReportStatus;
  createdAt: string;
  category: string;
  description: string;
  upvotes: number;
  workerId?: string;
}

export interface Worker {
  id: string;
  name: string;
  contact: string;
  status: "available" | "busy" | "offline";
  activeTasks: number;
  lat: number;
  lng: number;
  avatar: string;
}

const img = (id: number) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=70`;

export const workers: Worker[] = [
  {
    id: "WRK-001",
    name: "Ravi Kumar",
    contact: "+91 98210 11223",
    status: "busy",
    activeTasks: 3,
    lat: 28.6139,
    lng: 77.209,
    avatar: "https://i.pravatar.cc/120?img=12",
  },
  {
    id: "WRK-002",
    name: "Priya Sharma",
    contact: "+91 98765 43210",
    status: "available",
    activeTasks: 1,
    lat: 28.6219,
    lng: 77.218,
    avatar: "https://i.pravatar.cc/120?img=47",
  },
  {
    id: "WRK-003",
    name: "Amit Verma",
    contact: "+91 99887 66554",
    status: "busy",
    activeTasks: 2,
    lat: 28.6049,
    lng: 77.198,
    avatar: "https://i.pravatar.cc/120?img=33",
  },
  {
    id: "WRK-004",
    name: "Sunita Devi",
    contact: "+91 91234 56789",
    status: "available",
    activeTasks: 0,
    lat: 28.6309,
    lng: 77.225,
    avatar: "https://i.pravatar.cc/120?img=49",
  },
  {
    id: "WRK-005",
    name: "Mohan Lal",
    contact: "+91 90909 80808",
    status: "offline",
    activeTasks: 0,
    lat: 28.5979,
    lng: 77.19,
    avatar: "https://i.pravatar.cc/120?img=15",
  },
  {
    id: "WRK-006",
    name: "Kavita Joshi",
    contact: "+91 88888 77777",
    status: "busy",
    activeTasks: 4,
    lat: 28.6189,
    lng: 77.203,
    avatar: "https://i.pravatar.cc/120?img=44",
  },
];

const statuses: ReportStatus[] = ["pending", "assigned", "resolved", "rejected"];
const cats = ["Pothole", "Garbage", "Streetlight", "Water Leak", "Sewage", "Stray Animals"];
const sampleImgs = [
  "1583952423203-d3d3a2dcad15",
  "1545158539-1709bf5e13d8",
  "1568605114967-8130f3a36994",
  "1542621334-a254cf47733d",
  "1601004890684-d8cbf643f5f2",
  "1518002171953-a080ee817e1f",
  "1493946740644-2d8a1f1a6aff",
  "1518709268805-4e9042af2176",
];
const proofImgs = [
  "1517245386807-bb43f82c33c4",
  "1581094288338-2314dddb7ece",
  "1503387762-bf76847e3c4f",
];

export const reports: Report[] = Array.from({ length: 28 }).map((_, i) => {
  const status = statuses[i % statuses.length];
  const worker = status === "assigned" || status === "resolved" ? workers[i % workers.length] : undefined;
  const created = new Date(Date.now() - i * 1000 * 60 * 60 * 7);
  return {
    id: `RPT-${(2400 + i).toString()}`,
    userId: `USR-${(1000 + (i % 12)).toString()}`,
    image: img(parseInt(sampleImgs[i % sampleImgs.length])),
    proofImage:
      status === "resolved" ? img(parseInt(proofImgs[i % proofImgs.length])) : undefined,
    lat: +(28.6 + Math.sin(i) * 0.05).toFixed(5),
    lng: +(77.2 + Math.cos(i) * 0.05).toFixed(5),
    status,
    createdAt: created.toISOString(),
    category: cats[i % cats.length],
    description: `${cats[i % cats.length]} reported near sector ${10 + (i % 12)}, requires inspection.`,
    upvotes: Math.floor(Math.random() * 80) + 3,
    workerId: worker?.id,
  };
});

export const getWorker = (id?: string) => workers.find((w) => w.id === id);
