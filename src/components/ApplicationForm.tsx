"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { submitApplication } from "../lib/applicationsApi";

// Pure primitive validation blocks eliminate version conflicts across Zod variants
const applicationSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string(),
  yearsOfExperience: z.number().min(0, "Years of experience cannot be negative"),
  coverLetter: z.string().min(10, "Cover letter must be at least 10 characters long"),
  linkedInUrl: z.string(),
  availableImmediately: z.boolean(),
  noticePeriodWeeks: z.number().min(0, "Notice period cannot be negative"),
}).refine((data) => {
  if (!data.availableImmediately && data.noticePeriodWeeks <= 0) {
    return false;
  }
  return true;
}, {
  message: "Please specify your notice period if you are not available immediately",
  path: ["noticePeriodWeeks"],
});

// Direct type inference ensures 100% synchronization with useForm
type ApplicationFormValues = z.infer<typeof applicationSchema>;

interface ApplicationFormProps {
  jobId: string;
  jobTitle: string;
  onSuccess: (newApplicantId: string) => void;
}

export default function ApplicationForm({ jobId, jobTitle, onSuccess }: ApplicationFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      yearsOfExperience: 0,
      coverLetter: "",
      linkedInUrl: "",
      availableImmediately: true,
      noticePeriodWeeks: 0,
    },
  });

  const isAvailableImmediately = watch("availableImmediately");

  const mutation = useMutation({
    mutationFn: (values: ApplicationFormValues) => 
      submitApplication({ ...values, jobId }),
    onSuccess: (response) => {
      reset();
      if (response && response.applicantId) {
        onSuccess(response.applicantId);
      }
    },
  });

  const onSubmit = (data: ApplicationFormValues) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Apply for {jobTitle}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Provide your professional background details below.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Full Name *</label>
          <input {...register("fullName")} type="text" className="w-full rounded-lg border border-gray-300 p-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" placeholder="John Doe" />
          {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Email Address *</label>
          <input {...register("email")} type="email" className="w-full rounded-lg border border-gray-300 p-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" placeholder="john@example.com" />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Phone Number</label>
          <input {...register("phone")} type="tel" className="w-full rounded-lg border border-gray-300 p-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" placeholder="+27 82 123 4567" />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Years of Experience *</label>
          <input {...register("yearsOfExperience", { valueAsNumber: true })} type="number" className="w-full rounded-lg border border-gray-300 p-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
          {errors.yearsOfExperience && <p className="text-xs text-red-500 mt-1">{errors.yearsOfExperience.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">LinkedIn Profile URL</label>
        <input {...register("linkedInUrl")} type="text" className="w-full rounded-lg border border-gray-300 p-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" placeholder="https://linkedin.com/in/username" />
      </div>

      <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 grid gap-4 sm:grid-cols-2 items-center">
        <div className="flex items-center gap-2">
          <input {...register("availableImmediately")} type="checkbox" id="availableImmediately" className="h-4 w-4 rounded accent-blue-600" />
          <label htmlFor="availableImmediately" className="text-sm font-medium text-gray-700 dark:text-gray-300">I am available to start immediately</label>
        </div>

        {!isAvailableImmediately && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Notice Period (Weeks) *</label>
            <input {...register("noticePeriodWeeks", { valueAsNumber: true })} type="number" className="w-full rounded-lg border border-gray-300 p-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
            {errors.noticePeriodWeeks && <p className="text-xs text-red-500 mt-1">{errors.noticePeriodWeeks.message}</p>}
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Cover Letter Statement *</label>
        <textarea {...register("coverLetter")} rows={4} className="w-full rounded-lg border border-gray-300 p-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" placeholder="Explain why you are a great fit..." />
        {errors.coverLetter && <p className="text-xs text-red-500 mt-1">{errors.coverLetter.message}</p>}
      </div>

      <div className="flex justify-end">
        <button disabled={mutation.isPending} type="submit" className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:bg-gray-400">
          {mutation.isPending ? "Submitting Application..." : "Submit Application"}
        </button>
      </div>
    </form>
  );
}






// "use client";

// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import * as z from "zod";
// import { useMutation } from "@tanstack/react-query";
// import { submitApplication } from "../lib/applicationsApi";

// // 1. Define clean base object schema using standard z.number() to eliminate compiler bugs
// const baseApplicationSchema = z.object({
//   fullName: z.string().min(2, "Full name must be at least 2 characters"),
//   email: z.string().email("Invalid email address"),
//   phone: z.string().optional().or(z.literal("")),
//   yearsOfExperience: z.number({ invalid_type_error: "Experience must be a valid number" }).min(0, "Years of experience cannot be negative"),
//   coverLetter: z.string().min(10, "Cover letter must be at least 10 characters long"),
//   linkedInUrl: z.string().url("Invalid URL format").optional().or(z.literal("")),
//   availableImmediately: z.boolean().default(true),
//   noticePeriodWeeks: z.number({ invalid_type_error: "Notice period must be a valid number" }).min(0).default(0),
// });

// // 2. Derive explicit types directly from the clean base shape
// type ApplicationFormValues = z.infer<typeof baseApplicationSchema>;

// // 3. Attach conditional logic refinements over the verified base schema
// const applicationSchema = baseApplicationSchema.refine((data) => {
//   if (!data.availableImmediately && (data.noticePeriodWeeks === undefined || data.noticePeriodWeeks <= 0)) {
//     return false;
//   }
//   return true;
// }, {
//   message: "Please specify your notice period if you are not available immediately",
//   path: ["noticePeriodWeeks"],
// });

// interface ApplicationFormProps {
//   jobId: string;
//   jobTitle: string;
//   onSuccess: (newApplicantId: string) => void;
// }

// export default function ApplicationForm({ jobId, jobTitle, onSuccess }: ApplicationFormProps) {
//   const {
//     register,
//     handleSubmit,
//     watch,
//     reset,
//     formState: { errors },
//   } = useForm<ApplicationFormValues>({
//     resolver: zodResolver(applicationSchema),
//     defaultValues: {
//       fullName: "",
//       email: "",
//       phone: "",
//       yearsOfExperience: 0,
//       coverLetter: "",
//       linkedInUrl: "",
//       availableImmediately: true,
//       noticePeriodWeeks: 0,
//     },
//   });

//   const isAvailableImmediately = watch("availableImmediately");

//   const mutation = useMutation({
//     mutationFn: (values: ApplicationFormValues) => 
//       submitApplication({ ...values, jobId }),
//     onSuccess: (response) => {
//       reset();
//       if (response && response.applicantId) {
//         onSuccess(response.applicantId);
//       }
//     },
//   });

//   const onSubmit = (data: ApplicationFormValues) => {
//     mutation.mutate(data);
//   };

//   return (
//     <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
//       <div>
//         <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
//           Apply for {jobTitle}
//         </h3>
//         <p className="text-sm text-gray-500 dark:text-gray-400">
//           Provide your professional background details below.
//         </p>
//       </div>

//       <div className="grid gap-4 sm:grid-cols-2">
//         {/* Full Name */}
//         <div>
//           <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
//             Full Name *
//           </label>
//           <input
//             {...register("fullName")}
//             type="text"
//             className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
//             placeholder="John Doe"
//           />
//           {errors.fullName && (
//             <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>
//           )}
//         </div>

//         {/* Email */}
//         <div>
//           <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
//             Email Address *
//           </label>
//           <input
//             {...register("email")}
//             type="email"
//             className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
//             placeholder="john.doe@example.com"
//           />
//           {errors.email && (
//             <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
//           )}
//         </div>

//         {/* Phone */}
//         <div>
//           <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
//             Phone Number
//           </label>
//           <input
//             {...register("phone")}
//             type="tel"
//             className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
//             placeholder="+27 82 123 4567"
//           />
//         </div>

//         {/* Years of Experience */}
//         <div>
//           <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
//             Years of Experience *
//           </label>
//           <input
//             {...register("yearsOfExperience", { valueAsNumber: true })} // Safely casts strings straight to numbers
//             type="number"
//             className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
//           />
//           {errors.yearsOfExperience && (
//             <p className="text-xs text-red-500 mt-1">{errors.yearsOfExperience.message}</p>
//           )}
//         </div>
//       </div>

//       {/* LinkedIn URL */}
//       <div>
//         <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
//           LinkedIn Profile URL
//         </label>
//         <input
//           {...register("linkedInUrl")}
//           type="text"
//           className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
//           placeholder="https://linkedin.com/in/username"
//         />
//         {errors.linkedInUrl && (
//           <p className="text-xs text-red-500 mt-1">{errors.linkedInUrl.message}</p>
//         )}
//       </div>

//       {/* Availability Metrics */}
//       <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 grid gap-4 sm:grid-cols-2 items-center">
//         <div className="flex items-center gap-2">
//           <input
//             {...register("availableImmediately")}
//             type="checkbox"
//             id="availableImmediately"
//             className="h-4 w-4 rounded border-gray-300 accent-blue-600 dark:bg-gray-800 dark:border-gray-700"
//           />
//           <label htmlFor="availableImmediately" className="text-sm font-medium text-gray-700 dark:text-gray-300">
//             I am available to start immediately
//           </label>
//         </div>

//         {!isAvailableImmediately && (
//           <div>
//             <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
//               Notice Period (Weeks) *
//             </label>
//             <input
//               {...register("noticePeriodWeeks", { valueAsNumber: true })} // Safely casts strings straight to numbers
//               type="number"
//               className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
//             />
//             {errors.noticePeriodWeeks && (
//               <p className="text-xs text-red-500 mt-1">{errors.noticePeriodWeeks.message}</p>
//             )}
//           </div>
//         )}
//       </div>

//       {/* Cover Letter */}
//       <div>
//         <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
//           Cover Letter 
//         </label>
//         <textarea
//           {...register("coverLetter")}
//           rows={4}
//           className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
//           placeholder="Explain why you are a great fit for this position..."
//         />
//         {errors.coverLetter && (
//           <p className="text-xs text-red-500 mt-1">{errors.coverLetter.message}</p>
//         )}
//       </div>

//       {/* Submit Button */}
//       <div className="flex justify-end">
//         <button
//           disabled={mutation.isPending}
//           type="submit"
//           className="inline-flex justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none disabled:bg-gray-400 dark:bg-blue-700 dark:hover:bg-blue-600 tracking-tight"
//         >
//           {mutation.isPending ? "Submitting Application..." : "Submit Application"}
//         </button>
//       </div>

//       {mutation.isError && (
//         <p className="text-xs text-red-500 text-center bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 p-2 rounded-lg">
//           Error: {mutation.error instanceof Error ? mutation.error.message : "Submission failed"}
//         </p>
//       )}
//     </form>
//   );
// }