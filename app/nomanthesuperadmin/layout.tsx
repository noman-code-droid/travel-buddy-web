import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Travel Buddy | Secure Admin Portal",
  description: "Internal Management Systems",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-portal-root bg-[#050505] min-h-screen w-full overflow-x-hidden">
      {children}
    </div>
  );
}
