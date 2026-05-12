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
import { WorkersMap } from "@/components/WorkersMap";
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
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/workers")({
  component: WorkersPage,
});

type Worker = {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  password?: string;
  role: string;
  status: "available" | "assigned" | "off duty";
  totalReports: number;
  imageUrl?: string;
  liveLocation?: {
    latitude: number | null;
    longitude: number | null;
  };
};

type FormData = {
  name: string;
  email: string;
  phone: string;
  department: string;
  password: string;
};

const emptyForm: FormData = {
  name: "",
  email: "",
  phone: "+91 ",
  department: "",
  password: "",
};

const statusStyles: Record<string, string> = {
  available: "bg-green-100 text-green-700 ring-green-200",
  assigned: "bg-blue-100 text-blue-700 ring-blue-200",
  "off duty": "bg-red-100 text-red-700 ring-red-200",
};

function WorkersPage() {
  const user = useAuth();

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);

  const [statusFilter, setStatusFilter] = useState<
    "all" | "available" | "assigned" | "off duty"
  >("all");

  if (!user) {
    return <Navigate to="/login" />;
  }

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "workers"));

      const workersData = querySnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Worker[];

      setWorkers(workersData);
    } catch (error) {
      console.error("Error fetching workers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const handlePhoneChange = (value: string) => {
    let digits = value.replace(/\D/g, "");

    if (digits.startsWith("91")) {
      digits = digits.slice(2);
    }

    digits = digits.slice(0, 10);

    setFormData({
      ...formData,
      phone: `+91 ${digits}`,
    });
  };

  const handleOpenAddForm = () => {
    setEditingWorker(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  const handleEdit = (worker: Worker) => {
    setEditingWorker(worker);
    setFormData({
      name: worker.name || "",
      email: worker.email || "",
      phone: worker.phone?.startsWith("+91") ? worker.phone : `+91 ${worker.phone || ""}`,
      department: worker.department || "",
      password: worker.password || "",
    });
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingWorker(null);
    setFormData(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingWorker) {
        await updateDoc(doc(db, "workers", editingWorker.id), {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          department: formData.department,
          password: formData.password,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "workers"), {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          department: formData.department,
          password: formData.password,

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
      }

      await fetchWorkers();
      handleCloseForm();
    } catch (error) {
      console.error("Error saving worker:", error);
    }
  };

  const handleDelete = async (workerId: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this worker?"
    );

    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "workers", workerId));
      await fetchWorkers();
    } catch (error) {
      console.error("Error deleting worker:", error);
    }
  };

  const availableCount = workers.filter((w) => w.status === "available").length;
  const assignedCount = workers.filter((w) => w.status === "assigned").length;
  const offDutyCount = workers.filter((w) => w.status === "off duty").length;

  const filteredWorkers =
    statusFilter === "all"
      ? workers
      : workers.filter((w) => w.status === statusFilter);

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />

      <main className="flex-1 p-6 lg:p-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Workers</h1>
            <p className="mt-1 text-muted-foreground">
              Manage field staff, status, and live worker locations.
            </p>
          </div>

          <button
            onClick={handleOpenAddForm}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Add Worker
          </button>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">Total Workers</p>
            <p className="mt-2 text-3xl font-bold">{workers.length}</p>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">Available</p>
            <p className="mt-2 text-3xl font-bold text-green-600">
              {availableCount}
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">Assigned</p>
            <p className="mt-2 text-3xl font-bold text-blue-600">
              {assignedCount}
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">Off Duty</p>
            <p className="mt-2 text-3xl font-bold text-red-600">
              {offDutyCount}
            </p>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-4 rounded-2xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">Worker Status Filter</h2>
            <p className="text-sm text-muted-foreground">
              Filter worker cards and map markers by status.
            </p>
          </div>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value as "all" | "available" | "assigned" | "off duty"
              )
            }
            className="rounded-xl border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Workers ({workers.length})</option>
            <option value="available">Available ({availableCount})</option>
            <option value="assigned">Assigned ({assignedCount})</option>
            <option value="off duty">Off Duty ({offDutyCount})</option>
          </select>
        </div>

        <div className="mb-8">
          <WorkersMap workers={filteredWorkers} />
        </div>

        {loading ? (
          <div className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">
            Loading workers...
          </div>
        ) : filteredWorkers.length === 0 ? (
          <div className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">
            No workers found for this status.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredWorkers.map((worker) => (
              <div
                key={worker.id}
                className="rounded-2xl border bg-card p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      {worker.imageUrl ? (
                        <img
                          src={worker.imageUrl}
                          alt={worker.name}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <UserRound className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>

                    <div>
                      <h3 className="font-semibold">{worker.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {worker.role || "Field Staff"}
                      </p>
                    </div>
                  </div>

                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1",
                      statusStyles[worker.status] ||
                        "bg-gray-100 text-gray-700 ring-gray-200"
                    )}
                  >
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        worker.status === "available" && "bg-green-500",
                        worker.status === "assigned" && "bg-blue-500",
                        worker.status === "off duty" && "bg-red-500"
                      )}
                    />
                    {worker.status}
                  </span>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{worker.email}</span>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{worker.phone}</span>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Briefcase className="h-4 w-4" />
                    <span>{worker.department}</span>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ClipboardList className="h-4 w-4" />
                    <span>{worker.totalReports || 0} reports handled</span>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {worker.liveLocation?.latitude &&
                      worker.liveLocation?.longitude
                        ? `${worker.liveLocation.latitude}, ${worker.liveLocation.longitude}`
                        : "Location not available"}
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex gap-2">
                  <button
                    onClick={() => handleEdit(worker)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium hover:bg-muted"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(worker.id)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-background p-6 shadow-xl">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">
                    {editingWorker ? "Edit Worker" : "Add Worker"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {editingWorker
                      ? "Update worker details."
                      : "Register a new field staff worker."}
                  </p>
                </div>

                <button
                  onClick={handleCloseForm}
                  className="rounded-full p-2 hover:bg-muted"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Worker Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter worker name"
                    className="mt-1 w-full rounded-xl border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                    required
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
                    placeholder="Enter email"
                    className="mt-1 w-full rounded-xl border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="+91 9876543210"
                    className="mt-1 w-full rounded-xl border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Number will be saved with +91 country code.
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium">Password</label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          password: e.target.value,
                        })
                      }
                      placeholder="Create password"
                      className="w-full rounded-xl border bg-background py-2 pl-10 pr-3 outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        department: e.target.value,
                      })
                    }
                    placeholder="Enter department"
                    className="mt-1 w-full rounded-xl border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    className="flex-1 rounded-xl border px-4 py-2 text-sm font-medium hover:bg-muted"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                  >
                    {editingWorker ? "Update Worker" : "Add Worker"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}