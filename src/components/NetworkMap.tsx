"use client";

import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import MapView from "@/components/MapView";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";

export type Contact = {
  id: string;
  user_id: string;
  name: string;
  city: string;
  country: string;
  note: string | null;
  lat: number;
  lon: number;
  created_at: string;
};

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
  const [session, setSession] = useState<Session | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMode, setAuthMode] = useState<"signIn" | "signUp">("signIn");
  const [authStatus, setAuthStatus] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const totalCount = useMemo(() => contacts.length, [contacts.length]);

  async function fetchContacts(activeSession: Session) {
    if (!supabase) return;
    setIsFetching(true);
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .order("created_at", { ascending: false });

    setIsFetching(false);

    if (error) {
      setStatus(`Could not load contacts: ${error.message}`);
      return;
    }

    setContacts(data ?? []);
    if (activeSession) {
      setStatus(null);
    }
  }

  useEffect(() => {
    if (!supabase) return;
    let isActive = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isActive) return;
      setSession(data.session);
      if (data.session) {
        fetchContacts(data.session);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        if (nextSession) {
          fetchContacts(nextSession);
        } else {
          setContacts([]);
        }
      }
    );

    return () => {
      isActive = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  async function handleAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;

    if (!authEmail.trim() || !authPassword) {
      setAuthStatus("Enter an email and password to continue.");
      return;
    }

    setIsAuthLoading(true);
    setAuthStatus(null);

    if (authMode === "signIn") {
      const { error } = await supabase.auth.signInWithPassword({
        email: authEmail.trim(),
        password: authPassword,
      });

      if (error) {
        setAuthStatus(error.message);
      } else {
        setAuthStatus("Signed in.");
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: authEmail.trim(),
        password: authPassword,
      });

      if (error) {
        setAuthStatus(error.message);
      } else if (!data.session) {
        setAuthStatus("Check your email to confirm your account.");
      } else {
        setAuthStatus("Account created and signed in.");
      }
    }

    setIsAuthLoading(false);
  }

  async function handleSignOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setAuthStatus("Signed out.");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) {
      setStatus("Sign in before adding contacts.");
      return;
    }

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

    if (!supabase) {
      setIsLoading(false);
      setStatus("Supabase is not configured yet.");
      return;
    }

    const { data, error } = await supabase
      .from("contacts")
      .insert({
        user_id: session.user.id,
        name: name.trim(),
        city: city.trim(),
        country: country.trim(),
        note: note.trim() || null,
        lat: result.lat,
        lon: result.lon,
      })
      .select("*")
      .single();

    if (error) {
      setIsLoading(false);
      setStatus(`Could not add contact: ${error.message}`);
      return;
    }

    if (data) {
      setContacts((prev) => [data as Contact, ...prev]);
    }

    setName("");
    setCity("");
    setCountry("");
    setNote("");
    setIsLoading(false);
    setStatus(`Added ${name.trim()} in ${city.trim()}.`);
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

        {!isSupabaseConfigured ? (
          <div className="callout callout-warning">
            Add your Supabase URL + key in <code>.env.local</code> to enable
            sign-in and persistence.
          </div>
        ) : null}

        <div className="auth-panel">
          {session ? (
            <div className="auth-row">
              <div>
                <div className="muted">Signed in as</div>
                <div className="auth-email">{session.user.email}</div>
              </div>
              <button type="button" onClick={handleSignOut}>
                Sign out
              </button>
            </div>
          ) : (
            <form className="form" onSubmit={handleAuth}>
              <div className="auth-toggle">
                <button
                  type="button"
                  className={authMode === "signIn" ? "active" : ""}
                  onClick={() => setAuthMode("signIn")}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  className={authMode === "signUp" ? "active" : ""}
                  onClick={() => setAuthMode("signUp")}
                >
                  Sign up
                </button>
              </div>
              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  value={authEmail}
                  onChange={(event) => setAuthEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </label>
              <label className="field">
                <span>Password</span>
                <input
                  type="password"
                  value={authPassword}
                  onChange={(event) => setAuthPassword(event.target.value)}
                  placeholder="Create a password"
                  required
                />
              </label>
              <button type="submit" disabled={isAuthLoading}>
                {isAuthLoading
                  ? "Working..."
                  : authMode === "signIn"
                    ? "Sign in"
                    : "Create account"}
              </button>
              {authStatus ? <div className="status">{authStatus}</div> : null}
            </form>
          )}
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
          <button type="submit" disabled={isLoading || !session}>
            {isLoading ? "Adding..." : session ? "Drop marker" : "Sign in to add"}
          </button>
          {status ? <div className="status">{status}</div> : null}
        </form>

        <div className="list">
          <h2>Recent contacts</h2>
          {isFetching ? (
            <p className="muted">Loading contacts...</p>
          ) : contacts.length === 0 ? (
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
