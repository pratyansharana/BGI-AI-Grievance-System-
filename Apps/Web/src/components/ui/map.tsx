import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

type MapProps = {
  center: [number, number];
  zoom?: number;
  children?: React.ReactNode;
};

type MarkerProps = {
  longitude: number;
  latitude: number;
  children?: React.ReactNode;
};

export function Map({
  center,
  zoom = 10,
  children,
}: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  
  useEffect(() => {
    console.log("Container:", mapContainer.current);
    if (!mapContainer.current || mapRef.current) return;

    mapRef.current = new maplibregl.Map({
        container: mapContainer.current,
        style: "https://tiles.openfreemap.org/styles/liberty",
        center,
        zoom,
    });
    
    mapRef.current.on("load", () => {
        console.log("Map loaded");
        mapRef.current?.resize();
    });
    
    console.log("Map initialized");

    return () => {
      mapRef.current?.remove();
    };
  }, [center, zoom]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainer} className="h-[500px] w-full" />
      {mapRef.current &&
        React.Children.map(children, (child) =>
          React.isValidElement(child)
            ? React.cloneElement(child as any, { map: mapRef.current })
            : child
        )}
    </div>
  );
}

export function MapMarker({
  longitude,
  latitude,
  children,
  map,
}: MarkerProps & { map?: maplibregl.Map }) {
  const markerRef = useRef<HTMLDivElement>(document.createElement("div"));

  useEffect(() => {
    if (!map) return;

    const marker = new maplibregl.Marker({
      element: markerRef.current,
    })
      .setLngLat([longitude, latitude])
      .addTo(map);

    return () => {
      marker.remove();
    };
  }, [map, longitude, latitude]);

  return ReactDOMPortal(children, markerRef.current);
}

function ReactDOMPortal(
  children: React.ReactNode,
  container: HTMLElement
) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    //@ts-ignore
    ReactDOM.createPortal(children, container)
  );
}

export function MarkerContent({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div>{children}</div>;
}

export function MarkerLabel({
  children,
}: {
  children: React.ReactNode;
  position?: string;
}) {
  return (
    <div className="mt-1 rounded bg-white px-2 py-1 text-xs shadow">
      {children}
    </div>
  );
}

export function MarkerPopup({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg bg-white shadow-lg ${className}`}>
      {children}
    </div>
  );
}