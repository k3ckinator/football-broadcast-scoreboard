import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Football Broadcast Scoreboard",
  description: "Live OBS overlay and control panel for American football broadcasts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
