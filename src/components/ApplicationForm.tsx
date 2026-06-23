
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { cn } from "../lib/utils";
import { submitApplication } from "../lib/applicationsApi";

const applicationSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
    email: z.string().email("Please enter a valid email address"),
    phone: z
      .string()
      .regex(/^\+?[\d\s\-()\d]{8,15}$/, "Please enter a valid phone number")
      .or(z.literal(""))
      .transform((val) => (val === "" ? undefined : val))
      .optional(), // Place at the end to make the object key optional
    yearsOfExperience: z
      .number()
      .int("Must be a whole number")
      .min(0, "Cannot be negative")
      .max(50, "Maximum 50 years"),
    coverLetter: z
      .string()
      .min(50, "Cover letter must be at least 50 characters — tell us why you're a strong fit")
      .max(2000, "Cover letter must be under 2000 characters"),
    linkedInUrl: z
      .string()
      .url("Please enter a valid URL")
      .refine((val) => val.includes("linkedin.com"), "URL must be a LinkedIn profile")
      .or(z.literal(""))
      .transform((val) => (val === "" ? undefined : val))
      .optional(), // Place at the end to make the object key optional
    availableImmediately: z.boolean(),
    noticePeriodWeeks: z
      .number()
      .int("Must be a whole number")
      .min(0, "Cannot be negative"),
  })
  .refine(
    (data) => data.availableImmediately || data.noticePeriodWeeks > 0,
    {
      message: "Notice period must be at least 1 week if you are not available immediately",
      path: ["noticePeriodWeeks"],
    }
  );

type ApplicationFormData = z.infer<typeof applicationSchema>;

interface ApplicationFormProps {
  jobId: string;
  jobTitle: string;
}

