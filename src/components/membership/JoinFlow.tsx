import { useState, type FormEvent } from "react";
import MembershipCalculator from "./MembershipCalculator";
import QgivJoin from "./QgivJoin";
import { validateAboutYou, type AboutYouData } from "./aboutYou";
import { membershipBenefits } from "../../data/membershipBenefits";
import type { MembershipTier, QgivPrefill } from "./qgiv";

const CALENDLY_URL = "https://calendly.com/d/ctpm-sw2-yvc/t4p-intro-call";

type StepId = "about-you" | "tier" | "payment";

const STEPS: { id: StepId; label: string }[] = [
  { id: "about-you", label: "About you" },
  { id: "tier", label: "Membership selection" },
  { id: "payment", label: "Payment" },
];

/** How long the "Continue" button shows its own spinner before the next step
 * is revealed. Without this floor the swap is instant and the button's
 * loading state never becomes visible. Mirrors QgivJoin's own
 * MIN_LOADING_DISPLAY_MS floor. */
const NEXT_BUTTON_LOADING_MS = 400;

const MEMBER_BENEFITS = membershipBenefits.map((b) => b.label);
const SUPPORTING_BENEFITS = membershipBenefits.filter((b) => b.supporting).map((b) => b.label);

interface JoinFlowProps {
  /** Uses the design system's ts-* typography scale (Fraunces/Outfit) instead
   * of plain Tailwind sizes — only correct where `design-system.css` is
   * loaded (HomeLayout, i.e. /membership-new). The legacy /membership page
   * uses the default plain-Tailwind rendering, since that CSS file isn't
   * available there. */
  designSystem?: boolean;
}

interface StyleSet {
  stepLabel: string;
  heading: string;
  fieldLabel: string;
  input: string;
  button: string;
  helper: string;
  link: string;
  tierIntro: string;
  tierTitle: string;
  tierDescription: string;
  tierBenefit: string;
  tierNote: string;
  backLink: string;
}

function getStyles(designSystem: boolean): StyleSet {
  if (designSystem) {
    return {
      stepLabel: "ts-overline text-[#157A3E]",
      heading: "ts-heading text-ink",
      fieldLabel: "ts-label text-ink",
      input: "ts-body text-ink",
      button: "ts-label rounded-pill",
      helper: "ts-body-small text-ink-secondary",
      link: "ts-body-small font-semibold text-[#157A3E]",
      tierIntro: "ts-body text-ink-secondary",
      tierTitle: "ts-body-large font-semibold text-ink",
      tierDescription: "ts-body-small text-ink-secondary",
      tierBenefit: "ts-body-small text-ink-secondary",
      tierNote: "ts-caption text-ink-secondary",
      backLink: "ts-body-small font-semibold text-ink-secondary hover:text-ink",
    };
  }
  return {
    stepLabel: "text-[11px] font-bold uppercase tracking-[0.12em] text-[#157A3E]",
    heading: "text-2xl font-extrabold text-ink",
    fieldLabel: "text-sm font-semibold text-ink",
    input: "text-[15px] text-ink",
    button: "text-[15px] font-bold rounded-full",
    helper: "text-[13px] leading-relaxed text-ink-secondary",
    link: "text-[13px] font-bold text-[#157A3E]",
    tierIntro: "text-[15px] leading-relaxed text-ink-secondary",
    tierTitle: "text-base font-bold text-ink",
    tierDescription: "text-[15px] leading-relaxed text-ink-secondary",
    tierBenefit: "text-[15px] text-ink-secondary",
    tierNote: "text-[13px] leading-relaxed text-ink-secondary",
    backLink: "text-sm font-semibold text-ink-secondary hover:text-ink",
  };
}

function splitName(name: string): { firstName: string; lastName: string } {
  const [firstName, ...rest] = name.trim().split(/\s+/);
  return { firstName: firstName ?? "", lastName: rest.join(" ") };
}

interface AboutYouFormProps {
  initialValues: AboutYouData | null;
  submitting: boolean;
  styles: StyleSet;
  onContinue: (data: AboutYouData) => void;
}

