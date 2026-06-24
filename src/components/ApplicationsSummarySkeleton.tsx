export default function ApplicationsSummarySkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 w-full max-w-xs shadow-sm">
      {/* Mirrors: text-xs uppercase tracking-wider label */}
      <div className="h-2.5 w-36 rounded bg-gray-200 dark:bg-gray-700 mb-3" />
      {/* Mirrors: text-4xl font-bold number — tall and narrow */}
      <div className="h-10 w-12 rounded bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}