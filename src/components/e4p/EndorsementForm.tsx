import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import FormField, { inputClass } from "../endorsements/FormField";
import {
  MAX_TEXT_LENGTH,
  requiredText,
  submitErrorMessage,
  validEmail,
  validLink,
  withinCap,
  type EndorsementRequest,
} from "../endorsements/endorsementValidation";
import { focusRing, ghostButton, inlineLink, primaryButton } from "../../utils/designClasses";

// Posts to /api/endorsement-request. The payload is the EndorsementRequest
// object exactly as react-hook-form collects it: the same ten keys the API
// reads, unchanged. Validation mirrors the server (see endorsementValidation).

type Status = "idle" | "submitting" | "sent";

const legendClass = "text-xs font-bold uppercase tracking-[0.14em] text-grove-deep";
const fieldsetClass = "grid gap-6 border-t border-ink-divider pt-6 first:border-t-0 first:pt-0";
const NETWORK_ERROR =
  "Your request didn't send. Check your connection and try again; your answers are still here.";

function readServerMessage(body: unknown): string | undefined {
  if (body && typeof body === "object" && "error" in body) {
    const { error } = body as { error: unknown };
    return typeof error === "string" ? error : undefined;
  }
  return undefined;
}

function Confirmation({ email, onReset }: { email: string; onReset: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div role="status" className="py-2">
      <span
        aria-hidden="true"
        className="flex h-11 w-11 items-center justify-center rounded-pill bg-first-light text-grove"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="m5 12.5 4.5 4.5L19 7.5" />
        </svg>
      </span>
      <h3
        ref={headingRef}
        tabIndex={-1}
        className={`mt-5 rounded-sm text-[26px] font-extrabold leading-[1.15] text-ink min-[810px]:text-[30px] ${focusRing}`}
      >
        Request received
      </h3>
      <p className="mt-4 max-w-[52ch] text-[17px] leading-[1.7] text-ink-secondary">
        Thank you. We aim to review every request within 5 to 7 days, and we'll write to{" "}
        <strong className="break-words font-bold text-ink">{email}</strong> if we need more
        information or once we've decided.
      </p>
      <button type="button" onClick={onReset} className={`mt-7 ${ghostButton}`}>
        Submit another request
      </button>
    </div>
  );
}

