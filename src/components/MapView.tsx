"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Contact } from "@/components/NetworkMap";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap } from "leaflet";

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

const defaultCenter: [number, number] = [20, 0];
const defaultZoom = 2;

export default function MapView({ contacts }: { contacts: Contact[] }) {
  const [isMounted, setIsMounted] = useState(false);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const markers = useMemo(
    () =>
      contacts.map((contact) => ({
        ...contact,
        position: [contact.lat, contact.lon] as [number, number],
      })),
    [contacts]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as { _getIconUrl?: () => void })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
    });
  }, []);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  if (!isMounted) {
    return <div className="map-wrap" />;
  }

  return (
    <div className="map-wrap">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        scrollWheelZoom
        whenCreated={(map) => {
          mapRef.current = map;
        }}
        className="map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((marker) => (
          <Marker key={marker.id} position={marker.position}>
            <Popup>
              <strong>{marker.name}</strong>
              <div>
                {marker.city}, {marker.country}
              </div>
              {marker.note ? <div>{marker.note}</div> : null}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
