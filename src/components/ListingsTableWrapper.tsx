"use client";

import { useView, useShowClosedJobs } from "@/src/stores/dashboardStore";
import ListingsTable from "./ListingsTable";
import { EmploymentType } from "../types/JobListing";

interface BackendJob {
  id: string;
  title: string;
  companyName: string;
  location: string;
  isActive: boolean;
  applicationCount: number;
  employmentType: EmploymentType;
}

interface ListingsTableWrapperProps {
  jobs: BackendJob[];
  statsMap: [string, number][];
}

export default function ListingsTableWrapper({
  jobs,
  statsMap,
}: ListingsTableWrapperProps) {
  // One useStore call per value — no destructuring
  const view = useView();
  const showClosedJobs = useShowClosedJobs();

  return (
    <ListingsTable
      jobs={jobs}
      statsMap={new Map(statsMap)}
      view={view}
      showClosedJobs={showClosedJobs}
    />
  );
}