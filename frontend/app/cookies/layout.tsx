import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kebijakan Cookie",
  description:
    "Kebijakan penggunaan cookie di situs Rasya Production — preferensi bahasa, keamanan, dan pengalaman pengguna.",
  robots: { index: true, follow: true },
};

export default function CookiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
