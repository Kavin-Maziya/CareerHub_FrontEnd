"use client";

import { useState, useEffect } from "react";
import { useForm, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";
import { submitApplication } from "../lib/applicationsApi";
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
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Maximum 100 characters"),
    email: z.string().email("Invalid email address"),
    phone: z
      .string()
      .regex(/^\+?[\d\s\-()\d]{8,15}$/, "Invalid phone number format")
      .or(z.literal(""))
      .transform((val) => (val === "" ? undefined : val))
      .optional(),
    coverLetter: z
      .string()
      .max(2000, "Maximum 2000 characters")
      .optional(),
    linkedInUrl: z
      .string()
      .url("Must be a valid URL format")
      .or(z.literal(""))
      .transform((val) => (val === "" ? undefined : val))
      .optional(),
    howDidYouHear: z.string().min(1, "Please select an option"),
  })
  .refine(
    (data) => {
      if (data.linkedInUrl) {
        return (
          data.linkedInUrl.startsWith("https://linkedin.com/") ||
          data.linkedInUrl.startsWith("https://www.linkedin.com/")
        );
      }
      return true;
    },
    {
      message: "Must start with https://linkedin.com/ or https://www.linkedin.com/",
      path: ["linkedInUrl"],
    }
  );

type WizardFormData = z.infer<typeof applicationWizardSchema>;

interface ApplicationWizardProps {
  jobId: string;
  jobTitle: string;
  isCandidate: boolean;
  onSuccess?: (newApplicantId: string) => void;
}

const cn = (...classes: string[]) => classes.filter(Boolean).join(" ");

