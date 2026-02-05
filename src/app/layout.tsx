import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Network Map",
  description: "Track and remember people you meet around the world.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="page">
          <header className="header">
            <div className="brand">
              <div className="logo">NM</div>
              <div>
                <div className="title">Network Map</div>
                <div className="subtitle">Your global connections, visualized.</div>
              </div>
            </div>
          </header>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
