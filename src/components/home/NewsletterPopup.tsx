import { useEffect, useRef, useState } from "react";
import { useFeatureIsOn } from "@growthbook/growthbook-react";
import GrowthBookProvider from "../GrowthBookProvider";
import {
  DESKTOP_QUERY,
  EMBED_PATH,
  FOOTER_SECTION_ID,
  POPUP_FLAG,
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
  const [expanded, setExpanded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const subscribedRef = useRef(false);
  const shownRef = useRef(false);

  const mounted = enabled && eligible && triggered && !closed;
  const visible = mounted && !bottomFormInView;

  useEffect(() => {
    if (!visible || shownRef.current) return;
    shownRef.current = true;
    window.plausible("Newsletter Popup Shown");
  }, [visible]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const frame = iframeRef.current;
      if (!frame || event.origin !== window.location.origin || event.source !== frame.contentWindow) return;
      const message = parseEmbedMessage(event.data);
      if (!message) return;
      if (message.type === "resize") {
        // CSSOM, not a style="" attribute: the CSP blocks the latter.
        frame.style.height = `${message.height}px`;
        return;
      }
      if (subscribedRef.current) return;
      subscribedRef.current = true;
      writePopupState(safeLocalStorage(), { subscribed: true });
      window.plausible("Newsletter Signup", { props: { source: "popup" } });
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
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

  // Mobile, collapsed: a slim bar. Google treats small, dismissible banners as non-intrusive.
  if (!isDesktop && !expanded) {
    return (
      <div
        className={`fixed inset-x-4 bottom-20 z-40 flex items-center gap-2 rounded-pill bg-grove py-1 pl-5 pr-1 shadow-lg ${hiddenClass}`}
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

  // bottom-20 / md:bottom-24 keeps clear of the pal-chat launcher, which owns the bottom corners.
  return (
    <aside
      aria-label="Join our mailing list"
      className={`fixed bottom-20 right-4 z-40 w-[calc(100vw-2rem)] max-w-[380px] rounded-md border border-ink-divider bg-paper p-4 pt-10 shadow-lg md:bottom-24 md:right-6 ${hiddenClass}`}
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
