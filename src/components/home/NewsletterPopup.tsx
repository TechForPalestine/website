import { useEffect, useRef, useState } from "react";
import { useFeatureIsOn } from "@growthbook/growthbook-react";
import GrowthBookProvider from "../GrowthBookProvider";
import {
  AUTO_CLOSE_AFTER_SUCCESS_MS,
  COLLAPSE_IDLE_MS,
  DESKTOP_QUERY,
  EMBED_PATH,
  FOOTER_SECTION_ID,
  POPUP_FLAG,
  POPUP_SUBSCRIBED_EVENT,
  SHOW_DELAY_MS,
  hasReachedScrollTrigger,
  isSuppressed,
  parseEmbedMessage,
  readPopupState,
  safeLocalStorage,
  writePopupState,
} from "../../utils/newsletterPopup";

// Homepage mailing-list popup. Spec: docs/superpowers/specs/2026-09-23-newsletter-popup-design.md

function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia(DESKTOP_QUERY).matches);
  useEffect(() => {
    const query = window.matchMedia(DESKTOP_QUERY);
    const onChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return isDesktop;
}

// 10s on the page or 35% of the way down, whichever comes first.
function useTrigger(active: boolean): boolean {
  const [triggered, setTriggered] = useState(false);
  useEffect(() => {
    if (!active || triggered) return;
    const fire = () => setTriggered(true);
    const timer = window.setTimeout(fire, SHOW_DELAY_MS);
    const onScroll = () => {
      const docHeight = document.documentElement.scrollHeight;
      if (hasReachedScrollTrigger(window.scrollY, window.innerHeight, docHeight)) fire();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [active, triggered]);
  return triggered;
}

function useInView(elementId: string): boolean {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const element = document.getElementById(elementId);
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    observer.observe(element);
    return () => observer.disconnect();
  }, [elementId]);
  return inView;
}

function CloseButton({ onClick, onDark = false }: { onClick: () => void; onDark?: boolean }) {
  const tone = onDark
    ? "text-white hover:bg-white/15"
    : "absolute right-2 top-2 text-ink-secondary hover:bg-stone";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close mailing list signup"
      className={`${tone} flex h-9 w-9 shrink-0 items-center justify-center rounded-pill focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grove`}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  );
}

