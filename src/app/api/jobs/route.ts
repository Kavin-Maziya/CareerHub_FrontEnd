import { NextResponse } from "next/server";
//import { JobListing } from "@/types/JobListing";
import { JobListing } from "../../../types/JobListing";

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

export async function GET() {
  return NextResponse.json(JOBS);
}