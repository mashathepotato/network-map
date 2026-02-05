"use client";

import { useEffect, useMemo, useState } from "react";
import MapView from "@/components/MapView";

export type Contact = {
  id: string;
  name: string;
  city: string;
  country: string;
  note: string;
  lat: number;
  lon: number;
  createdAt: string;
};

const STORAGE_KEY = "network-map-contacts-v1";

function loadContacts(): Contact[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Contact[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveContacts(contacts: Contact[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
}

type GeoResult = { lat: number; lon: number; displayName: string };

async function geocode(place: string): Promise<GeoResult | null> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("q", place);
  url.searchParams.set("limit", "1");

  const response = await fetch(url.toString());
  if (!response.ok) return null;
  const data = (await response.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
  }>;
  const first = data[0];
  if (!first) return null;
  return {
    lat: Number(first.lat),
    lon: Number(first.lon),
    displayName: first.display_name,
  };
}

export default function NetworkMap() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setContacts(loadContacts());
  }, []);

  useEffect(() => {
    saveContacts(contacts);
  }, [contacts]);

  const totalCount = useMemo(() => contacts.length, [contacts.length]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !city.trim() || !country.trim()) {
      setStatus("Add a name, city, and country to drop the marker.");
      return;
    }

    setIsLoading(true);
    setStatus("Looking up location...");

    const place = `${city}, ${country}`;
    const result = await geocode(place);

    if (!result) {
      setIsLoading(false);
      setStatus("Could not find that location. Try a larger city or region.");
      return;
    }

    const newContact: Contact = {
      id: crypto.randomUUID(),
      name: name.trim(),
      city: city.trim(),
      country: country.trim(),
      note: note.trim(),
      lat: result.lat,
      lon: result.lon,
      createdAt: new Date().toISOString(),
    };

    setContacts((prev) => [newContact, ...prev]);
    setName("");
    setCity("");
    setCountry("");
    setNote("");
    setIsLoading(false);
    setStatus(`Added ${newContact.name} in ${newContact.city}.`);
  }

  return (
    <div className="layout">
      <section className="panel">
        <div className="panel-header">
          <div>
            <h1>Start mapping your people</h1>
            <p>
              Add contacts from conferences, events, and travels. Each entry
              becomes a marker you can click to remember the context.
            </p>
          </div>
          <div className="stat">
            <div className="stat-label">Contacts mapped</div>
            <div className="stat-value">{totalCount}</div>
          </div>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Jordan Lee"
              required
            />
          </label>
          <label className="field">
            <span>City</span>
            <input
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="Lisbon"
              required
            />
          </label>
          <label className="field">
            <span>Country</span>
            <input
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              placeholder="Portugal"
              required
            />
          </label>
          <label className="field">
            <span>Note</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Met at Web Summit, talked about accessibility tools."
              rows={3}
            />
          </label>
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Adding..." : "Drop marker"}
          </button>
          {status ? <div className="status">{status}</div> : null}
        </form>

        <div className="list">
          <h2>Recent contacts</h2>
          {contacts.length === 0 ? (
            <p className="muted">No contacts yet. Add your first one above.</p>
          ) : (
            <ul>
              {contacts.slice(0, 6).map((contact) => (
                <li key={contact.id}>
                  <div>
                    <strong>{contact.name}</strong>
                    <div className="muted">
                      {contact.city}, {contact.country}
                    </div>
                  </div>
                  <span className="pill">{contact.note || "No note"}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="map-panel">
        <MapView contacts={contacts} />
      </section>
    </div>
  );
}