function AboutYouForm({ initialValues, submitting, styles, onContinue }: AboutYouFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [email, setEmail] = useState(initialValues?.email ?? "");
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const { nameError: nextNameError, emailError: nextEmailError } = validateAboutYou(
      trimmedName,
      trimmedEmail,
    );
    setNameError(nextNameError);
    setEmailError(nextEmailError);
    if (nextNameError || nextEmailError) return;
    onContinue({ name: trimmedName, email: trimmedEmail });
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 className={`mb-5 ${styles.heading}`}>Become a Member</h2>

      <label htmlFor="join-name" className={`mb-1.5 block ${styles.fieldLabel}`}>
        Name
      </label>
      <input
        id="join-name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your full name"
        autoComplete="name"
        disabled={submitting}
        className={`mb-1 w-full rounded-lg border border-ink-divider bg-white px-3.5 py-3 focus:border-[#157A3E] focus:outline-none focus:ring-1 focus:ring-[#157A3E] disabled:opacity-60 ${styles.input}`}
      />
      {nameError && <p className="mb-3 text-xs text-red-700">{nameError}</p>}
      {!nameError && <div className="mb-4" />}

      <label htmlFor="join-email" className={`mb-1.5 block ${styles.fieldLabel}`}>
        Email
      </label>
      <input
        id="join-email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        autoComplete="email"
        disabled={submitting}
        className={`mb-1 w-full rounded-lg border border-ink-divider bg-white px-3.5 py-3 focus:border-[#157A3E] focus:outline-none focus:ring-1 focus:ring-[#157A3E] disabled:opacity-60 ${styles.input}`}
      />
      {emailError && <p className="mb-4 text-xs text-red-700">{emailError}</p>}
      {!emailError && <div className="mb-5" />}

      <button
        type="submit"
        disabled={submitting}
        className={`flex w-full items-center justify-center gap-2 bg-[#157A3E] px-5 py-3.5 text-white transition-colors hover:bg-[#0e5a2f] disabled:cursor-not-allowed disabled:opacity-70 ${styles.button}`}
      >
        {submitting && (
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
            aria-hidden="true"
          />
        )}
        {submitting ? "Loading…" : "Continue"}
      </button>

      <p className={`mt-3.5 ${styles.helper}`}>
        Dues are pay-what-you-can &middot; Waivers available &middot; Tax deductible in the US
      </p>
      <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer" className={`mt-3 inline-block ${styles.link}`}>
        Talk to membership first →
      </a>
    </form>
  );
}

interface TierCardProps {
  tier: MembershipTier;
  title: string;
  description: string;
  benefits: string[];
  selected: boolean;
  styles: StyleSet;
  onSelect: () => void;
}

