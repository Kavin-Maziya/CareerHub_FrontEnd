"use client";

import { useState } from "react";
import JobForm from "./JobForm";

export default function JobCreateSection() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-6">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
      >
        {open ? "Close Form" : "Post Job"}
      </button>

      {open && (
        <div className="mt-4">
          <JobForm
            onSuccess={() => {
              setOpen(false); // ✅ CLOSE FORM AFTER SUCCESS
            }}
          />
        </div>
      )}
    </div>
  );
}