"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { closeJobListing } from "@/src/app/actions/closeJob";

interface CloseJobButtonProps {
  jobId: string;
  currentStatus: boolean;
}

export default function CloseJobButton({ jobId, currentStatus }: CloseJobButtonProps) {
  const [state, formAction, isPending] = useActionState(closeJobListing, null);
  const lastHandledState = useRef<typeof state>(null);

  useEffect(() => {
    if (state && state !== lastHandledState.current) {
      lastHandledState.current = state;
      
//wired toast notifications
      if (state.status === "success") {
        toast.success(`Closed: ${state.jobTitle}`);
      } else if (state.status === "error") {
        toast.error(state.message);
      }
    }
  }, [state]);

  if (!currentStatus) return null;

  return (
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
  );
}