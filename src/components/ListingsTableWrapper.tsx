"use client";

import {
  useView,
  useShowClosedJobs,
} from "@/src/stores/dashboardStore";

interface ListingsTableWrapperProps {
  children: (props: {
    view: "table" | "grid";
    showClosedJobs: boolean;
  }) => React.ReactNode;
}

export default function ListingsTableWrapper({ children }: ListingsTableWrapperProps) {
  const view = useView();
  const showClosedJobs = useShowClosedJobs();
  return <>{children({ view, showClosedJobs })}</>;
}