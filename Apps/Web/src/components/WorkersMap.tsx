import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

type FieldStaff = {
  id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  duty_status: boolean;
  assignedTask?: string;
  resolvedCount?: number;
  workerType?: "Freelancer" | "Municipality Staff";
  verificationStatus?: "Pending" | "Approved" | "Rejected";
  location?: {
    latitude?: number;
    longitude?: number;
    lat?: number;
    lng?: number;
  };
};

type WorkersMapProps = {
  workers: FieldStaff[];
};

const getLat = (worker: FieldStaff) =>
  worker.location?.latitude ?? worker.location?.lat;

const getLng = (worker: FieldStaff) =>
  worker.location?.longitude ?? worker.location?.lng;

const getWorkerStatus = (worker: FieldStaff) => {
  if (worker.assignedTask && worker.assignedTask.trim() !== "") {
    return "assigned";
  }

  if (worker.duty_status) {
    return "available";
  }

  return "off duty";
};

const getStatusColor = (worker: FieldStaff) => {
  const status = getWorkerStatus(worker);

  if (status === "available") return "#22c55e";
  if (status === "assigned") return "#3b82f6";
  if (status === "off duty") return "#ef4444";

  return "#6b7280";
};

const getStatusText = (worker: FieldStaff) => {
  const status = getWorkerStatus(worker);

  if (status === "available") return "Available";
  if (status === "assigned") return "Assigned";
  return "Off Duty";
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
      zoom: 10,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => {
      map.resize();
    });

    mapRef.current = map;
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    const fieldStaffWithLocation = workers.filter((worker) => {
      const lat = getLat(worker);
      const lng = getLng(worker);

      return typeof lat === "number" && typeof lng === "number";
    });

    fieldStaffWithLocation.forEach((worker) => {
      const lat = getLat(worker)!;
      const lng = getLng(worker)!;
      const color = getStatusColor(worker);
      const statusText = getStatusText(worker);
      const workerType = worker.workerType || "Municipality Staff";

      const markerElement = document.createElement("div");
      markerElement.style.width = "28px";
      markerElement.style.height = "28px";
      markerElement.style.display = "flex";
      markerElement.style.alignItems = "center";
      markerElement.style.justifyContent = "center";
      markerElement.style.cursor = "pointer";

      const markerDot = document.createElement("div");
      markerDot.style.width = "20px";
      markerDot.style.height = "20px";
      markerDot.style.borderRadius = "9999px";
      markerDot.style.background = color;
      markerDot.style.border = "3px solid white";
      markerDot.style.boxShadow = "0 6px 16px rgba(0,0,0,0.25)";
      markerDot.style.transition = "scale 0.2s ease";

      markerElement.appendChild(markerDot);

      markerElement.onmouseenter = () => {
        markerDot.style.scale = "1.2";
      };

      markerElement.onmouseleave = () => {
        markerDot.style.scale = "1";
      };

      const popup = new maplibregl.Popup({
        offset: 18,
        closeButton: true,
        closeOnClick: true,
      }).setHTML(`
        <div style="width: 250px; padding: 12px;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
            <div style="
              width: 42px;
              height: 42px;
              border-radius: 9999px;
              background: ${workerType === "Freelancer" ? "#f3e8ff" : "#dbeafe"};
              display: flex;
              align-items: center;
              justify-content: center;
              color: ${workerType === "Freelancer" ? "#7e22ce" : "#2563eb"};
              font-weight: 700;
              font-size: 18px;
            ">
              ${worker.name?.charAt(0)?.toUpperCase() || "F"}
            </div>

            <div>
              <p style="font-size: 11px; text-transform: uppercase; color: #64748b; margin: 0;">
                ${worker.department || "Department"}
              </p>
              <h3 style="font-size: 15px; font-weight: 700; margin: 2px 0 0;">
                ${worker.name || "Field Staff"}
              </h3>
            </div>
          </div>

          <div style="
            display: inline-flex;
            padding: 4px 8px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 700;
            margin-bottom: 10px;
            color: ${workerType === "Freelancer" ? "#7e22ce" : "#1d4ed8"};
            background: ${workerType === "Freelancer" ? "#f3e8ff" : "#dbeafe"};
          ">
            ${workerType}
          </div>

          <div style="font-size: 13px; color: #475569; line-height: 1.6;">
            <p style="margin: 0;"><strong>Designation:</strong> ${
              worker.designation || "Field Worker"
            }</p>

            <p style="margin: 0;"><strong>Status:</strong> 
              <span style="color:${color}; font-weight:700;">
                ${statusText}
              </span>
            </p>

            <p style="margin: 0;"><strong>Email:</strong> ${
              worker.email || "Not available"
            }</p>

            <p style="margin: 0;"><strong>Assigned Task:</strong> ${
              worker.assignedTask || "No task assigned"
            }</p>

            <p style="margin: 0;"><strong>Resolved Count:</strong> ${
              worker.resolvedCount ?? 0
            }</p>

            <p style="margin: 0;"><strong>Location:</strong> ${lat}, ${lng}</p>
          </div>
        </div>
      `);

      const marker = new maplibregl.Marker({
        element: markerElement,
        anchor: "center",
      })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });
  }, [workers]);

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="border-b px-5 py-4">
        <h3 className="font-semibold">Field Staff Live Map</h3>
        <p className="text-sm text-muted-foreground">
          Verified municipality staff and approved freelancers based on live
          Firebase coordinates
        </p>
      </div>

      <div ref={mapContainer} className="h-[500px] w-full" />
    </div>
  );
}