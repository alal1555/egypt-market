type Props = {
  count: number;
  className?: string;
  /** Tailwind background for the dot (default: admin pending red). */
  toneClass?: string;
};

export default function AdminPendingBadge({
  count,
  className = "",
  toneClass = "bg-red-500",
}: Props) {
  if (count <= 0) return null;

  const label = count > 99 ? "99+" : String(count);

  return (
    <span
      className={`absolute flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-black leading-none shadow-sm ${toneClass} ${className}`}
      aria-hidden
    >
      {label}
    </span>
  );
}
