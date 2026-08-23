type Props = {
  count: number;
  className?: string;
};

export default function AdminPendingBadge({ count, className = "" }: Props) {
  if (count <= 0) return null;

  const label = count > 99 ? "99+" : String(count);

  return (
    <span
      className={`absolute flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black leading-none shadow-sm ${className}`}
      aria-hidden
    >
      {label}
    </span>
  );
}
