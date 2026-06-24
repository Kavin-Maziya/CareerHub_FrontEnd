"use client";

import { useActionState } from "react";
import { closeJobListing } from "@/src/app/actions/closeJob";

interface CloseJobButtonProps {
  jobId: string;
  currentStatus: boolean; // isActive
}

export default function CloseJobButton({ jobId, currentStatus }: CloseJobButtonProps) {
  const [state, formAction, isPending] = useActionState(closeJobListing, null);

  // Already closed — render nothing
  if (!currentStatus) return null;

  // Success — show confirmation
  if (state?.status === "success") {
    return (
      <span className="text-xs font-medium text-green-600 dark:text-green-400">
        ✓ Closed: {state.jobTitle}
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <form action={formAction}>
        <input type="hidden" name="jobId" value={jobId} />
        <button
          type="submit"
          disabled={isPending}
          className="rounded px-3 py-1 text-xs font-semibold text-red-600 border border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? "Closing…" : "Close"}
        </button>
      </form>
      {state?.status === "error" && (
        <span className="text-xs text-red-500 dark:text-red-400">{state.message}</span>
      )}
    </div>
  );
}