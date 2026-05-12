import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { UserRound } from "lucide-react";

type Worker = {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  status: string;
  totalReports: number;
  liveLocation?: {
    latitude: number | null;
    longitude: number | null;
  };
};

type WorkersMapProps = {
  workers: Worker[];
};

const getStatusColor = (status: string) => {
  if (status === "available") return "#22c55e";
  if (status === "assigned") return "#3b82f6";
  if (status === "off duty") return "#ef4444";
  return "#6b7280";
};

export function WorkersMap({ workers }: WorkersMapProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

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
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    const workersWithLocation = workers.filter(
      (worker) =>
        worker.liveLocation?.latitude &&
        worker.liveLocation?.longitude
    );

    workersWithLocation.forEach((worker) => {
      const color = getStatusColor(worker.status);

      const markerElement = document.createElement("div");
      markerElement.innerHTML = `
        <div style="
          width: 20px;
          height: 20px;
          border-radius: 9999px;
          background: ${color};
          border: 3px solid white;
          box-shadow: 0 6px 16px rgba(0,0,0,0.25);
          cursor: pointer;
          transition: transform 0.2s ease;
        "></div>
      `;

      markerElement.onmouseenter = () => {
        markerElement.style.transform = "scale(1.15)";
      };

      markerElement.onmouseleave = () => {
        markerElement.style.transform = "scale(1)";
      };

      const popup = new maplibregl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: true,
      }).setHTML(`
        <div style="width: 230px; padding: 12px;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
            <div style="
              width: 42px;
              height: 42px;
              border-radius: 9999px;
              background: #dbeafe;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #2563eb;
              font-weight: 700;
              font-size: 18px;
            ">
              ${worker.name?.charAt(0)?.toUpperCase() || "W"}
            </div>

            <div>
              <p style="font-size: 11px; text-transform: uppercase; color: #64748b; margin: 0;">
                ${worker.department}
              </p>
              <h3 style="font-size: 15px; font-weight: 700; margin: 2px 0 0;">
                ${worker.name}
              </h3>
            </div>
          </div>

          <div style="font-size: 13px; color: #475569; line-height: 1.6;">
            <p style="margin: 0;"><strong>Role:</strong> ${worker.role}</p>
            <p style="margin: 0;"><strong>Status:</strong> 
              <span style="color:${color}; font-weight:700; text-transform:capitalize;">
                ${worker.status}
              </span>
            </p>
            <p style="margin: 0;"><strong>Phone:</strong> ${worker.phone}</p>
            <p style="margin: 0;"><strong>Total Reports:</strong> ${worker.totalReports}</p>
          </div>
        </div>
      `);

      const marker = new maplibregl.Marker({
        element: markerElement,
      })
        .setLngLat([
          worker.liveLocation!.longitude!,
          worker.liveLocation!.latitude!,
        ])
        .setPopup(popup)
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });
  }, [workers]);

  return (
    <div className="rounded-2xl border bg-card shadow-(--shadow-soft) overflow-hidden">
      <div className="px-5 py-4 border-b">
        <h3 className="font-semibold">Workers Live Map</h3>
        <p className="text-sm text-muted-foreground">
          Field staff locations based on live coordinates
        </p>
      </div>

      <div ref={mapContainer} className="h-[500px] w-full" />
    </div>
  );
}