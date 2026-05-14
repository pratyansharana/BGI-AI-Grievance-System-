import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { Trophy, Medal, UserRound, Briefcase, Mail, CheckCircle2 } from "lucide-react";
import { db } from "@/firebase";
import { useAuth } from "@/lib/auth";
import { AppSidebar } from "@/components/AppSidebar";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/workers-leaderboard")({
  component: WorkersLeaderboardRoute,
});

type Worker = {
  id: string;
  name?: string;
  email?: string;
  department?: string;
  designation?: string;
  resolvedCount?: number;
  workerType?: "Freelancer" | "Municipality Staff";
  verificationStatus?: "Pending" | "Approved" | "Rejected";
};

function WorkersLeaderboardRoute() {
  const { isAuthed, ready } = useAuth();

  if (!ready) return <div className="min-h-screen bg-background" />;
  if (!isAuthed) return <Navigate to="/login" />;

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />

      <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden p-6 lg:p-8">
        <WorkersLeaderboardPage />
      </main>
    </div>
  );
}

function WorkersLeaderboardPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        setLoading(true);

        const snapshot = await getDocs(collection(db, "field_staff"));

        const data = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Worker[];

        setWorkers(data);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkers();
  }, []);

  const leaderboard = useMemo(() => {
    return workers
      .filter((worker) => {
        if (worker.workerType === "Freelancer") {
          return worker.verificationStatus === "Approved";
        }

        return true;
      })
      .sort((a, b) => (b.resolvedCount || 0) - (a.resolvedCount || 0));
  }, [workers]);

  const topThree = leaderboard.slice(0, 3);
  const remaining = leaderboard.slice(3);

  if (loading) {
    return <div className="text-muted-foreground">Loading leaderboard...</div>;
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <header>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Field Staff Performance
        </p>
        <h1 className="mt-1 flex items-center gap-2 text-3xl font-bold tracking-tight">
          <Trophy className="h-7 w-7 text-yellow-600" />
          Worker Leaderboard
        </h1>
        <p className="mt-1 text-muted-foreground">
          Ranked by total number of resolved reports.
        </p>
      </header>

      <section className="grid gap-5 md:grid-cols-3">
        {topThree.map((worker, index) => (
          <TopWorkerCard key={worker.id} worker={worker} rank={index + 1} />
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">Full Ranking</h2>
          <p className="text-sm text-muted-foreground">
            Municipality staff and approved freelancers only.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-left">Rank</th>
                <th className="px-5 py-3 text-left">Worker</th>
                <th className="px-5 py-3 text-left">Department</th>
                <th className="px-5 py-3 text-left">Type</th>
                <th className="px-5 py-3 text-left">Resolved</th>
              </tr>
            </thead>

            <tbody>
              {leaderboard.map((worker, index) => (
                <tr
                  key={worker.id}
                  className={cn(
                    "border-t transition hover:bg-secondary/30",
                    index % 2 && "bg-secondary/10"
                  )}
                >
                  <td className="px-5 py-4 font-bold">#{index + 1}</td>

                  <td className="px-5 py-4">
                    <div className="font-semibold">{worker.name || "Field Staff"}</div>
                    <div className="text-xs text-muted-foreground">{worker.email || "No email"}</div>
                  </td>

                  <td className="px-5 py-4">{worker.department || "N/A"}</td>

                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-medium",
                        worker.workerType === "Freelancer"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      )}
                    >
                      {worker.workerType || "Municipality Staff"}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {worker.resolvedCount || 0}
                    </span>
                  </td>
                </tr>
              ))}

              {leaderboard.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    No verified field staff found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function TopWorkerCard({ worker, rank }: { worker: Worker; rank: number }) {
  const medalStyle =
    rank === 1
      ? "bg-yellow-100 text-yellow-700"
      : rank === 2
        ? "bg-slate-100 text-slate-700"
        : "bg-orange-100 text-orange-700";

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm transition hover:shadow-md">
      <div className="mb-4 flex items-start justify-between">
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", medalStyle)}>
          <Medal className="h-6 w-6" />
        </div>

        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold">
          Rank #{rank}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <UserRound className="h-6 w-6 text-muted-foreground" />
        </div>

        <div>
          <h3 className="font-semibold">{worker.name || "Field Staff"}</h3>
          <p className="text-sm text-muted-foreground">{worker.designation || "Field Worker"}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          <span>{worker.email || "No email"}</span>
        </div>

        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4" />
          <span>{worker.department || "No department"}</span>
        </div>
      </div>

      <div className="mt-5 rounded-xl bg-green-50 p-4 text-center">
        <p className="text-3xl font-bold text-green-700">
          {worker.resolvedCount || 0}
        </p>
        <p className="text-xs font-medium text-green-700">Reports Resolved</p>
      </div>
    </div>
  );
}