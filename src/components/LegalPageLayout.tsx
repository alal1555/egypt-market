import Link from "next/link";

export default function LegalPageLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">{title}</h1>
      <div className="space-y-4 text-sm md:text-base text-gray-600 leading-relaxed">{children}</div>
      <Link
        href="/"
        className="inline-block mt-8 text-[#FF6321] font-bold text-sm hover:underline"
      >
        ← Back to home
      </Link>
    </div>
  );
}
