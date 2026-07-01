"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { submitApplication } from "@/src/lib/applicationsApi";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const applicationWizardSchema = z
  .object({
    fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
    email: z.string().trim().email("Enter a valid email address"),
    phone: z.string().trim().optional(),
    coverLetter: z.string().max(2000, "Cover letter must be 2000 characters or fewer").optional(),
    linkedInUrl: z.string().trim().optional(),
    howDidYouHear: z.string().min(1, "Please select an option"),
  })
  .refine(
    (data) =>
      !data.linkedInUrl ||
      data.linkedInUrl.startsWith("https://linkedin.com/") ||
      data.linkedInUrl.startsWith("https://www.linkedin.com/"),
    {
      message: "Must start with https://linkedin.com/ or https://www.linkedin.com/",
      path: ["linkedInUrl"],
    },
  );

type WizardFormData = z.infer<typeof applicationWizardSchema>;
type Step = 1 | 2 | 3;

const defaultValues: WizardFormData = {
  fullName: "",
  email: "",
  phone: "",
  coverLetter: "",
  linkedInUrl: "",
  howDidYouHear: "",
};

const stepFields: Record<Step, (keyof WizardFormData)[]> = {
  1: ["fullName", "email", "phone"],
  2: ["coverLetter", "linkedInUrl", "howDidYouHear"],
  3: [],
};

const hearOptions = ["LinkedIn", "Indeed", "Company website", "Referral", "Other"];

function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function displayValue(value?: string) {
  return value && value.trim() !== "" ? value : "Not provided";
}

interface ApplicationWizardProps {
  jobId: string;
  jobTitle: string;
  isCandidate: boolean;
  onSuccess?: (newApplicantId: string) => void;
}

