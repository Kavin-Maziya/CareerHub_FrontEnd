// "use client";

// interface ApplicationCardProps {
//   application: {
//     id: string;
//     jobTitle: string;
//     companyName?: string;
//     firstName: string; // Reflected from backend split-name structure
//     lastName: string;  // Reflected from backend split-name structure
//     submittedAt: string;
//     status: string;
//     yearsOfExperience?: number;
//     coverLetter?: string;
//     linkedInUrl?: string;
//     availableImmediately?: boolean;
//     noticePeriodWeeks?: number;
//   };
// }

// export default function ApplicationCard({ application }: ApplicationCardProps) {
//   const getStatusStyles = (status: string) => {
//     switch (status) {
//       case "Submitted":
//         return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50";
//       case "UnderReview":
//         return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50";
//       case "Shortlisted":
//         return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/50";
//       case "Offered":
//         return "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-900/50";
//       case "Rejected":
//         return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50";
//       default:
//         return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950/40 dark:text-gray-300 dark:border-gray-900/50";
//     }
//   };

//   return (
//     <div className="flex flex-col justify-between p-6 bg-white border border-gray-200 rounded-xl shadow-sm transition-all hover:shadow-md dark:bg-gray-900 dark:border-gray-800">
//       <div>
//         <div className="flex items-start justify-between gap-4">
//           <div>
//             <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-base tracking-tight">
//               {application.jobTitle || "Position Applied"}
//             </h4>
            
//             {/* Stitched name values safely dynamically formatted */}
//             <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
//               Applicant: <span className="font-medium text-gray-700 dark:text-gray-300">{application.firstName} {application.lastName}</span>
//             </p>

//             <p className="text-xs text-gray-400 mt-0.5">
//               Submitted {new Date(application.submittedAt).toLocaleDateString(undefined, {
//                 year: 'numeric',
//                 month: 'short',
//                 day: 'numeric'
//               })}
//             </p>
//           </div>
//           <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold shadow-sm shrink-0 ${getStatusStyles(application.status)}`}>
//             {application.status}
//           </span>
//         </div>

//         {/* METRICS ROW */}
//         {(application.yearsOfExperience !== undefined || application.noticePeriodWeeks !== undefined) && (
//           <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-gray-50 p-2.5 text-xs dark:bg-gray-950">
//             <div>
//               <span className="text-gray-400 block">Experience Provided:</span>
//               <span className="font-medium text-gray-700 dark:text-gray-300">
//                 {application.yearsOfExperience} {application.yearsOfExperience === 1 ? 'Year' : 'Years'}
//               </span>
//             </div>
//             <div>
//               <span className="text-gray-400 block">Availability Status:</span>
//               <span className="font-medium text-gray-700 dark:text-gray-300">
//                 {application.availableImmediately 
//                   ? "Available Now" 
//                   : `${application.noticePeriodWeeks} Wk Notice`}
//               </span>
//             </div>
//           </div>
//         )}

//         {/* COVER LETTER PREVIEW */}
//         {application.coverLetter && (
//           <div className="mt-3">
//             <span className="text-xs text-gray-400 block">Cover Letter Statement:</span>
//             <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 italic mt-0.5">
//               "{application.coverLetter}"
//             </p>
//           </div>
//         )}
//       </div>
      
//       {/* PROFESSIONAL FOOTER LINKS */}
//       {application.linkedInUrl && (
//         <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end">
//           <a 
//             href={application.linkedInUrl} 
//             target="_blank" 
//             rel="noopener noreferrer"
//             className="text-xs text-blue-600 hover:underline dark:text-blue-400 inline-flex items-center gap-1"
//           >
//             Shared LinkedIn Profile ↗
//           </a>
//         </div>
//       )}
//     </div>
//   );
// }

"use client";

import { ApplicationResponse } from "../types/application";

interface ApplicationCardProps {
  application: ApplicationResponse;
}

export default function ApplicationCard({ application }: ApplicationCardProps) {
  return (
    <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm dark:bg-gray-900 dark:border-gray-800">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-base">{application.jobTitle}</h4>
          <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
            Applicant: <span className="font-medium text-gray-700 dark:text-gray-300">{application.firstName} {application.lastName}</span>
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Submitted {new Date(application.submittedAt).toLocaleDateString()}</p>
        </div>
        <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          {application.status}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-gray-50 p-2.5 text-xs dark:bg-gray-950">
        <div>
          <span className="text-gray-400 block">Experience:</span>
          <span className="font-medium text-gray-700 dark:text-gray-300">{application.yearsOfExperience} Years</span>
        </div>
        <div>
          <span className="text-gray-400 block">Availability:</span>
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {application.availableImmediately ? "Immediate" : `${application.noticePeriodWeeks} Wk Notice`}
          </span>
        </div>
      </div>
    </div>
  );
}