function SubmitError({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-sm border border-red-700 bg-paper px-5 py-4">
      <p className="text-[17px] font-bold leading-snug text-red-700">{message}</p>
      <p className="mt-1 text-[15px] leading-relaxed text-ink-secondary">
        Try again in a moment. If it keeps failing,{" "}
        <a href="/contact" className={inlineLink}>
          contact us
        </a>{" "}
        and we'll take your request directly.
      </p>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4 motion-safe:animate-spin"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export default function EndorsementForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<EndorsementRequest>({
    defaultValues: { isT4PProject: false },
  });

  const purposeLength = watch("campaignPurpose")?.length ?? 0;
  const submitting = status === "submitting";

  const onSubmit = async (data: EndorsementRequest) => {
    setStatus("submitting");
    setSubmitError(null);

    try {
      const response = await fetch("/api/endorsement-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const body: unknown = await response.json().catch(() => undefined);
        setSubmitError(submitErrorMessage(response.status, readServerMessage(body)));
        setStatus("idle");
        return;
      }

      setSentTo(data.contactEmail.trim());
      reset();
      setStatus("sent");
    } catch {
      setSubmitError(NETWORK_ERROR);
      setStatus("idle");
    }
  };

  if (status === "sent") {
    return <Confirmation email={sentTo} onReset={() => setStatus("idle")} />;
  }

  // Shared props for each control: describedby/invalid from FormField, plus
  // aria-required on everything except the one optional field.
  const a11y = (ids: { describedBy: string | undefined; invalid: boolean }, required = true) => ({
    "aria-describedby": ids.describedBy,
    "aria-invalid": ids.invalid,
    "aria-required": required || undefined,
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-busy={submitting}
      className="grid gap-8"
    >
      <fieldset className={fieldsetClass}>
        <legend className={`float-left mb-0 ${legendClass}`}>About you</legend>
        <div className="clear-left grid gap-6 sm:grid-cols-2">
          <FormField id="contactName" label="Your name" error={errors.contactName?.message}>
            {(ids) => (
              <input
                id="contactName"
                type="text"
                autoComplete="name"
                className={inputClass}
                {...a11y(ids)}
                {...register("contactName", {
                  validate: {
                    required: requiredText("Enter your name"),
                    withinCap,
                  },
                })}
              />
            )}
          </FormField>
          <FormField id="contactEmail" label="Email" error={errors.contactEmail?.message}>
            {(ids) => (
              <input
                id="contactEmail"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="name@example.org"
                className={inputClass}
                {...a11y(ids)}
                {...register("contactEmail", {
                  validate: {
                    required: requiredText("Enter your email address"),
                    validEmail,
                  },
                })}
              />
            )}
          </FormField>
        </div>
      </fieldset>

      <fieldset className={fieldsetClass}>
        <legend className={`float-left mb-0 ${legendClass}`}>Your organization</legend>
        <div className="clear-left grid gap-6 sm:grid-cols-2">
          <FormField
            id="organizationName"
            label="Organization name"
            error={errors.organizationName?.message}
          >
            {(ids) => (
              <input
                id="organizationName"
                type="text"
                autoComplete="organization"
                className={inputClass}
                {...a11y(ids)}
                {...register("organizationName", {
                  validate: {
                    required: requiredText("Enter your organization's name"),
                    withinCap,
                  },
                })}
              />
            )}
          </FormField>
          <FormField
            id="organizationWebsite"
            label="Organization website"
            error={errors.organizationWebsite?.message}
          >
            {(ids) => (
              <input
                id="organizationWebsite"
                type="url"
                autoComplete="url"
                inputMode="url"
                placeholder="https://"
                className={inputClass}
                {...a11y(ids)}
                {...register("organizationWebsite", {
                  validate: {
                    required: requiredText("Enter your organization's website"),
                    validLink,
                  },
                })}
              />
            )}
          </FormField>
        </div>
      </fieldset>

      <fieldset className={fieldsetClass}>
        <legend className={`float-left mb-0 ${legendClass}`}>Your campaign</legend>
        <div className="clear-left grid gap-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <FormField id="campaignName" label="Campaign name" error={errors.campaignName?.message}>
              {(ids) => (
                <input
                  id="campaignName"
                  type="text"
                  className={inputClass}
                  {...a11y(ids)}
                  {...register("campaignName", {
                    validate: {
                      required: requiredText("Enter the campaign's name"),
                      withinCap,
                    },
                  })}
                />
              )}
            </FormField>
            <FormField
              id="campaignLink"
              label="Campaign link"
              hint="Your campaign's website or page"
              error={errors.campaignLink?.message}
            >
              {(ids) => (
                <input
                  id="campaignLink"
                  type="url"
                  inputMode="url"
                  placeholder="https://"
                  className={inputClass}
                  {...a11y(ids)}
                  {...register("campaignLink", {
                    validate: {
                      required: requiredText("Enter a link to the campaign"),
                      validLink,
                    },
                  })}
                />
              )}
            </FormField>
          </div>

          <FormField
            id="request"
            label="Your request"
            hint="Briefly, what are you asking T4P for?"
            error={errors.request?.message}
          >
            {(ids) => (
              <textarea
                id="request"
                rows={2}
                className={`${inputClass} resize-y`}
                {...a11y(ids)}
                {...register("request", {
                  validate: {
                    required: requiredText("Describe what you're asking for"),
                    withinCap,
                  },
                })}
              />
            )}
          </FormField>

          <FormField
            id="campaignPurpose"
            label="Purpose of the campaign"
            hint="Its goals, and what it will change"
            meta={`${purposeLength.toLocaleString("en-US")} / ${MAX_TEXT_LENGTH.toLocaleString("en-US")}`}
            error={errors.campaignPurpose?.message}
          >
            {(ids) => (
              <textarea
                id="campaignPurpose"
                rows={5}
                className={`${inputClass} resize-y`}
                {...a11y(ids)}
                {...register("campaignPurpose", {
                  validate: {
                    required: requiredText("Describe the campaign's purpose"),
                    withinCap,
                  },
                })}
              />
            )}
          </FormField>

          <FormField
            id="notableSupporters"
            label="Notable supporters"
            hint="Organizations or people who have already signed on"
            optional
            error={errors.notableSupporters?.message}
          >
            {(ids) => (
              <textarea
                id="notableSupporters"
                rows={2}
                className={`${inputClass} resize-y`}
                {...a11y(ids, false)}
                {...register("notableSupporters", { validate: { withinCap } })}
              />
            )}
          </FormField>

          <label
            htmlFor="isT4PProject"
            className="flex cursor-pointer items-start gap-3 text-[17px] leading-snug text-ink"
          >
            <input
              id="isT4PProject"
              type="checkbox"
              className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded-sm accent-grove focus:outline-none focus-visible:ring-2 focus-visible:ring-grove focus-visible:ring-offset-2"
              {...register("isT4PProject")}
            />
            <span>This campaign is an existing Tech for Palestine project</span>
          </label>
        </div>
      </fieldset>

      <div className="grid gap-5 border-t border-ink-divider pt-6">
        {submitError && <SubmitError message={submitError} />}
        <div>
          <button
            type="submit"
            disabled={submitting}
            className={`${primaryButton} w-full disabled:cursor-wait disabled:bg-grove-hover sm:w-auto`}
          >
            {submitting && <Spinner />}
            {submitting ? "Sending request..." : "Send endorsement request"}
          </button>
        </div>
      </div>
    </form>
  );
}
