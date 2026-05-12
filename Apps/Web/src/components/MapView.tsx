import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase";

type Report = {
  id: string;
  citizenName: string;
  category: string;
  description: string;
  priority: string;
  status: string;
  latitude: number;
  longitude: number;
};

export function MapView() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const grievancesSnapshot = await getDocs(
          collection(db, "grievances")
        );

        const grievances = grievancesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as any[];

        const usersSnapshot = await getDocs(collection(db, "users"));

        const users = usersSnapshot.docs.map((doc) => doc.data()) as any[];

        const mergedReports = grievances
          .map((report) => {
            const user = users.find((u) => u.uid === report.userId);

            return {
              id: report.id,
              citizenName: report.citizenName,
              category: report.category,
              description: report.description,
              priority: report.priority,
              status: report.status,
              latitude: user?.location?.latitude,
              longitude: user?.location?.longitude,
            };
          })
          .filter((report) => report.latitude && report.longitude);

        setReports(mergedReports);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, []);
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    const map = new maplibregl.Map({
    container: mapContainer.current,
    style: "https://tiles.openfreemap.org/styles/liberty",
    center: [77.4126, 23.2599],
    zoom: 11,
  });

  map.addControl(new maplibregl.NavigationControl());

  map.on("load", () => {
    map.resize();
  });

  mapRef.current = map;

  // no cleanup for now
}, []);

  useEffect(() => {
    if (!mapRef.current) return;
    
    document
    .querySelectorAll(".maplibregl-marker")
    .forEach((marker) => marker.remove());

    reports.forEach((report) => {
      const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
        <div style="padding:8px">
          <h3 style="font-weight:bold;">${report.citizenName}</h3>
          <p>${report.description}</p>
          <p><strong>Category:</strong> ${report.category}</p>
          <p><strong>Priority:</strong> ${report.priority}</p>
          <p><strong>Status:</strong> ${report.status}</p>
        </div>
      `);

      new maplibregl.Marker({ color: "red" })
        .setLngLat([report.longitude, report.latitude])
        .setPopup(popup)
        .addTo(mapRef.current!);
    });
  }, [reports]);

  return (
    <div className="rounded-2xl overflow-hidden border shadow-md">
      <div ref={mapContainer} className="h-[500px] w-full" />
    </div>
  );
}