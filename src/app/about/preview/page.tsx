import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AboutPreviewClient from "./AboutPreviewClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About preview | Yaddii Marketplace",
  robots: { index: false, follow: false },
};

function previewEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_ENABLE_ABOUT_PREVIEW === "true"
  );
}

export default function AboutPreviewPage() {
  if (!previewEnabled()) {
    redirect("/about");
  }

  return <AboutPreviewClient />;
}
