import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "@/firebase";
import { useAuth } from "@/lib/auth";
import { AppSidebar } from "@/components/AppSidebar";
import { WorkersMap } from "@/components/WorkersMap";
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
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ExternalLink,
  Camera,
  IdCard,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/workers")({
  component: WorkersPage,
});

type Department = "Electricity" | "Water Supply" | "Sanitation" | "Roads";

type VerificationStatus = "Pending" | "Approved" | "Rejected";

type Worker = {
  id: string;
  fsid?: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  designation: string;
  duty_status: boolean;
  assignedTask?: string;
  resolvedCount?: number;
  location?: {
    latitude: number;
    longitude: number;
  };
  lastUpdated?: number;
  workerType?: "Freelancer" | "Municipality Staff";
  verificationStatus?: VerificationStatus;
  selfieUrl?: string;
  aadhaarUrl?: string;
};

type FormData = {
  name: string;
  email: string;
  phone: string;
  department: string;
  password: string;
};

const DEPARTMENTS: Department[] = [
  "Electricity",
  "Water Supply",
  "Sanitation",
  "Roads",
];

const emptyForm: FormData = {
  name: "",
  email: "",
  phone: "+91 ",
  department: "",
  password: "",
};

function WorkersPage() {
  const user = useAuth();

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [viewMode, setViewMode] = useState<"table" | "map">("table");

  const [statusFilter, setStatusFilter] = useState<
    "all" | "available" | "assigned" | "off duty"
  >("all");

  if (!user) {
    return <Navigate to="/login" />;
  }

  const fetchWorkers = async () => {
    try {
      setLoading(true);

      const querySnapshot = await getDocs(collection(db, "field_staff"));

      const workersData = querySnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Worker[];

      setWorkers(workersData);
    } catch (error) {
      console.error("Error fetching field staff:", error);
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

  const isApprovedWorker = (worker: Worker) => {
    if (worker.workerType === "Freelancer") {
      return worker.verificationStatus === "Approved";
    }

    return true;
  };

  const approvedWorkers = workers.filter(isApprovedWorker);

  const pendingFreelancers = workers.filter(
    (worker) =>
      worker.workerType === "Freelancer" &&
      worker.verificationStatus === "Pending"
  );

  const rejectedFreelancers = workers.filter(
    (worker) =>
      worker.workerType === "Freelancer" &&
      worker.verificationStatus === "Rejected"
  );

  const getStatusText = (worker: Worker) => {
    if (worker.assignedTask && worker.assignedTask.trim() !== "") {
      return "assigned";
    }

    if (worker.duty_status) {
      return "available";
    }

    return "off duty";
  };

  const getStatusStyle = (worker: Worker) => {
    const status = getStatusText(worker);

    if (status === "available") {
      return "bg-green-100 text-green-700 ring-green-200";
    }

    if (status === "assigned") {
      return "bg-blue-100 text-blue-700 ring-blue-200";
    }

    return "bg-red-100 text-red-700 ring-red-200";
  };

  const getDotColor = (worker: Worker) => {
    const status = getStatusText(worker);

    if (status === "available") return "bg-green-500";
    if (status === "assigned") return "bg-blue-500";
    return "bg-red-500";
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
      phone: worker.phone?.startsWith("+91")
        ? worker.phone
        : `+91 ${worker.phone || ""}`,
      department: worker.department || "",
      password: "",
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
        await updateDoc(doc(db, "field_staff", editingWorker.id), {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          department: formData.department,
          lastUpdated: Date.now(),
          updatedAt: serverTimestamp(),
        });
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );

        const uid = userCredential.user.uid;

        await setDoc(doc(db, "field_staff", uid), {
          fsid: uid,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          department: formData.department,
          designation: "Field Worker",
          duty_status: true,
          assignedTask: "",
          resolvedCount: 0,
          workerType: "Municipality Staff",
          verificationStatus: "Approved",
          lastUpdated: Date.now(),
          createdAt: serverTimestamp(),
        });
      }

      await fetchWorkers();
      handleCloseForm();
    } catch (error) {
      console.error("Error saving field staff:", error);
    }
  };

  const handleApproveFreelancer = async (workerId: string) => {
    try {
      await updateDoc(doc(db, "field_staff", workerId), {
        verificationStatus: "Approved",
        duty_status: true,
        designation: "Field Worker",
        lastUpdated: Date.now(),
        verifiedAt: serverTimestamp(),
      });

      await fetchWorkers();
    } catch (error) {
      console.error("Error approving freelancer:", error);
    }
  };

  const handleRejectFreelancer = async (workerId: string) => {
    const confirmReject = window.confirm(
      "Are you sure you want to reject this freelancer?"
    );

    if (!confirmReject) return;

    try {
      await updateDoc(doc(db, "field_staff", workerId), {
        verificationStatus: "Rejected",
        duty_status: false,
        lastUpdated: Date.now(),
        rejectedAt: serverTimestamp(),
      });

      await fetchWorkers();
    } catch (error) {
      console.error("Error rejecting freelancer:", error);
    }
  };

  const handleDelete = async (workerId: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this field staff member?"
    );

    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "field_staff", workerId));
      await fetchWorkers();
    } catch (error) {
      console.error("Error deleting field staff:", error);
    }
  };

  const availableCount = approvedWorkers.filter(
    (w) =>
      w.duty_status === true && (!w.assignedTask || w.assignedTask.trim() === "")
  ).length;

  const assignedCount = approvedWorkers.filter(
    (w) => w.assignedTask && w.assignedTask.trim() !== ""
  ).length;

  const offDutyCount = approvedWorkers.filter(
    (w) => w.duty_status === false
  ).length;

  const filteredWorkers =
    statusFilter === "all"
      ? approvedWorkers
      : statusFilter === "available"
        ? approvedWorkers.filter(
            (w) =>
              w.duty_status === true &&
              (!w.assignedTask || w.assignedTask.trim() === "")
          )
        : statusFilter === "assigned"
          ? approvedWorkers.filter(
              (w) => w.assignedTask && w.assignedTask.trim() !== ""
            )
          : approvedWorkers.filter((w) => w.duty_status === false);

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />

      <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden p-6 lg:p-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Field Staff</h1>
            <p className="mt-1 text-muted-foreground">
              Manage field staff members, status, verification, and live
              locations.
            </p>
          </div>

          <button
            onClick={handleOpenAddForm}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Add Field Staff
          </button>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
            <p className="text-sm text-muted-foreground">Total Field Staff</p>
            <p className="mt-2 text-3xl font-bold">{approvedWorkers.length}</p>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
            <p className="text-sm text-muted-foreground">Available</p>
            <p className="mt-2 text-3xl font-bold text-green-600">
              {availableCount}
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
            <p className="text-sm text-muted-foreground">Assigned</p>
            <p className="mt-2 text-3xl font-bold text-blue-600">
              {assignedCount}
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
            <p className="text-sm text-muted-foreground">Off Duty</p>
            <p className="mt-2 text-3xl font-bold text-red-600">
              {offDutyCount}
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">Pending Verification</p>
            <p className="mt-2 text-3xl font-bold text-yellow-600">
              {pendingFreelancers.length}
            </p>
          </div>
        </div>

        {pendingFreelancers.length > 0 && (
          <section className="mb-6 rounded-2xl border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 font-semibold">
                  <ShieldCheck className="h-5 w-5 text-yellow-600" />
                  Pending Freelancer Verification
                </h2>
                <p className="text-sm text-muted-foreground">
                  Review selfie and Aadhaar proof before allowing freelancers to
                  receive civic tasks.
                </p>
              </div>

              <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
                {pendingFreelancers.length} pending
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {pendingFreelancers.map((worker) => (
                <div
                  key={worker.id}
                  className="rounded-2xl border bg-background p-4 shadow-sm"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">
                        {worker.name || "Freelancer"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {worker.email}
                      </p>
                    </div>

                    <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-700">
                      Pending
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      <span>{worker.department || "No department"}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{worker.phone || "No phone number"}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {worker.location?.latitude && worker.location?.longitude
                          ? `${worker.location.latitude}, ${worker.location.longitude}`
                          : "Location not available"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {worker.selfieUrl && (
                      <a href={worker.selfieUrl} target="_blank" rel="noreferrer">
                        <div className="overflow-hidden rounded-xl border bg-muted">
                          <img
                          src={worker.selfieUrl}
                          alt="Selfie proof"
                          className="h-32 w-full object-cover"
                          />
                          </div>
                          <p className="mt-1 flex items-center justify-center gap-1 text-xs font-medium">
                            <Camera className="h-3.5 w-3.5" />
                            Selfie
                            <ExternalLink className="h-3 w-3" />
                            </p>
                            </a>
                          )}

      

  {worker.aadhaarUrl && (
    <a
      href={worker.aadhaarUrl}
      target="_blank"
      rel="noreferrer"
    >
      <div className="overflow-hidden rounded-xl border bg-muted">
        <img
          src={worker.aadhaarUrl}
          alt="Aadhaar proof"
          className="h-32 w-full object-cover"
        />
      </div>

      <p className="mt-1 flex items-center justify-center gap-1 text-xs font-medium">
        <IdCard className="h-3.5 w-3.5" />
        Aadhaar
        <ExternalLink className="h-3 w-3" />
      </p>
    </a>
  )}
</div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleApproveFreelancer(worker.id)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Approve
                    </button>

                    <button
                      onClick={() => handleRejectFreelancer(worker.id)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {rejectedFreelancers.length > 0 && (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700">
            {rejectedFreelancers.length} freelancer request
            {rejectedFreelancers.length > 1 ? "s are" : " is"} rejected and
            hidden from active field staff.
          </div>
        )}

        <div className="mb-6 flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="inline-flex w-fit rounded-xl border bg-background p-1 shadow-sm">
            <button
            onClick={() => setViewMode("table")}
            className={cn(
              "rounded-lg px-5 py-2 text-sm font-medium transition",
              viewMode === "table"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted")}
              >
                Table
                </button>
                
                <button
                onClick={() => setViewMode("map")}
                className={cn(
                  "rounded-lg px-5 py-2 text-sm font-medium transition",
                  viewMode === "map"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
                )}
                >
                  Map
                  </button>
                  </div>

  <select
    value={statusFilter}
    onChange={(e) =>
      setStatusFilter(
        e.target.value as "all" | "available" | "assigned" | "off duty"
      )
    }
    className="h-11 rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-primary"
  >
    <option value="all">All Field Staff ({approvedWorkers.length})</option>
    <option value="available">Available ({availableCount})</option>
    <option value="assigned">Assigned ({assignedCount})</option>
    <option value="off duty">Off Duty ({offDutyCount})</option>
  </select>
</div>

        {viewMode === "map" && (
          <div className="mb-8 rounded-2xl border bg-card p-4 shadow-sm">
            <WorkersMap workers={filteredWorkers} />
          </div>
        )}

        {viewMode === "table" && (
          <>
            {loading ? (
              <div className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">
                Loading field staff...
              </div>
            ) : filteredWorkers.length === 0 ? (
              <div className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">
                No verified field staff found for this status.
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredWorkers.map((worker) => {
                  const statusText = getStatusText(worker);

                  return (
                    <div
                      key={worker.id}
                      className="rounded-2xl border bg-card p-5 shadow-sm transition hover:shadow-md"
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                            <UserRound className="h-6 w-6 text-muted-foreground" />
                          </div>

                          <div>
                            <h3 className="font-semibold">
                              {worker.name || "Field Staff"}
                            </h3>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <p className="text-sm text-muted-foreground">
                                {worker.designation || "Field Worker"}
                              </p>

                              <span
                                className={cn(
                                  "rounded-full px-2 py-0.5 text-[11px] font-medium",
                                  worker.workerType === "Freelancer"
                                    ? "bg-purple-100 text-purple-700"
                                    : "bg-blue-100 text-blue-700"
                                )}
                              >
                                {worker.workerType || "Municipality Staff"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1",
                            getStatusStyle(worker)
                          )}
                        >
                          <span
                            className={cn(
                              "h-2 w-2 rounded-full",
                              getDotColor(worker)
                            )}
                          />
                          {statusText}
                        </span>
                      </div>

                      <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span>{worker.email || "No email"}</span>
                        </div>

                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{worker.phone || "No phone number"}</span>
                        </div>

                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Briefcase className="h-4 w-4" />
                          <span>{worker.department || "No department"}</span>
                        </div>

                        <div className="flex items-center gap-2 text-muted-foreground">
                          <ClipboardList className="h-4 w-4" />
                          <span>{worker.resolvedCount || 0} reports resolved</span>
                        </div>

                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>
                            {worker.location?.latitude &&
                            worker.location?.longitude
                              ? `${worker.location.latitude}, ${worker.location.longitude}`
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
                  );
                })}
              </div>
            )}
          </>
        )}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-background p-6 shadow-xl">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">
                    {editingWorker ? "Edit Field Staff" : "Add Field Staff"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {editingWorker
                      ? "Update field staff details."
                      : "Register a new field staff member."}
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
                  <label className="text-sm font-medium">Field Staff Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter field staff name"
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
                      required={!editingWorker}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        department: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-xl border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Select department</option>
                    {DEPARTMENTS.map((department) => (
                      <option key={department} value={department}>
                        {department}
                      </option>
                    ))}
                  </select>
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
                    {editingWorker ? "Update Field Staff" : "Add Field Staff"}
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