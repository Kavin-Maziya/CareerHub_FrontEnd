"use client"

import { useState, useEffect } from "react";
import { JobListing } from "../types";
import JobList from "../components/JobList";

const STORAGE_KEY = "careerhub:selectedRoomId";

const JOBS: JobListing[] = [
  {
    id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    title: "Senior Frontend Software Engineer",
    company: "Takealot",
    location: "Cape Town",
    employmentType: "FullTime",
    salaryMin: 30000,
    salaryMax: 45000,
    postedAt: new Date().toISOString(),
    isActive: true,
    applicantCount: 10,
  },
  {
    id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    title: "Junior Systems Developer",
    company: "Vodacom",
    location: "Johannesburg, Sandton",
    employmentType: "FullTime",
    salaryMin: 15000,
    salaryMax: 30000,
    postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    applicantCount: 70,
  },
  {
    id: "c3d4e5f6-a7b8-9012-cdef-123456789012",
    title: "UX/Web Designer",
    company: "Discovery",
    location: "Sandton",
    employmentType: "Contract",
    salaryMin: 10000,
    salaryMax: 18000,
    postedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    applicantCount: 0,
  },
  {
    id: "d4e5f6a7-b8c9-0123-defa-234567890123",
    title: "Data Analyst Intern",
    company: "Standard Bank",
    location: "Pretoria/Hybrid",
    employmentType: "Internship",
    salaryMin: 15000,
    salaryMax: 22000,
    postedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: false,
    applicantCount: 13,
  },
  {
    id: "e5f6a7b8-c9d0-1234-efab-345678901234",
    title: "Senior DevOps Engineer",
    company: "FNB FirstRand",
    location: "Bloemfontein",
    employmentType: "FullTime",
    salaryMin: 70000,
    salaryMax: 110000,
    postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    applicantCount: 5,
  },
  {
    id: "f6a7b8c9-d0e1-2345-fabc-456789012345",
    title: "Part-Time Content Writer/Promoter",
    company: "Media24",
    location: "Remote",
    employmentType: "PartTime",
    salaryMin: 12000,
    salaryMax: 18000,
    postedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    applicantCount: 0,
  },
];

export default function Home() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function handleSelect(id: string) {
    setSelectedId((prev) => (prev === id ? null : id));
  }

  const selectedJob = JOBS.find((j) => j.id === selectedId) ?? null;

  // Effect 1: Restore from sessionStorage on mount.
  // The dependency array is empty [] because this logic should only execute once
  // when the component is first mounted to the DOM, ensuring we don't overwrite 
  // subsequent user interactions with stale storage data.
  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored !== null && JOBS.some((job) => job.id === stored)) {
      setSelectedId(stored);
    }
  }, []);

  // Effect 2: Persist to sessionStorage whenever selectedId changes.
  // The dependency array contains [selectedId] because we need to synchronize 
  // the browser's storage every time the application's selection state is updated.
  useEffect(() => {
    if (selectedId !== null) {
      sessionStorage.setItem(STORAGE_KEY, selectedId);
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [selectedId]);

  
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 dark:bg-gray-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mt-2">Browse and Apply for Jobs Using this interactive portal</h2>
        {selectedJob && (
          <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 px-6 py-4 dark:border-blue-900 dark:bg-blue-900/20">
            <p className="text-xs font-medium uppercase tracking-wide text-blue-500 dark:text-blue-400">
              Selected
            </p>
            <p className="mt-0.5 text-lg font-semibold text-blue-900 dark:text-blue-100">
              {selectedJob.title}
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">{selectedJob.company}</p>
          </div>
        )}

        <div className="mt-8">
          <JobList
            jobs={JOBS}
            selectedId={selectedId}
            onSelect={handleSelect}
          />
        </div>
      </div>
    </main>
  );
}