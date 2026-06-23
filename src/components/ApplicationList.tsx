// "use client";

// import ApplicationCard from "./ApplicationCard";

// interface ApplicationListProps {
//   applications: Array<{
//     id: string;
//     jobListingId: string;
//     applicantId: string;
//     jobTitle: string;
//     firstName: string; 
//     lastName: string;  
//     email: string;
//     phone: string | null;
//     submittedAt: string;
//     status: string;
//     yearsOfExperience?: number;
//     coverLetter?: string;
//     linkedInUrl?: string;
//     availableImmediately?: boolean;
//     noticePeriodWeeks?: number;
//   }>;
// }

// export default function ApplicationList({ applications }: ApplicationListProps) {
//   if (applications.length === 0) {
//     return (
//       <p className="text-sm text-gray-500 mt-4 dark:text-gray-400">
//         No application history found for this profile.
//       </p>
//     );
//   }

//   return (
//     <div className="mt-5 grid gap-4 sm:grid-cols-2">
//       {applications.map((app) => (
//         <ApplicationCard 
//           key={app.id || app.jobListingId} 
//           application={app} 
//         />
//       ))}
//     </div>
//   );
// }

"use client";

import { ApplicationResponse } from "../types/application";
import ApplicationCard from "./ApplicationCard";

interface ApplicationListProps {
  applications: ApplicationResponse[];
}

export default function ApplicationList({ applications }: ApplicationListProps) {
  if (applications.length === 0) {
    return <p className="text-sm text-gray-500 mt-4">No application history found.</p>;
  }

  return (
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      {applications.map((app) => (
        <ApplicationCard key={app.id} application={app} />
      ))}
    </div>
  );
}