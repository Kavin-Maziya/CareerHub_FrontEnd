"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitApplication } from "../lib/applicationsApi";

const applicationSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
    email: z.string().email("Invalid email address"),
    phone: z
      .string()
      .regex(/^\+?[\d\s\-()\d]{8,15}$/, "Invalid phone number")
      .or(z.literal(""))
      .optional(),
    // z.number() used with valueAsNumber: true in register — Solution A from assignment
    yearsOfExperience: z
      .number()
      .int("Must be a whole number")
      .min(0, "Cannot be negative")
      .max(50, "Maximum 50 years"),
    coverLetter: z
      .string()
      .min(50, "Cover letter must be at least 50 characters — tell us why you're a strong fit")
      .max(2000),
    linkedInUrl: z
      .string()
      .refine(
        (val) => val === "" || (z.string().url().safeParse(val).success && val.includes("linkedin.com")),
        "Must be a valid LinkedIn URL"
      )
      .optional(),
    availableImmediately: z.boolean(),
    noticePeriodWeeks: z
      .number()
      .int("Must be a whole number")
      .min(0, "Cannot be negative"),
  })
  .refine((data) => data.availableImmediately || data.noticePeriodWeeks > 0, {
    message: "Please specify your notice period if you are not available immediately",
    path: ["noticePeriodWeeks"],
  });

type ApplicationFormData = z.infer<typeof applicationSchema>;

interface ApplicationFormProps {
  jobId: string;
  jobTitle: string;
  onSuccess: (newApplicantId: string) => void;
}