export default function ApplicationForm({ jobId, jobTitle }: ApplicationFormProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ApplicationFormData>({
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

  const mutation = useMutation({
    mutationFn: submitApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      reset();
    },
  });

  const isBusy = isSubmitting || mutation.isPending;

  const onValid = async (data: ApplicationFormData) => {
    await mutation.mutateAsync({ ...data, jobId });
  };

  if (mutation.isSuccess) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-950">
        <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
          Application Submitted!
        </h3>
        <p className="mt-2 text-green-700 dark:text-green-300">
          You have successfully applied for <strong>{jobTitle}</strong>. We will be
          in touch via email.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate className="space-y-5">
      {/* noValidate prevents the browser's built-in HTML5 validation UI from firing.
          Without it, the browser would show its own error popups before Zod gets a
          chance to run, resulting in duplicate or inconsistent error messages. */}
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
        Apply for {jobTitle}
      </h2>

      {mutation.isError && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
          <p className="text-sm text-red-700 dark:text-red-300">
            {mutation.error.message}
          </p>
        </div>
      )}

      {/* Full Name */}
      <div className="space-y-1">
        <label htmlFor="fullName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Full Name *
        </label>
        <input
          id="fullName"
          {...register("fullName")}
          aria-invalid={!!errors.fullName}
          className={cn(
            "w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100",
            errors.fullName
              ? "border-red-500 dark:border-red-400"
              : "border-gray-300 dark:border-gray-600"
          )}
        />
        {errors.fullName && (
          <p className="text-xs text-red-600 dark:text-red-400">{errors.fullName.message}</p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Email *
        </label>
        <input
          id="email"
          type="email"
          {...register("email")}
          aria-invalid={!!errors.email}
          className={cn(
            "w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100",
            errors.email
              ? "border-red-500 dark:border-red-400"
              : "border-gray-300 dark:border-gray-600"
          )}
        />
        {errors.email && (
          <p className="text-xs text-red-600 dark:text-red-400">{errors.email.message}</p>
        )}
      </div>

      {/* Phone */}
      <div className="space-y-1">
        <label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Phone
        </label>
        <input
          id="phone"
          type="text"
          {...register("phone")}
          aria-invalid={!!errors.phone}
          className={cn(
            "w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100",
            errors.phone
              ? "border-red-500 dark:border-red-400"
              : "border-gray-300 dark:border-gray-600"
          )}
        />
        {errors.phone && (
          <p className="text-xs text-red-600 dark:text-red-400">{errors.phone.message}</p>
        )}
      </div>

      {/* Years of Experience */}
      <div className="space-y-1">
        <label htmlFor="yearsOfExperience" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Years of Experience *
        </label>
        <input
          id="yearsOfExperience"
          type="number"
          {...register("yearsOfExperience", { valueAsNumber: true })}
          aria-invalid={!!errors.yearsOfExperience}
          className={cn(
            "w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100",
            errors.yearsOfExperience
              ? "border-red-500 dark:border-red-400"
              : "border-gray-300 dark:border-gray-600"
          )}
        />
        {errors.yearsOfExperience && (
          <p className="text-xs text-red-600 dark:text-red-400">{errors.yearsOfExperience.message}</p>
        )}
      </div>

      {/* Cover Letter */}
      <div className="space-y-1">
        <label htmlFor="coverLetter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Cover Letter *
        </label>
        <textarea
          id="coverLetter"
          rows={6}
          {...register("coverLetter")}
          aria-invalid={!!errors.coverLetter}
          className={cn(
            "w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100",
            errors.coverLetter
              ? "border-red-500 dark:border-red-400"
              : "border-gray-300 dark:border-gray-600"
          )}
        />
        {errors.coverLetter && (
          <p className="text-xs text-red-600 dark:text-red-400">{errors.coverLetter.message}</p>
        )}
      </div>

      {/* LinkedIn URL */}
      <div className="space-y-1">
        <label htmlFor="linkedInUrl" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          LinkedIn URL
        </label>
        <input
          id="linkedInUrl"
          type="url"
          {...register("linkedInUrl")}
          aria-invalid={!!errors.linkedInUrl}
          className={cn(
            "w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100",
            errors.linkedInUrl
              ? "border-red-500 dark:border-red-400"
              : "border-gray-300 dark:border-gray-600"
          )}
        />
        {errors.linkedInUrl && (
          <p className="text-xs text-red-600 dark:text-red-400">{errors.linkedInUrl.message}</p>
        )}
      </div>

      {/* Available Immediately */}
      <div className="flex items-center gap-2">
        <input
          id="availableImmediately"
          type="checkbox"
          {...register("availableImmediately")}
          className="h-4 w-4 rounded border-gray-300 dark:border-gray-600"
        />
        <label htmlFor="availableImmediately" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Available immediately
        </label>
      </div>

      {/* Notice Period */}
      <div className="space-y-1">
        <label htmlFor="noticePeriodWeeks" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Notice Period (weeks) *
        </label>
        <input
          id="noticePeriodWeeks"
          type="number"
          {...register("noticePeriodWeeks", { valueAsNumber: true })}
          aria-invalid={!!errors.noticePeriodWeeks}
          className={cn(
            "w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100",
            errors.noticePeriodWeeks
              ? "border-red-500 dark:border-red-400"
              : "border-gray-300 dark:border-gray-600"
          )}
        />
        {errors.noticePeriodWeeks && (
          <p className="text-xs text-red-600 dark:text-red-400">{errors.noticePeriodWeeks.message}</p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isBusy}
        className={cn(
          "w-full rounded-md px-4 py-2 text-sm font-semibold text-white transition-colors",
          isBusy
            ? "cursor-not-allowed bg-blue-300 dark:bg-blue-800"
            : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        )}
      >
        {isBusy ? "Submitting…" : "Submit Application"}
      </button>
    </form>
  );
}

// "use client";

// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { useMutation, useQueryClient } from "@tanstack/react-query";
// import { z } from "zod";
// import { cn } from "@/lib/utils";
// import { submitApplication } from "@/lib/applicationsApi";

// const applicationSchema = z
//   .object({
//     fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
//     email: z.string().email("Please enter a valid email address"),
//     phone: z
//       .string()
//       .regex(/^\+?[\d\s\-()\d]{8,15}$/, "Please enter a valid phone number")
//       .or(z.literal(""))
//       .optional()
//       .transform((val) => (val === "" ? undefined : val)),
//     yearsOfExperience: z
//       .number()
//       .int("Must be a whole number")
//       .min(0, "Cannot be negative")
//       .max(50, "Maximum 50 years"),
//     coverLetter: z
//       .string()
//       .min(50, "Cover letter must be at least 50 characters — tell us why you're a strong fit")
//       .max(2000, "Cover letter must be under 2000 characters"),
//     linkedInUrl: z
//       .string()
//       .url("Please enter a valid URL")
//       .refine((val) => val.includes("linkedin.com"), "URL must be a LinkedIn profile")
//       .or(z.literal(""))
//       .optional()
//       .transform((val) => (val === "" ? undefined : val)),
//     availableImmediately: z.boolean(),
//     noticePeriodWeeks: z
//       .number()
//       .int("Must be a whole number")
//       .min(0, "Cannot be negative"),
//   })
//   .refine(
//     (data) => data.availableImmediately || data.noticePeriodWeeks > 0,
//     {
//       message: "Notice period must be at least 1 week if you are not available immediately",
//       path: ["noticePeriodWeeks"],
//     }
//   );

// type ApplicationFormData = z.infer<typeof applicationSchema>;

// interface ApplicationFormProps {
//   jobId: string;
//   jobTitle: string;
// }

// export default function ApplicationForm({ jobId, jobTitle }: ApplicationFormProps) {
//   const queryClient = useQueryClient();

//   const {
//     register,
//     handleSubmit,
//     reset,
//     formState: { errors, isSubmitting },
//   } = useForm<ApplicationFormData>({
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

//   const mutation = useMutation({
//     mutationFn: submitApplication,
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["jobs"] });
//       reset();
//     },
//   });

