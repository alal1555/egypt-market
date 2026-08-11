import type { Metadata } from "next";
import AboutClient from "./AboutClient";

export const metadata: Metadata = {
  title: "About | Yaddii Marketplace",
  description: "About Yaddii — Egypt's classifieds marketplace.",
};

export default function AboutPage() {
  return <AboutClient />;
}
