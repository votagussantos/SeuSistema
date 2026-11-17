import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Painel",
  robots: { index: false },
};

export default function PainelLayout({ children }: LayoutProps<"/painel">) {
  return (
    <>
      {children}
      <Toaster position="top-center" />
    </>
  );
}