function TierCard({ tier, title, description, benefits, selected, styles, onSelect }: TierCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`w-full rounded-lg border-2 p-5 text-left transition-colors ${
        selected
          ? "border-[#157A3E] bg-[#F0F7F2]"
          : "border-ink-divider bg-white hover:border-[#9BC2A9]"
      }`}
    >
      <div className="mb-2 flex items-center gap-2">
        <span
          aria-hidden="true"
          className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
            selected ? "border-[#157A3E]" : "border-ink-divider"
          }`}
        >
          {selected && <span className="h-2 w-2 rounded-full bg-[#157A3E]" />}
        </span>
        <h3 className={styles.tierTitle}>{title}</h3>
      </div>
      <p className={`mb-3 ${styles.tierDescription}`}>{description}</p>
      <ul className="space-y-1.5">
        {benefits.map((benefit) => (
          <li key={benefit} className={`flex items-baseline gap-2 ${styles.tierBenefit}`}>
            <span
              aria-hidden="true"
              className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-[#157A3E]"
            />
            {benefit}
          </li>
        ))}
      </ul>
      {tier === "member" && (
        <p className={`mt-3 ${styles.tierNote}`}>
          Note: Our member community is fully vetted. To keep everyone safe and make sure we
          share the same values, we do a quick identity and alignment check during onboarding.
          <br />
          *Tech for Palestine aims for inclusivity. Please contact{" "}
          <a href="mailto:membership@techforpalestine.org" className="font-semibold text-[#157A3E]">
            membership@techforpalestine.org
          </a>{" "}
          to request a waiver of dues in the following circumstances:
        </p>
      )}
      {tier === "member" && (
        <ul className={`mt-1.5 space-y-1 pl-4 ${styles.tierNote}`}>
          <li className="list-disc">Being located in, or a refugee from Gaza or the West Bank</li>
          <li className="list-disc">
            Not being able to afford membership due to personal circumstances
          </li>
        </ul>
      )}
    </button>
  );
}

export default function JoinFlow({ designSystem = false }: JoinFlowProps) {
  const styles = getStyles(designSystem);
  const [step, setStep] = useState<StepId>("about-you");
  const [aboutYou, setAboutYou] = useState<AboutYouData | null>(null);
  const [tier, setTier] = useState<MembershipTier | null>(null);
  const [mountedTiers, setMountedTiers] = useState<MembershipTier[]>([]);
  const [advancing, setAdvancing] = useState(false);

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  function handleAboutYouContinue(data: AboutYouData) {
    setAboutYou(data);
    setAdvancing(true);
    window.setTimeout(() => {
      setStep("tier");
      setAdvancing(false);
    }, NEXT_BUTTON_LOADING_MS);
  }

  function handleTierContinue() {
    if (!tier) return;
    setAdvancing(true);
    setMountedTiers((prev) => (prev.includes(tier) ? prev : [...prev, tier]));
    window.setTimeout(() => {
      setStep("payment");
      setAdvancing(false);
    }, NEXT_BUTTON_LOADING_MS);
  }

  const prefill: QgivPrefill | undefined = aboutYou
    ? { ...splitName(aboutYou.name), email: aboutYou.email }
    : undefined;

  return (
    <div className="rounded-[10px] border border-ink-divider bg-white p-7 shadow-sm">
      <p className={`mb-4 ${styles.stepLabel}`}>
        Step {stepIndex + 1} of {STEPS.length}: {STEPS[stepIndex]?.label}
      </p>

      {step === "about-you" && (
        <AboutYouForm
          initialValues={aboutYou}
          submitting={advancing}
          styles={styles}
          onContinue={handleAboutYouContinue}
        />
      )}

      {step === "tier" && (
        <div>
          <button type="button" onClick={() => setStep("about-you")} className={`mb-4 ${styles.backLink}`}>
            &larr; Back
          </button>
          <p className={`mb-4 ${styles.tierIntro}`}>
            Please select your preferred membership tier. You can change this later.
          </p>
          <div role="radiogroup" aria-label="Membership tier" className="space-y-3">
            <TierCard
              tier="member"
              title="Member (Pay-what-you-can, waivers available*)"
              description="Collaborate directly on projects and support teams. Ideal for those wanting hands-on involvement."
              benefits={MEMBER_BENEFITS}
              selected={tier === "member"}
              styles={styles}
              onSelect={() => setTier("member")}
            />
            <TierCard
              tier="supporting"
              title="Supporting Member"
              description="Your contribution sustains our project services. Ideal for those who would like to support financially without committing to volunteer hours."
              benefits={SUPPORTING_BENEFITS}
              selected={tier === "supporting"}
              styles={styles}
              onSelect={() => setTier("supporting")}
            />
          </div>
          <button
            type="button"
            onClick={handleTierContinue}
            disabled={!tier || advancing}
            className={`mt-5 flex w-full items-center justify-center gap-2 bg-[#157A3E] px-5 py-3.5 text-white transition-colors hover:bg-[#0e5a2f] disabled:cursor-not-allowed disabled:opacity-50 ${styles.button}`}
          >
            {advancing && (
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                aria-hidden="true"
              />
            )}
            {advancing ? "Loading…" : "Continue"}
          </button>
          <p className={`mt-3 ${styles.helper}`}>
            You&apos;ll be redirected to our secure payment partner to complete your membership.
          </p>
        </div>
      )}

      {step === "payment" && tier && (
        <div>
          <button type="button" onClick={() => setStep("tier")} className={`mb-4 ${styles.backLink}`}>
            &larr; Change tier
          </button>
          <div className="mb-4">
            <MembershipCalculator theme="green" designSystem={designSystem} />
          </div>
          {mountedTiers.map((mountedTier) => (
            <div key={mountedTier} className={tier === mountedTier ? "block" : "hidden"}>
              <QgivJoin tier={mountedTier} prefill={prefill} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