//   const isBusy = isSubmitting || mutation.isPending;

//   const onValid = async (data: ApplicationFormData) => {
//     await mutation.mutateAsync({ ...data, jobId });
//   };

//   if (mutation.isSuccess) {
//     return (
//       <div className="rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-950">
//         <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
//           Application Submitted!
//         </h3>
//         <p className="mt-2 text-green-700 dark:text-green-300">
//           You have successfully applied for <strong>{jobTitle}</strong>. We will be
//           in touch via email.
//         </p>
//       </div>
//     );
//   }

//   return (
//     <form onSubmit={handleSubmit(onValid)} noValidate className="space-y-5">
//       {/* noValidate prevents the browser's built-in HTML5 validation UI from firing.
//           Without it, the browser would show its own error popups before Zod gets a
//           chance to run, resulting in duplicate or inconsistent error messages. */}
//       <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
//         Apply for {jobTitle}
//       </h2>

//       {mutation.isError && (
//         <div className="rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
//           <p className="text-sm text-red-700 dark:text-red-300">
//             {mutation.error.message}
//           </p>
//         </div>
//       )}

//       {/* Full Name */}
//       <div className="space-y-1">
//         <label htmlFor="fullName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
//           Full Name *
//         </label>
//         <input
//           id="fullName"
//           {...register("fullName")}
//           aria-invalid={!!errors.fullName}
//           className={cn(
//             "w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100",
//             errors.fullName
//               ? "border-red-500 dark:border-red-400"
//               : "border-gray-300 dark:border-gray-600"
//           )}
//         />
//         {errors.fullName && (
//           <p className="text-xs text-red-600 dark:text-red-400">{errors.fullName.message}</p>
//         )}
//       </div>

//       {/* Email */}
//       <div className="space-y-1">
//         <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
//           Email *
//         </label>
//         <input
//           id="email"
//           type="email"
//           {...register("email")}
//           aria-invalid={!!errors.email}
//           className={cn(
//             "w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100",
//             errors.email
//               ? "border-red-500 dark:border-red-400"
//               : "border-gray-300 dark:border-gray-600"
//           )}
//         />
//         {errors.email && (
//           <p className="text-xs text-red-600 dark:text-red-400">{errors.email.message}</p>
//         )}
//       </div>

//       {/* Phone */}
//       <div className="space-y-1">
//         <label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">
//           Phone
//         </label>
//         <input
//           id="phone"
//           type="text"
//           {...register("phone")}
//           aria-invalid={!!errors.phone}
//           className={cn(
//             "w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100",
//             errors.phone
//               ? "border-red-500 dark:border-red-400"
//               : "border-gray-300 dark:border-gray-600"
//           )}
//         />
//         {errors.phone && (
//           <p className="text-xs text-red-600 dark:text-red-400">{errors.phone.message}</p>
//         )}
//       </div>

