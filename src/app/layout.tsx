import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Worst 3 Game Challenge - Designer's Nightmare Edition",
  description: "A retro pixel nightmare arcade with intentionally bad design choices",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
