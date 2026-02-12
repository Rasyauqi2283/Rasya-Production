import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Taper",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function TaperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
