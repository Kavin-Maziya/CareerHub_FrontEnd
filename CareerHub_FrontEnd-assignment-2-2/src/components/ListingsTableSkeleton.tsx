export default function ListingsTableSkeleton() {
  const columns = [
    { width: "w-40" },               // Title — long, bold
    { width: "w-28" },               // Company — medium
    { width: "w-24" },               // Location — medium
    { width: "pills" },              // Status — two rounded-full badges
    { width: "w-6" },                // Applications — short number
    { width: "w-6" },                // View — short link text
    { width: "w-14", right: true },  // Action — button
  ];

  return (
    <div className="animate-pulse overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800/50">
          <tr>
            {["Title", "Company", "Location", "Status", "Applications", "View", "Action"].map((h, i) => (
              <th
                key={h}
                className={`px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-left ${i === 6 ? "text-right" : ""}`}
              >
                <div className="h-2.5 w-16 rounded bg-gray-200 dark:bg-gray-700" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
          {Array.from({ length: 5 }).map((_, rowIdx) => (
            <tr key={rowIdx}>
              {columns.map((col, colIdx) => (
                <td key={colIdx} className={`whitespace-nowrap px-6 py-4 ${col.right ? "text-right" : ""}`}>
                  {col.width === "pills" ? (
                    <div className="flex gap-1.5 items-center">
                      <div className="h-5 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
                      <div className="h-5 w-12 rounded-full bg-gray-100 dark:bg-gray-800" />
                    </div>
                  ) : (
                    <div className={`h-4 ${col.width} rounded bg-gray-100 dark:bg-gray-800`} />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}