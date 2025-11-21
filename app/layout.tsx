import "./globals.css";
import { Inter } from "next/font/google";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "SPK Project Management",
  description: "Sistem Pendukung Keputusan AHP + SAW",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900`}>
        <div className="flex min-h-screen flex-col md:flex-row">
          {/* Komponen Navigasi (Sidebar Desktop + Header Mobile) */}
          <Sidebar />

          {/* AREA KONTEN UTAMA */}
          {/* Penjelasan Class CSS:
              1. flex-1: Mengambil sisa ruang yang ada.
              2. md:ml-64: Memberi margin kiri 256px HANYA di Desktop (untuk tempat Sidebar).
              3. pt-16: Memberi padding atas 64px HANYA di Mobile (agar konten tidak tertutup Header).
              4. md:pt-0: Di Desktop padding atas 0 (karena tidak ada header atas).
          */}
          <main className="flex-1 md:ml-64 transition-all duration-300 pt-16 md:pt-0">
            <div className="">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
