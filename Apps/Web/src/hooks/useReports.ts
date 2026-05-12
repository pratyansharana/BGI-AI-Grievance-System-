import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/firebase";

export interface FirestoreReport {
  id: string;
  category: string;
  citizenName: string;
  createdAt: any;
  description: string;
  imageUrl: string;
  priority: string;
  status: string;
  userId: string;

  location?: {
    latitude: number;
    longitude: number;
};
}

export function useReports() {
  const [reports, setReports] = useState<FirestoreReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "grievances"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: FirestoreReport[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as FirestoreReport[];

      setReports(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { reports, loading };
}