export default function ApplicationWizard({
  jobId,
  jobTitle,
  isCandidate,
  onSuccess,
}: ApplicationWizardProps) {
  const queryClient = useQueryClient();
  const storageKey = `careerhub-application-${jobId}`;
  const skipNextSaveRef = useRef(false);

  const [step, setStep] = useState<Step>(1);
  const [authError, setAuthError] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [isDiscardOpen, setIsDiscardOpen] = useState(false);

  const form = useForm<WizardFormData>({
    resolver: zodResolver(applicationWizardSchema),
    defaultValues,
  });

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    reset,
    formState: { errors },
  } = form;

  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(storageKey);

      if (savedDraft) {
        const parsed = applicationWizardSchema.partial().parse(JSON.parse(savedDraft));
        reset({ ...defaultValues, ...parsed });
        setHasDraft(true);
        setShowDraftBanner(true);
      }
    } catch {
      localStorage.removeItem(storageKey);
      setHasDraft(false);
    }
  }, [reset, storageKey]);

  useEffect(() => {
    const subscription = watch((values) => {
      if (skipNextSaveRef.current) {
        skipNextSaveRef.current = false;
        localStorage.removeItem(storageKey);
        return;
      }

      localStorage.setItem(storageKey, JSON.stringify(values));
      setHasDraft(true);
    });

    return () => subscription.unsubscribe();
  }, [storageKey, watch]);

  const clearDraft = () => {
    localStorage.removeItem(storageKey);
    setHasDraft(false);
    setShowDraftBanner(false);
  };

  const saveDraft = (values: WizardFormData) => {
    localStorage.setItem(storageKey, JSON.stringify(values));
    setHasDraft(true);
  };

  const mutation = useMutation({
    mutationFn: (values: WizardFormData) =>
      submitApplication({
        jobId,
        fullName: values.fullName,
        email: values.email,
        phone: values.phone || undefined,
        coverLetter: values.coverLetter || "",
        linkedInUrl: values.linkedInUrl || undefined,
        yearsOfExperience: 0,
        availableImmediately: true,
        noticePeriodWeeks: 0,
      }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      skipNextSaveRef.current = true;
      reset(defaultValues);
      clearDraft();
      setStep(1);
      setAuthError(false);
      toast.success("Application submitted successfully.");
      onSuccess?.(response.applicantId || response.id);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Submission failed.");
    },
  });

  const handleNext = async () => {
    if (step === 1 && !isCandidate) {
      setAuthError(true);
      return;
    }

    setAuthError(false);
    const valid = await trigger(stepFields[step]);
    if (valid && step < 3) {
      saveDraft(form.getValues());
      setStep((currentStep) => (currentStep + 1) as Step);
    }
  };

  const handleBack = () => {
    setAuthError(false);
    saveDraft(form.getValues());
    setStep((currentStep) => (currentStep - 1) as Step);
  };

  const handleDiscardDraft = () => {
    skipNextSaveRef.current = true;
    reset(defaultValues);
    clearDraft();
    setStep(1);
    setAuthError(false);
    setIsDiscardOpen(false);
  };

  const currentValues = watch();

  return (
    <div className="space-y-6">
      {showDraftBanner && (
        <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900/50 dark:bg-blue-950/20">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
            You have a saved draft for this application. Restored automatically.
          </p>
          <button
            type="button"
            onClick={() => setShowDraftBanner(false)}
            className="text-sm font-semibold text-blue-700 underline hover:text-blue-900 dark:text-blue-300"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4 border-b border-gray-100 pb-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Apply for {jobTitle}
          </h3>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase text-gray-400">
            <span className={cn(step === 1 && "text-blue-600 dark:text-blue-400")}>1. Your Details</span>
            <span>/</span>
            <span className={cn(step === 2 && "text-blue-600 dark:text-blue-400")}>2. Your Application</span>
            <span>/</span>
            <span className={cn(step === 3 && "text-blue-600 dark:text-blue-400")}>3. Review</span>
          </div>
        </div>

        {hasDraft && (
          <AlertDialog open={isDiscardOpen} onOpenChange={setIsDiscardOpen}>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                className="self-start rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300"
              >
                Discard draft
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent onEscapeKeyDown={(event) => event.preventDefault()}>
              <AlertDialogHeader>
                <AlertDialogTitle>Discard your draft?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your saved application progress will be permanently deleted. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep draft</AlertDialogCancel>
                <button
                  type="button"
                  onClick={handleDiscardDraft}
                  className="inline-flex h-9 items-center justify-center rounded-md bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  Discard draft
                </button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} noValidate className="space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="fullName" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Full name
                </label>
                <input
                  {...register("fullName")}
                  id="fullName"
                  className={cn(
                    "w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-900",
                    errors.fullName ? "border-red-400" : "border-gray-300 dark:border-gray-700",
                  )}
                />
                {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>}
              </div>

              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email address
                </label>
                <input
                  {...register("email")}
                  id="email"
                  type="email"
                  className={cn(
                    "w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-900",
                    errors.email ? "border-red-400" : "border-gray-300 dark:border-gray-700",
                  )}
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Phone number (optional)
              </label>
              <input
                {...register("phone")}
                id="phone"
                type="tel"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
            </div>

            {authError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
                You need to be signed in as a candidate to apply.{" "}
                <Link href="/login" className="font-semibold underline">
                  Sign in here.
                </Link>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label htmlFor="coverLetter" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Cover letter (optional)
              </label>
              <textarea
                {...register("coverLetter")}
                id="coverLetter"
                rows={5}
                className={cn(
                  "w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-900",
                  errors.coverLetter ? "border-red-400" : "border-gray-300 dark:border-gray-700",
                )}
              />
              {errors.coverLetter && <p className="mt-1 text-sm text-red-600">{errors.coverLetter.message}</p>}
            </div>

            <div>
              <label htmlFor="linkedInUrl" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                LinkedIn profile URL (optional)
              </label>
              <input
                {...register("linkedInUrl")}
                id="linkedInUrl"
                placeholder="https://linkedin.com/in/your-name"
                className={cn(
                  "w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-900",
                  errors.linkedInUrl ? "border-red-400" : "border-gray-300 dark:border-gray-700",
                )}
              />
              {errors.linkedInUrl && <p className="mt-1 text-sm text-red-600">{errors.linkedInUrl.message}</p>}
            </div>

            <div>
              <label htmlFor="howDidYouHear" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                How did you hear about this role?
              </label>
              <select
                {...register("howDidYouHear")}
                id="howDidYouHear"
                className={cn(
                  "w-full rounded-lg border bg-white px-3 py-2 text-sm dark:bg-gray-900",
                  errors.howDidYouHear ? "border-red-400" : "border-gray-300 dark:border-gray-700",
                )}
              >
                <option value="">Select an option</option>
                {hearOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.howDidYouHear && <p className="mt-1 text-sm text-red-600">{errors.howDidYouHear.message}</p>}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/40">
            <h4 className="text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">
              Review & Submit
            </h4>
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-medium text-gray-500">Full name</dt>
                <dd className="text-gray-900 dark:text-gray-100">{displayValue(currentValues.fullName)}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Email address</dt>
                <dd className="text-gray-900 dark:text-gray-100">{displayValue(currentValues.email)}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Phone number</dt>
                <dd className="text-gray-900 dark:text-gray-100">{displayValue(currentValues.phone)}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">How you heard about this role</dt>
                <dd className="text-gray-900 dark:text-gray-100">{displayValue(currentValues.howDidYouHear)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-medium text-gray-500">LinkedIn profile URL</dt>
                <dd className="break-all text-gray-900 dark:text-gray-100">{displayValue(currentValues.linkedInUrl)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-medium text-gray-500">Cover letter</dt>
                <dd className="mt-1 whitespace-pre-wrap rounded-md border border-gray-200 bg-white p-3 text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100">
                  {displayValue(currentValues.coverLetter)}
                </dd>
              </div>
            </dl>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Back
              </button>
            )}
          </div>

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {mutation.isPending ? "Submitting..." : "Submit application"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