export default function ApplicationWizard({ jobId, jobTitle, isCandidate, onSuccess }: ApplicationWizardProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [isDiscardOpen, setIsDiscardOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const storageKey = `careerhub-application-${jobId}`;

  const form = useForm<WizardFormData>({
    resolver: zodResolver(applicationWizardSchema) as Resolver<WizardFormData>,
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      coverLetter: "",
      linkedInUrl: "",
      howDidYouHear: "",
    },
  });

  const { register, handleSubmit, trigger, watch, reset, formState: { errors } } = form;

  // Check and restore draft on mount reactively
  useEffect(() => {
    const savedDraft = localStorage.getItem(storageKey);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        reset(parsed);
        setShowDraftBanner(true);
        setHasDraft(true);
      } catch (e) {
        console.error("Failed to restore draft", e);
      }
    }
  }, [reset, storageKey]);

  // Cleaned-up watch subscription for auto-saving
  useEffect(() => {
    const subscription = watch((value) => {
      localStorage.setItem(storageKey, JSON.stringify(value));
      setHasDraft(true);
    });
    return () => subscription.unsubscribe();
  }, [watch, storageKey]);

  const mutation = useMutation({
    mutationFn: (values: WizardFormData) =>
      submitApplication({
        jobId,
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        coverLetter: values.coverLetter || "",
        linkedInUrl: values.linkedInUrl || "",
        yearsOfExperience: 0,
        availableImmediately: true,
        noticePeriodWeeks: 0,
      }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      
      localStorage.removeItem(storageKey);
      setShowDraftBanner(false);
      setHasDraft(false);
      reset();
      setStep(1);

      toast.success("Application submitted successfully!");

      type ApplicationResponse = { applicantId?: string; id?: string };
      const res = response as ApplicationResponse;
      if (res?.applicantId) onSuccess?.(res.applicantId);
      else if (res?.id) onSuccess?.(res.id);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Submission failed.");
    },
  });

  const handleNext = async () => {
    if (step === 1) {
      if (!isCandidate) {
        setAuthError("You need to be signed in as a candidate to apply. Sign in here.");
        return;
      }
      setAuthError(null);
      const isStep1Valid = await trigger(["fullName", "email", "phone"]);
      if (isStep1Valid) setStep(2);
    } else if (step === 2) {
      const isStep2Valid = await trigger(["coverLetter", "linkedInUrl", "howDidYouHear"]);
      if (isStep2Valid) setStep(3);
    }
  };

  const handleBack = () => {
    setStep((prev) => (prev - 1) as 1 | 2);
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem(storageKey);
    reset({
      fullName: "",
      email: "",
      phone: "",
      coverLetter: "",
      linkedInUrl: "",
      howDidYouHear: "",
    });
    setHasDraft(false);
    setShowDraftBanner(false);
    setStep(1);
    setIsDiscardOpen(false);
    toast.success("Draft discarded successfully.");
  };

  const onValidSubmit = async (data: WizardFormData) => {
    await mutation.mutateAsync(data);
  };

  const currentValues = watch();

  return (
    <div className="space-y-6">
      {/* Restored Draft Banner */}
      {showDraftBanner && (
        <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900/50 dark:bg-blue-950/20">
          <p className="text-xs font-medium text-blue-800 dark:text-blue-400">
            ✨ You have a saved draft for this application. Restored automatically.
          </p>
          <button
            type="button"
            onClick={() => setShowDraftBanner(false)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 underline pl-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header section with reactive Discard Draft Dialog */}
      <div className="border-b border-gray-100 dark:border-gray-800 pb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Apply for {jobTitle}
          </h3>
          <div className="mt-3 flex items-center gap-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
            <span className={cn(step === 1 ? "text-blue-600 dark:text-blue-400 font-bold" : "")}>1. Details</span>
            <span>→</span>
            <span className={cn(step === 2 ? "text-blue-600 dark:text-blue-400 font-bold" : "")}>2. Application</span>
            <span>→</span>
            <span className={cn(step === 3 ? "text-blue-600 dark:text-blue-400 font-bold" : "")}>3. Review</span>
          </div>
        </div>

        {/* Part 4b: Pure Client-Side Discard Draft Trigger */}
        {hasDraft && (
          <AlertDialog open={isDiscardOpen} onOpenChange={setIsDiscardOpen}>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                className="rounded-md border border-red-200 bg-red-50 hover:bg-red-100 dark:border-red-900/30 dark:bg-red-950/20 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 transition-all shadow-sm"
              >
                Discard draft
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent
              onPointerDownOutside={(e) => e.preventDefault()}
              onEscapeKeyDown={(e) => e.preventDefault()}
            >
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
                  className="inline-flex h-9 items-center justify-center rounded-md bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all"
                >
                  Discard draft
                </button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <form onSubmit={handleSubmit(onValidSubmit)} noValidate className="space-y-6">
        {/* STEP 1: Details */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="fullName" className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                  Full Name *
                </label>
                <input
                  {...register("fullName")}
                  id="fullName"
                  type="text"
                  aria-invalid={!!errors.fullName}
                  className={cn(
                    "w-full rounded-lg border p-2 text-sm dark:bg-gray-800 transition-colors focus:outline-none focus:ring-2",
                    errors.fullName ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-blue-200"
                  )}
                  placeholder="John Doe"
                />
                {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                  Email Address *
                </label>
                <input
                  {...register("email")}
                  id="email"
                  type="email"
                  aria-invalid={!!errors.email}
                  className={cn(
                    "w-full rounded-lg border p-2 text-sm dark:bg-gray-800 transition-colors focus:outline-none focus:ring-2",
                    errors.email ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-blue-200"
                  )}
                  placeholder="john@example.com"
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Phone Number (Optional)
              </label>
              <input
                {...register("phone")}
                id="phone"
                type="tel"
                aria-invalid={!!errors.phone}
                className={cn(
                  "w-full rounded-lg border p-2 text-sm dark:bg-gray-800 transition-colors focus:outline-none focus:ring-2",
                  errors.phone ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-blue-200"
                )}
                placeholder="+27 82 123 4567"
              />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
            </div>

            {authError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
                You need to be signed in as a candidate to apply.{" "}
                <Link href="/login" className="underline font-semibold hover:text-red-900">
                  Sign in here.
                </Link>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Application */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label htmlFor="linkedInUrl" className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                LinkedIn Profile URL (Optional)
              </label>
              <input
                {...register("linkedInUrl")}
                id="linkedInUrl"
                type="text"
                aria-invalid={!!errors.linkedInUrl}
                className={cn(
                  "w-full rounded-lg border p-2 text-sm dark:bg-gray-800 transition-colors focus:outline-none focus:ring-2",
                  errors.linkedInUrl ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-blue-200"
                )}
                placeholder="https://linkedin.com/in/username"
              />
              {errors.linkedInUrl && <p className="text-xs text-red-500 mt-1">{errors.linkedInUrl.message}</p>}
            </div>

            <div>
              <label htmlFor="howDidYouHear" className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                How did you hear about this role? *
              </label>
              <select
                {...register("howDidYouHear")}
                id="howDidYouHear"
                aria-invalid={!!errors.howDidYouHear}
                className={cn(
                  "w-full rounded-lg border p-2 text-sm dark:bg-gray-800 transition-colors focus:outline-none focus:ring-2 bg-white dark:bg-gray-800",
                  errors.howDidYouHear ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-blue-200"
                )}
              >
                <option value="">Select an option...</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Indeed">Indeed</option>
                <option value="Company Website">Company Website</option>
                <option value="Referral">Referral</option>
                <option value="Other">Other</option>
              </select>
              {errors.howDidYouHear && <p className="text-xs text-red-500 mt-1">{errors.howDidYouHear.message}</p>}
            </div>

            <div>
              <label htmlFor="coverLetter" className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Cover Letter (Optional)
              </label>
              <textarea
                {...register("coverLetter")}
                id="coverLetter"
                rows={4}
                aria-invalid={!!errors.coverLetter}
                className={cn(
                  "w-full rounded-lg border p-2 text-sm dark:bg-gray-800 transition-colors focus:outline-none focus:ring-2",
                  errors.coverLetter ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-blue-200"
                )}
                placeholder="Tell us why you are an incredible fit..."
              />
              {errors.coverLetter && <p className="text-xs text-red-500 mt-1">{errors.coverLetter.message}</p>}
            </div>
          </div>
        )}

        {/* STEP 3: Review */}
        {step === 3 && (
          <div className="space-y-4 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/40">
            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Review Your Information</h4>
            
            <div className="grid gap-x-4 gap-y-3 text-sm sm:grid-cols-2">
              <div>
                <span className="block text-xs text-gray-400 uppercase font-semibold">Full Name</span>
                <span className="text-gray-900 dark:text-gray-100">{currentValues.fullName}</span>
              </div>
              <div>
                <span className="block text-xs text-gray-400 uppercase font-semibold">Email Address</span>
                <span className="text-gray-900 dark:text-gray-100">{currentValues.email}</span>
              </div>
              <div>
                <span className="block text-xs text-gray-400 uppercase font-semibold">Phone Number</span>
                <span className="text-gray-900 dark:text-gray-100">{currentValues.phone || "Not provided"}</span>
              </div>
              <div>
                <span className="block text-xs text-gray-400 uppercase font-semibold">Source</span>
                <span className="text-gray-900 dark:text-gray-100">{currentValues.howDidYouHear}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="block text-xs text-gray-400 uppercase font-semibold">LinkedIn Profile URL</span>
                <span className="text-gray-900 dark:text-gray-100 break-all">{currentValues.linkedInUrl || "Not provided"}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="block text-xs text-gray-400 uppercase font-semibold">Cover Letter</span>
                <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200/60 dark:border-gray-800 mt-1">
                  {currentValues.coverLetter || "Not provided"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Footer Actions */}
        <div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-800 pt-4">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
              >
                Back
              </button>
            )}
          </div>

          <div>
            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-all shadow-sm shadow-blue-500/10"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={mutation.isPending}
                className={cn(
                  "rounded-lg px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all focus:outline-none focus:ring-2",
                  mutation.isPending
                    ? "bg-gray-400 dark:bg-gray-700 cursor-not-allowed shadow-none"
                    : "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                )}
              >
                {mutation.isPending ? "Submitting…" : "Confirm & Submit Application"}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}