const SUCCESS_SELECTOR = ".emailoctopus-success-message";

// EmailOctopus renders .emailoctopus-success-message empty and fills in its
// text only after a successful submit, so non-empty text means "subscribed".
// Shared by the popup's iframe page and the homepage's bottom form.
export function watchSignupSuccess(root: Element, onSuccess: () => void): () => void {
  let done = false;
  const observer = new MutationObserver(check);

  function check() {
    if (done) return;
    const message = root.querySelector(SUCCESS_SELECTOR);
    if (message?.textContent?.trim()) {
      done = true;
      observer.disconnect();
      onSuccess();
    }
  }

  observer.observe(root, { childList: true, subtree: true, characterData: true });
  check();
  return () => observer.disconnect();
}
