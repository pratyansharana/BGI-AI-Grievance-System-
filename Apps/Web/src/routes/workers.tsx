import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/firebase";
import { useAuth } from "@/lib/auth";
import { AppSidebar } from "@/components/AppSidebar";
import { useI18n } from "@/lib/i18n";
import {
  Phone,
  Briefcase,
  Plus,
  X,
  Mail,
  MapPin,
  UserRound,
  ClipboardList,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/workers")({
  component: WorkersRoute,
  head: () => ({
    meta: [
      { title: "Workers — LokAwaaz" },
      { name: "description", content: "Field staff directory and assignments." },
    ],
  }),
});

function WorkersRoute() {
  const { isAuthed, ready } = useAuth();

  if (!ready) return <div className="min-h-screen bg-background" />;
  if (!isAuthed) return <Navigate to="/login" />;

  return (
    <div className="min-h-screen flex bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-x-hidden">
        <WorkersPage />
      </main>
    </div>
  );
}

type Worker = {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  status: string;
  totalReports: number;
  imageUrl?: string;
  liveLocation?: {
    latitude: number | null;
    longitude: number | null;
  };
};

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  department: "",
};

const statusStyles: Record<string, string> = {
  available:
    "bg-[color:var(--color-status-resolved)]/15 text-[color:var(--color-status-resolved)] ring-[color:var(--color-status-resolved)]/30",
  busy:
    "bg-[color:var(--color-status-pending)]/15 text-[color:var(--color-status-pending)] ring-[color:var(--color-status-pending)]/30",
  offline: "bg-muted text-muted-foreground ring-border",
};

function WorkersPage() {
  const { t } = useI18n();

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [formData, setFormData] = useState(emptyForm);

  const [showForm, setShowForm] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchWorkers = async () => {
    try {
      setLoading(true);

      const snapshot = await getDocs(collection(db, "workers"));

      const data = snapshot.docs.map((document) => {
        const worker = document.data();

        return {
          id: document.id,
          name: worker.name || "",
          email: worker.email || "",
          phone: worker.phone || "",
          department: worker.department || "",
          role: worker.role || "Field Staff",
          status: worker.status || "available",
          totalReports: worker.totalReports || 0,
          imageUrl: worker.imageUrl || "",
          liveLocation: worker.liveLocation || {
            latitude: null,
            longitude: null,
          },
        };
      });

      setWorkers(data);
    } catch (error) {
      console.error("Error fetching workers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const closeForm = () => {
    setShowForm(false);
    setEditingWorker(null);
    setFormData(emptyForm);
  };

  const openAddForm = () => {
    setEditingWorker(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (worker: Worker) => {
    setEditingWorker(worker);
    setFormData({
      name: worker.name,
      email: worker.email,
      phone: worker.phone,
      department: worker.department,
    });
    setShowForm(true);
  };

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.phone || !formData.department) {
      alert("Please fill all fields");
      return;
    }

    try {
      setSaving(true);

      await addDoc(collection(db, "workers"), {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        department: formData.department,

        role: "Field Staff",
        status: "available",
        totalReports: 0,
        imageUrl: "",

        liveLocation: {
          latitude: null,
          longitude: null,
        },
        locationUpdatedAt: null,

        createdAt: serverTimestamp(),
      });

      closeForm();
      fetchWorkers();
    } catch (error) {
      console.error("Error adding worker:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleEditWorker = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingWorker) return;

    if (!formData.name || !formData.email || !formData.phone || !formData.department) {
      alert("Please fill all fields");
      return;
    }

    try {
      setSaving(true);

      await updateDoc(doc(db, "workers", editingWorker.id), {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        updatedAt: serverTimestamp(),
      });

      closeForm();
      fetchWorkers();
    } catch (error) {
      console.error("Error updating worker:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWorker = async (workerId: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this worker?");

    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "workers", workerId));
      fetchWorkers();
    } catch (error) {
      console.error("Error deleting worker:", error);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1500px] mx-auto">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {t("workers")}
          </p>
          <h1 className="text-2xl font-bold mt-1">{t("workerDirectory")}</h1>
        </div>

        <button
          onClick={openAddForm}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
        >
          <Plus className="size-4" />
          Add Worker
        </button>
      </header>

      {loading ? (
        <p className="text-muted-foreground">Loading workers...</p>
      ) : workers.length === 0 ? (
        <div className="rounded-2xl border bg-card p-8 text-center shadow-(--shadow-soft)">
          <p className="text-lg font-semibold">No workers added yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Register your first field staff worker to create the workers collection.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {workers.map((w) => (
            <div
              key={w.id}
              className="rounded-2xl bg-card border p-5 shadow-(--shadow-soft) hover:shadow-(--shadow-elev) transition"
            >
              <div className="flex items-start gap-4">
                <div className="relative">
                  {w.imageUrl ? (
                    <img
                      src={w.imageUrl}
                      alt={w.name}
                      className="size-14 rounded-full object-cover ring-2 ring-secondary"
                    />
                  ) : (
                    <div className="size-14 rounded-full bg-secondary flex items-center justify-center ring-2 ring-secondary">
                      <UserRound className="size-7 text-primary" />
                    </div>
                  )}

                  <span
                    className={cn(
                      "absolute bottom-0 right-0 size-3.5 rounded-full ring-2 ring-card",
                      w.status === "available" && "bg-green-500",
                      
                      w.status === "assigned" && "bg-blue-500",
                      
                      w.status === "off duty" && "bg-red-500",
                    )}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{w.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {w.role}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset capitalize",
                      statusStyles[w.status] || statusStyles.available,
                    )}
                  >
                    {w.status}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditForm(w)}
                      className="rounded-full p-1.5 hover:bg-secondary"
                      title="Edit Profile"
                    >
                      <Pencil className="size-3.5 text-muted-foreground" />
                    </button>

                    <button
                      onClick={() => handleDeleteWorker(w.id)}
                      className="rounded-full p-1.5 hover:bg-red-100"
                      title="Delete Worker"
                    >
                      <Trash2 className="size-3.5 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-2.5 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="size-4" />
                  <span>{w.phone}</span>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="size-4" />
                  <span className="truncate">{w.email}</span>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Briefcase className="size-4" />
                  <span>{w.department}</span>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <ClipboardList className="size-4" />
                  <span>
                    <span className="font-semibold text-foreground">
                      {w.totalReports}
                    </span>{" "}
                    Total Reports
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  Live Location
                </span>

                <span className="font-mono">
                  {w.liveLocation?.latitude && w.liveLocation?.longitude
                    ? `${w.liveLocation.latitude}, ${w.liveLocation.longitude}`
                    : "Not available"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl border">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold">
                  {editingWorker ? "Edit Worker Profile" : "Register Worker"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {editingWorker
                    ? "Update field staff details"
                    : "Add new field staff worker"}
                </p>
              </div>

              <button
                onClick={closeForm}
                className="rounded-full p-2 hover:bg-secondary"
              >
                <X className="size-4" />
              </button>
            </div>

            <form
              onSubmit={editingWorker ? handleEditWorker : handleAddWorker}
              className="space-y-4"
            >
              <div>
                <label className="text-sm font-medium">Worker Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Enter worker name"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="worker@example.com"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Road Maintenance"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : editingWorker
                    ? "Update Worker"
                    : "Add Worker"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}