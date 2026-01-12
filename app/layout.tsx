import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Abibuch",
  description: "Abibuch management application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