function Popup() {
  const enabled = useFeatureIsOn(POPUP_FLAG);
  const [eligible] = useState(() => !isSuppressed(readPopupState(safeLocalStorage()), Date.now()));
  const triggered = useTrigger(enabled && eligible);
  const bottomFormInView = useInView(FOOTER_SECTION_ID);
  const isDesktop = useIsDesktop();
  const [closed, setClosed] = useState(false);
  // Desktop opens straight to the card; mobile starts collapsed to a slim bar
  // (see the render branch below — the same collapsed/expanded split now also
  // drives the 30s idle auto-collapse on both).
  const [expanded, setExpanded] = useState(isDesktop);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const subscribedRef = useRef(false);
  const shownRef = useRef(false);
  const resetIdleTimerRef = useRef(() => {});

  const mounted = enabled && eligible && triggered && !closed;
  const visible = mounted && !bottomFormInView;

  useEffect(() => {
    if (!visible || shownRef.current) return;
    shownRef.current = true;
    window.plausible("Newsletter Popup Shown");
  }, [visible]);

  // Auto-collapse the open card/bar after COLLAPSE_IDLE_MS of no activity.
  // Only runs while it's actually open and on screen; reset() is called from
  // the message handler below (for activity inside the iframe) and from
  // onMouseMove/onFocus on the rendered card/bar (for activity outside it).
  useEffect(() => {
    if (!visible || !expanded) {
      resetIdleTimerRef.current = () => {};
      return;
    }
    let timer: number;
    const reset = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setExpanded(false), COLLAPSE_IDLE_MS);
    };
    resetIdleTimerRef.current = reset;
    reset();
    return () => {
      window.clearTimeout(timer);
      resetIdleTimerRef.current = () => {};
    };
  }, [visible, expanded]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const frame = iframeRef.current;
      if (!frame || event.origin !== window.location.origin || event.source !== frame.contentWindow) return;
      const message = parseEmbedMessage(event.data);
      if (!message) return;
      if (message.type === "resize") {
        // CSSOM, not a style="" attribute: the CSP blocks the latter.
        frame.style.height = `${message.height}px`;
        resetIdleTimerRef.current();
        return;
      }
      if (message.type === "interaction") {
        resetIdleTimerRef.current();
        return;
      }
      resetIdleTimerRef.current();
      if (subscribedRef.current) return;
      subscribedRef.current = true;
      writePopupState(safeLocalStorage(), { subscribed: true });
      window.plausible("Newsletter Signup", { props: { source: "popup" } });
      // Give the visitor a moment to see EmailOctopus's "Thanks for
      // subscribing!" message, then close on our own — setClosed directly,
      // not close(), so this never counts as a dismissal.
      window.setTimeout(() => setClosed(true), AUTO_CLOSE_AFTER_SUCCESS_MS);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // The bottom-of-page form is a second way to subscribe. When it succeeds,
  // index.astro's watcher persists { subscribed: true } to storage AND fires
  // this event, so a popup that's already mounted (it read storage once, at
  // mount) stands down on this page load too — without counting as a
  // dismissal, since the visitor did subscribe.
  useEffect(() => {
    const onSubscribedElsewhere = () => {
      subscribedRef.current = true;
      setClosed(true);
    };
    window.addEventListener(POPUP_SUBSCRIBED_EVENT, onSubscribedElsewhere);
    return () => window.removeEventListener(POPUP_SUBSCRIBED_EVENT, onSubscribedElsewhere);
  }, []);

  const close = () => {
    setClosed(true);
    if (subscribedRef.current) return;
    writePopupState(safeLocalStorage(), { dismissedAt: Date.now() });
    window.plausible("Newsletter Popup Dismissed");
  };

  useEffect(() => {
    if (!visible) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visible]);

  if (!mounted) return null;
  const hiddenClass = visible ? "" : "hidden";

  // Collapsed: a small pill button. Full-width bar on mobile; anchored to the
  // corner on desktop. A fresh element each time (this branch swaps with the
  // card branch below, never both), so animate-fadeIn plays on every
  // collapse, not just the first.  Google treats small, dismissible banners
  // as non-intrusive, so this also covers the mobile "not yet opened" state.
  if (!expanded) {
    return (
      <div
        className={`fixed inset-x-4 bottom-4 z-40 flex animate-fadeIn items-center gap-2 rounded-pill bg-grove py-1 pl-5 pr-1 shadow-lg md:inset-x-auto md:right-4 md:w-auto md:pl-6 ${hiddenClass}`}
      >
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex-1 py-2 text-left text-[15px] font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Get T4P updates <span aria-hidden="true">→</span>
        </button>
        <CloseButton onClick={close} onDark />
      </div>
    );
  }

  return (
    <aside
      aria-label="Join our mailing list"
      className={`fixed bottom-4 right-4 z-40 w-[calc(100vw-2rem)] max-w-[380px] animate-fadeIn rounded-md border border-ink-divider bg-paper p-4 pt-10 shadow-lg md:right-6 ${hiddenClass}`}
      onMouseMove={() => resetIdleTimerRef.current()}
      onFocus={() => resetIdleTimerRef.current()}
    >
      <CloseButton onClick={close} />
      <iframe
        ref={iframeRef}
        src={EMBED_PATH}
        title="Join our Mailing List"
        className="block h-[220px] w-full border-0"
      />
    </aside>
  );
}

export default function NewsletterPopup() {
  return (
    <GrowthBookProvider>
      <Popup />
    </GrowthBookProvider>
  );
}
