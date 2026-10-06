import type { Metadata } from "next";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
  title: "Contact us | Yaddii",
  description: "Contact Yaddii support at support@yaddii.com — help with listings, accounts, and feedback.",
};

export default function ContactPage() {
  return <ContactClient />;
}
