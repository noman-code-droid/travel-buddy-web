import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Travel Buddy - Ride Sharing & AI Assistant",
  description: "Your safe and smart travel companion in Pakistan",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-black selection:bg-primary selection:text-black">
        {children}
      </body>
    </html>
  );
}
