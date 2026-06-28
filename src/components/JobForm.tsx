"use client";

import { useRouter } from "next/navigation";
import { useForm, SubmitHandler, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createJob } from "../lib/jobsApi";

const jobSchema = z
  .object({
    title: z.string().min(5, "Title must be at least 5 characters").max(120),
    companyName: z
      .string()
      .min(2, "Company name must be at least 2 characters")
      .max(150),
    industry: z.string().max(100).optional(),
    location: z.string().min(1, "Location is required"),
    description: z
      .string()
      .min(20, "Description must be at least 20 characters"),
    employmentType: z.enum(["FullTime", "PartTime", "Contract", "Internship"]),
    closingDate: z.string().refine(
      (val) => !val || new Date(val) > new Date(),
      "Closing date must be in the future",
    ),
    // Preprocess inputs to map empty text entries ("") onto undefined before evaluating values
    salaryMin: z.preprocess(
      (val) => (val === "" ? undefined : val),
      z.coerce.number().min(0).optional(),
    ),
    salaryMax: z.preprocess(
      (val) => (val === "" ? undefined : val),
      z.coerce.number().min(0).optional(),
    ),
  })
  .refine(
    (data) =>
      !data.salaryMin || !data.salaryMax || data.salaryMax > data.salaryMin,
    { message: "Max salary must be greater than min salary", path: ["salaryMax"] },
  );

type JobFormData = z.infer<typeof jobSchema>;

