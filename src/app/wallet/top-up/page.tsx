import Link from "next/link";
import { Wallet } from "lucide-react";

export default function WalletTopUpPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <Wallet size={40} className="text-[#FF6321] mx-auto mb-4" />
      <h1 className="text-2xl font-black text-gray-900 mb-2">Wallet top-up</h1>
      <p className="text-gray-600 mb-6">Coming soon. Contact support if you need balance credited manually.</p>
      <Link href="/profile" className="text-[#FF6321] font-bold hover:underline">
        ← Back to profile
      </Link>
    </div>
  );
}