//       {/* Years of Experience */}
//       <div className="space-y-1">
//         <label htmlFor="yearsOfExperience" className="text-sm font-medium text-gray-700 dark:text-gray-300">
//           Years of Experience *
//         </label>
//         <input
//           id="yearsOfExperience"
//           type="number"
//           {...register("yearsOfExperience", { valueAsNumber: true })}
//           aria-invalid={!!errors.yearsOfExperience}
//           className={cn(
//             "w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100",
//             errors.yearsOfExperience
//               ? "border-red-500 dark:border-red-400"
//               : "border-gray-300 dark:border-gray-600"
//           )}
//         />
//         {errors.yearsOfExperience && (
//           <p className="text-xs text-red-600 dark:text-red-400">{errors.yearsOfExperience.message}</p>
//         )}
//       </div>

//       {/* Cover Letter */}
//       <div className="space-y-1">
//         <label htmlFor="coverLetter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
//           Cover Letter *
//         </label>
//         <textarea
//           id="coverLetter"
//           rows={6}
//           {...register("coverLetter")}
//           aria-invalid={!!errors.coverLetter}
//           className={cn(
//             "w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100",
//             errors.coverLetter
//               ? "border-red-500 dark:border-red-400"
//               : "border-gray-300 dark:border-gray-600"
//           )}
//         />
//         {errors.coverLetter && (
//           <p className="text-xs text-red-600 dark:text-red-400">{errors.coverLetter.message}</p>
//         )}
//       </div>

//       {/* LinkedIn URL */}
//       <div className="space-y-1">
//         <label htmlFor="linkedInUrl" className="text-sm font-medium text-gray-700 dark:text-gray-300">
//           LinkedIn URL
//         </label>
//         <input
//           id="linkedInUrl"
//           type="url"
//           {...register("linkedInUrl")}
//           aria-invalid={!!errors.linkedInUrl}
//           className={cn(
//             "w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100",
//             errors.linkedInUrl
//               ? "border-red-500 dark:border-red-400"
//               : "border-gray-300 dark:border-gray-600"
//           )}
//         />
//         {errors.linkedInUrl && (
//           <p className="text-xs text-red-600 dark:text-red-400">{errors.linkedInUrl.message}</p>
//         )}
//       </div>

//       {/* Available Immediately */}
//       <div className="flex items-center gap-2">
//         <input
//           id="availableImmediately"
//           type="checkbox"
//           {...register("availableImmediately")}
//           className="h-4 w-4 rounded border-gray-300 dark:border-gray-600"
//         />
//         <label htmlFor="availableImmediately" className="text-sm font-medium text-gray-700 dark:text-gray-300">
//           Available immediately
//         </label>
//       </div>

//       {/* Notice Period */}
//       <div className="space-y-1">
//         <label htmlFor="noticePeriodWeeks" className="text-sm font-medium text-gray-700 dark:text-gray-300">
//           Notice Period (weeks) *
//         </label>
//         <input
//           id="noticePeriodWeeks"
//           type="number"
//           {...register("noticePeriodWeeks", { valueAsNumber: true })}
//           aria-invalid={!!errors.noticePeriodWeeks}
//           className={cn(
//             "w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100",
//             errors.noticePeriodWeeks
//               ? "border-red-500 dark:border-red-400"
//               : "border-gray-300 dark:border-gray-600"
//           )}
//         />
//         {errors.noticePeriodWeeks && (
//           <p className="text-xs text-red-600 dark:text-red-400">{errors.noticePeriodWeeks.message}</p>
//         )}
//       </div>

//       {/* Submit */}
//       <button
//         type="submit"
//         disabled={isBusy}
//         className={cn(
//           "w-full rounded-md px-4 py-2 text-sm font-semibold text-white transition-colors",
//           isBusy
//             ? "cursor-not-allowed bg-blue-300 dark:bg-blue-800"
//             : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
//         )}
//       >
//         {isBusy ? "Submitting…" : "Submit Application"}
//       </button>
//     </form>
//   );
// }