export default function JobForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<JobFormData>({
    // z.preprocess on salaryMin/salaryMax widens their inferred output type to unknown,
    // causing a resolver assignability mismatch. Casting to Resolver<JobFormData> re-anchors
    // the generic without resorting to `any`.
    resolver: zodResolver(jobSchema) as Resolver<JobFormData>,
    defaultValues: {
      title: "",
      companyName: "",
      industry: "",
      location: "",
      description: "",
      employmentType: "FullTime",
      closingDate: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: JobFormData) =>
      createJob({
        title: values.title,
        companyName: values.companyName,
        industry: values.industry || "",
        location: values.location,
        description: values.description,
        employmentType: values.employmentType,
        closingDate: new Date(values.closingDate).toISOString(),
        // Use undefined (not null) to match the CreateJobRequest type which declares these
        // fields as `number | undefined`. null is not assignable to that union.
        salaryMin: values.salaryMin ?? undefined,
        salaryMax: values.salaryMax ?? undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      router.push("/jobs");
    },
  });

  const onValid: SubmitHandler<JobFormData> = async (data) => {
    await mutation.mutateAsync(data);
  };

  const isBusy = isSubmitting || mutation.isPending;

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Post a New Job
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Fill in the details below. Fields marked * are required.
        </p>
      </div>

      {mutation.isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/20">
          <p className="text-sm text-red-700 dark:text-red-400">
            {mutation.error instanceof Error
              ? mutation.error.message
              : "Failed to create job."}
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="title"
            className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
          >
            Job Title *
          </label>
          <input
            {...register("title")}
            id="title"
            type="text"
            aria-invalid={!!errors.title}
            className={`w-full rounded-lg border p-2 text-sm dark:bg-gray-800 dark:text-gray-100 ${
              errors.title
                ? "border-red-400 dark:border-red-600"
                : "border-gray-300 dark:border-gray-700"
            }`}
            placeholder="Senior Software Engineer"
          />
          {errors.title && (
            <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="companyName"
            className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
          >
            Company Name *
          </label>
          <input
            {...register("companyName")}
            id="companyName"
            type="text"
            aria-invalid={!!errors.companyName}
            className={`w-full rounded-lg border p-2 text-sm dark:bg-gray-800 dark:text-gray-100 ${
              errors.companyName
                ? "border-red-400 dark:border-red-600"
                : "border-gray-300 dark:border-gray-700"
            }`}
            placeholder="Takealot"
          />
          {errors.companyName && (
            <p className="mt-1 text-xs text-red-500">
              {errors.companyName.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="industry"
            className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
          >
            Industry
          </label>
          <input
            {...register("industry")}
            id="industry"
            type="text"
            className="w-full rounded-lg border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            placeholder="Technology"
          />
        </div>

        <div>
          <label
            htmlFor="location"
            className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
          >
            Location *
          </label>
          <input
            {...register("location")}
            id="location"
            type="text"
            aria-invalid={!!errors.location}
            className={`w-full rounded-lg border p-2 text-sm dark:bg-gray-800 dark:text-gray-100 ${
              errors.location
                ? "border-red-400 dark:border-red-600"
                : "border-gray-300 dark:border-gray-700"
            }`}
            placeholder="Cape Town"
          />
          {errors.location && (
            <p className="mt-1 text-xs text-red-500">
              {errors.location.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="employmentType"
            className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
          >
            Employment Type *
          </label>
          <select
            {...register("employmentType")}
            id="employmentType"
            className="w-full rounded-lg border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="FullTime">Full Time</option>
            <option value="PartTime">Part Time</option>
            <option value="Contract">Contract</option>
            <option value="Internship">Internship</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="closingDate"
            className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
          >
            Closing Date *
          </label>
          <input
            {...register("closingDate")}
            id="closingDate"
            type="date"
            aria-invalid={!!errors.closingDate}
            className={`w-full rounded-lg border p-2 text-sm dark:bg-gray-800 dark:text-gray-100 ${
              errors.closingDate
                ? "border-red-400 dark:border-red-600"
                : "border-gray-300 dark:border-gray-700"
            }`}
          />
          {errors.closingDate && (
            <p className="mt-1 text-xs text-red-500">
              {errors.closingDate.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="salaryMin"
            className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
          >
            Min Salary (R)
          </label>
          <input
            {...register("salaryMin")}
            id="salaryMin"
            type="number"
            aria-invalid={!!errors.salaryMin}
            className={`w-full rounded-lg border p-2 text-sm dark:bg-gray-800 dark:text-gray-100 ${
              errors.salaryMin
                ? "border-red-400 dark:border-red-600"
                : "border-gray-300 dark:border-gray-700"
            }`}
            placeholder="15000"
          />
          {errors.salaryMin && (
            <p className="mt-1 text-xs text-red-500">
              {errors.salaryMin.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="salaryMax"
            className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
          >
            Max Salary (R)
          </label>
          <input
            {...register("salaryMax")}
            id="salaryMax"
            type="number"
            aria-invalid={!!errors.salaryMax}
            className={`w-full rounded-lg border p-2 text-sm dark:bg-gray-800 dark:text-gray-100 ${
              errors.salaryMax
                ? "border-red-400 dark:border-red-600"
                : "border-gray-300 dark:border-gray-700"
            }`}
            placeholder="45000"
          />
          {errors.salaryMax && (
            <p className="mt-1 text-xs text-red-500">
              {errors.salaryMax.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="description"
          className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
        >
          Description *
        </label>
        <textarea
          {...register("description")}
          id="description"
          rows={4}
          aria-invalid={!!errors.description}
          className={`w-full rounded-lg border p-2 text-sm dark:bg-gray-800 dark:text-gray-100 ${
            errors.description
              ? "border-red-400 dark:border-red-600"
              : "border-gray-300 dark:border-gray-700"
          }`}
          placeholder="Describe the role and requirements..."
        />
        {errors.description && (
          <p className="mt-1 text-xs text-red-500">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="flex items-center justify-end gap-3">
        <a
          href="/jobs"
          className="rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        >
          Cancel
        </a>
        <button
          type="submit"
          disabled={isBusy}
          className={`rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors ${
            isBusy
              ? "cursor-not-allowed bg-gray-400 dark:bg-gray-600"
              : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
          }`}
        >
          {isBusy ? "Posting…" : "Post Job"}
        </button>
      </div>
    </form>
  );
}