export default function ApplicationForm({ jobId, jobTitle, onSuccess }: ApplicationFormProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const isAvailableImmediately = watch("availableImmediately");

  const mutation = useMutation({
    mutationFn: (values: ApplicationFormData) =>
      submitApplication({
        jobId,
        fullName: values.fullName,
        email: values.email,
        phone: values.phone || undefined,
        yearsOfExperience: values.yearsOfExperience,
        coverLetter: values.coverLetter,
        linkedInUrl: values.linkedInUrl || undefined,
        availableImmediately: values.availableImmediately,
        noticePeriodWeeks: values.noticePeriodWeeks,
      }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      reset();
      if (response?.applicantId) {
        onSuccess(response.applicantId);
      }
    },
  });

  const onValid = async (data: ApplicationFormData) => {
    await mutation.mutateAsync(data);
  };

  const isBusy = isSubmitting || mutation.isPending;

  if (mutation.isSuccess) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center dark:border-green-900/50 dark:bg-green-950/20">
        <div className="text-2xl mb-2">✅</div>
        <h3 className="text-lg font-semibold text-green-900 dark:text-green-200">Application Submitted!</h3>
        <p className="mt-2 text-sm text-green-700 dark:text-green-400">
          Your application for <span className="font-semibold">{jobTitle}</span> has been received.
        </p>
      </div>
    );
  }

  return (
    // noValidate disables browser-native HTML5 validation so Zod and RHF
    // have full control over when and how errors appear
    <form onSubmit={handleSubmit(onValid as Parameters<typeof handleSubmit>[0])} noValidate className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Apply for {jobTitle}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Provide your professional background details below.</p>
      </div>

      {mutation.isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/20">
          <p className="text-sm text-red-700 dark:text-red-400">
            {mutation.error instanceof Error ? mutation.error.message : "Submission failed. Please try again."}
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="fullName" className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Full Name *</label>
          <input
            {...register("fullName")}
            id="fullName"
            type="text"
            aria-invalid={!!errors.fullName}
            className={`w-full rounded-lg border p-2 text-sm dark:bg-gray-800 dark:text-gray-100 ${errors.fullName ? "border-red-400 dark:border-red-600" : "border-gray-300 dark:border-gray-700"}`}
            placeholder="John Doe"
          />
          {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Email Address *</label>
          <input
            {...register("email")}
            id="email"
            type="email"
            aria-invalid={!!errors.email}
            className={`w-full rounded-lg border p-2 text-sm dark:bg-gray-800 dark:text-gray-100 ${errors.email ? "border-red-400 dark:border-red-600" : "border-gray-300 dark:border-gray-700"}`}
            placeholder="john@example.com"
          />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Phone Number</label>
          <input
            {...register("phone")}
            id="phone"
            type="tel"
            aria-invalid={!!errors.phone}
            className={`w-full rounded-lg border p-2 text-sm dark:bg-gray-800 dark:text-gray-100 ${errors.phone ? "border-red-400 dark:border-red-600" : "border-gray-300 dark:border-gray-700"}`}
            placeholder="+27 82 123 4567"
          />
          {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
        </div>

        <div>
          <label htmlFor="yearsOfExperience" className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Years of Experience *</label>
           {/* valueAsNumber: true — Solution A: converts HTML string to number at RHF layer before Zod receives it */}
          <input
            {...register("yearsOfExperience", { valueAsNumber: true })}
            id="yearsOfExperience"
            type="number"
            aria-invalid={!!errors.yearsOfExperience}
            className={`w-full rounded-lg border p-2 text-sm dark:bg-gray-800 dark:text-gray-100 ${errors.yearsOfExperience ? "border-red-400 dark:border-red-600" : "border-gray-300 dark:border-gray-700"}`}
          />
          {errors.yearsOfExperience && <p className="text-xs text-red-500 mt-1">{errors.yearsOfExperience.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="linkedInUrl" className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">LinkedIn Profile URL</label>
        <input
          {...register("linkedInUrl")}
          id="linkedInUrl"
          type="text"
          aria-invalid={!!errors.linkedInUrl}
          className={`w-full rounded-lg border p-2 text-sm dark:bg-gray-800 dark:text-gray-100 ${errors.linkedInUrl ? "border-red-400 dark:border-red-600" : "border-gray-300 dark:border-gray-700"}`}
          placeholder="https://linkedin.com/in/username"
        />
        {errors.linkedInUrl && <p className="text-xs text-red-500 mt-1">{errors.linkedInUrl.message}</p>}
      </div>

      <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 grid gap-4 sm:grid-cols-2 items-center">
        <div className="flex items-center gap-2">
          <input
            {...register("availableImmediately")}
            type="checkbox"
            id="availableImmediately"
            className="h-4 w-4 rounded accent-blue-600"
          />
          <label htmlFor="availableImmediately" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            I am available to start immediately
          </label>
        </div>

        {!isAvailableImmediately && (
          <div>
            <label htmlFor="noticePeriodWeeks" className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Notice Period (Weeks) *</label>
            <input
              {...register("noticePeriodWeeks", { valueAsNumber: true })}
              id="noticePeriodWeeks"
              type="number"
              aria-invalid={!!errors.noticePeriodWeeks}
              className={`w-full rounded-lg border p-2 text-sm dark:bg-gray-800 dark:text-gray-100 ${errors.noticePeriodWeeks ? "border-red-400 dark:border-red-600" : "border-gray-300 dark:border-gray-700"}`}
            />
            {errors.noticePeriodWeeks && <p className="text-xs text-red-500 mt-1">{errors.noticePeriodWeeks.message}</p>}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="coverLetter" className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Cover Letter *</label>
        <textarea
          {...register("coverLetter")}
          id="coverLetter"
          rows={4}
          aria-invalid={!!errors.coverLetter}
          className={`w-full rounded-lg border p-2 text-sm dark:bg-gray-800 dark:text-gray-100 ${errors.coverLetter ? "border-red-400 dark:border-red-600" : "border-gray-300 dark:border-gray-700"}`}
          placeholder="Explain why you are a great fit..."
        />
        {errors.coverLetter && <p className="text-xs text-red-500 mt-1">{errors.coverLetter.message}</p>}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isBusy}
          className={`rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors ${
            isBusy
              ? "bg-gray-400 cursor-not-allowed dark:bg-gray-600"
              : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
          }`}
        >
          {isBusy ? "Submitting…" : "Submit Application"}
        </button>
      </div>
    </form>
  );
}