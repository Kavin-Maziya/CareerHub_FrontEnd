"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { closeJobListing } from "@/src/app/actions/closeJob";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CloseJobButtonProps {
  jobId: string;
  currentStatus: boolean;
}

export default function CloseJobButton({ jobId, currentStatus }: CloseJobButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!currentStatus) return null;

  const handleCloseJob = () => {
    startTransition(async () => {
      try {
        // Construct the expected FormData programmatically for the Server Action
        const formData = new FormData();
        formData.append("jobId", jobId);

        const response = await closeJobListing(null, formData);

        if (response && response.status === "success") {
          toast.success(`Closed: ${response.jobTitle || "Listing"}`);
          setIsOpen(false);
        } else if (response && response.status === "error") {
          toast.error(response.message || "Failed to close the listing.");
        }
      } catch (error) {
        toast.error("An unexpected error occurred while closing the listing.");
      }
    });
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          className="rounded px-3 py-1 text-xs font-semibold text-red-600 border border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20 transition-colors"
        >
          Close
        </button>
      </AlertDialogTrigger>

      <AlertDialogContent
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Close this listing?</AlertDialogTitle>
          <AlertDialogDescription>
            This listing will be marked as closed and removed from the public jobs board. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            Keep listing
          </AlertDialogCancel>
          <button
            type="button"
            disabled={isPending}
            onClick={handleCloseJob}
            className="inline-flex h-9 items-center justify-center rounded-md bg-red-600 px-4 text-xs font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isPending ? "Closing…" : "Close listing"}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}