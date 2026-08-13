import type { Metadata } from "next";
import { AuthProvider } from "../contexts/auth-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "CloudBoard",
  description: "Team collaboration platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
