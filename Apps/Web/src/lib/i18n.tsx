import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "hi";

const dict = {
  en: {
    appName: "LokAwaaz",
    portal: "Municipality Portal",
    tagline: "AI-powered civic issue management",
    login: "Login",
    email: "Email",
    password: "Password",
    signIn: "Sign in",
    signingIn: "Signing in...",
    welcomeBack: "Welcome back",
    loginSubtitle: "Sign in to manage civic reports across your municipality",
    dashboard: "Dashboard",
    reports: "Reports",
    workers: "Workers",
    logout: "Logout",
    overview: "Overview",
    totalReports: "Total Reports",
    pending: "Pending",
    assigned: "Assigned",
    resolved: "Resolved",
    rejected: "Rejected",
    distribution: "Report Distribution",
    recentReports: "Recent Reports",
    allReports: "All Reports",
    viewAll: "View all",
    user: "User",
    image: "Image",
    location: "Location",
    status: "Status",
    dateTime: "Date & Time",
    actions: "Actions",
    all: "All",
    search: "Search reports...",
    filterByStatus: "Filter by status",
    mapView: "Map View",
    reportDetails: "Report Details",
    workerAssignment: "Worker Assignment",
    workerName: "Worker Name",
    workerId: "Worker ID",
    liveLocation: "Live Location",
    upvotes: "Community Upvotes",
    completionProof: "Completion Proof",
    deleteReport: "Delete Report",
    close: "Close",
    noWorker: "No worker assigned yet",
    noProof: "Awaiting completion proof",
    workerDirectory: "Worker Directory",
    contact: "Contact",
    availability: "Availability",
    activeTasks: "Active Tasks",
    available: "Available",
    busy: "On Duty",
    offline: "Offline",
    welcome: "Welcome",
    admin: "Administrator",
    coordinates: "Coordinates",
    submitted: "Submitted",
    confirmDelete: "Delete this report? This action cannot be undone.",
    reportDeleted: "Report deleted",
    loginFailed: "Please enter email and password",
  },
  hi: {
    appName: "लोक आवाज़",
    portal: "नगर निगम पोर्टल",
    tagline: "एआई-संचालित नागरिक समस्या प्रबंधन",
    login: "लॉगिन",
    email: "ईमेल",
    password: "पासवर्ड",
    signIn: "साइन इन करें",
    signingIn: "साइन इन हो रहा है...",
    welcomeBack: "वापसी पर स्वागत है",
    loginSubtitle: "अपने नगर निगम की शिकायतें प्रबंधित करने के लिए साइन इन करें",
    dashboard: "डैशबोर्ड",
    reports: "रिपोर्ट्स",
    workers: "कर्मचारी",
    logout: "लॉगआउट",
    overview: "अवलोकन",
    totalReports: "कुल रिपोर्ट्स",
    pending: "लंबित",
    assigned: "सौंपी गई",
    resolved: "हल",
    rejected: "अस्वीकृत",
    distribution: "रिपोर्ट वितरण",
    recentReports: "हाल की रिपोर्ट्स",
    allReports: "सभी रिपोर्ट्स",
    viewAll: "सभी देखें",
    user: "उपयोगकर्ता",
    image: "छवि",
    location: "स्थान",
    status: "स्थिति",
    dateTime: "दिनांक और समय",
    actions: "कार्रवाई",
    all: "सभी",
    search: "रिपोर्ट खोजें...",
    filterByStatus: "स्थिति के अनुसार फ़िल्टर करें",
    mapView: "नक्शा दृश्य",
    reportDetails: "रिपोर्ट विवरण",
    workerAssignment: "कर्मचारी असाइनमेंट",
    workerName: "कर्मचारी का नाम",
    workerId: "कर्मचारी आईडी",
    liveLocation: "लाइव स्थान",
    upvotes: "सामुदायिक वोट",
    completionProof: "पूर्णता प्रमाण",
    deleteReport: "रिपोर्ट हटाएं",
    close: "बंद करें",
    noWorker: "अभी तक कोई कर्मचारी नहीं सौंपा गया",
    noProof: "पूर्णता प्रमाण की प्रतीक्षा है",
    workerDirectory: "कर्मचारी निर्देशिका",
    contact: "संपर्क",
    availability: "उपलब्धता",
    activeTasks: "सक्रिय कार्य",
    available: "उपलब्ध",
    busy: "ड्यूटी पर",
    offline: "ऑफलाइन",
    welcome: "स्वागत है",
    admin: "प्रशासक",
    coordinates: "निर्देशांक",
    submitted: "प्रस्तुत",
    confirmDelete: "इस रिपोर्ट को हटाएं? यह क्रिया पूर्ववत नहीं की जा सकती।",
    reportDeleted: "रिपोर्ट हटा दी गई",
    loginFailed: "कृपया ईमेल और पासवर्ड दर्ज करें",
  },
} as const;

export type TKey = keyof typeof dict.en;

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: TKey) => string;
}

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("lokawaaz-lang") : null;
    if (saved === "en" || saved === "hi") setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("lokawaaz-lang", l);
  };

  const t = (k: TKey) => dict[lang][k] ?? dict.en[k];
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useI18n outside provider");
  return c;
}
