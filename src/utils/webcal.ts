// webcal:// tells the OS/browser to hand the URL to the default calendar app as a
// subscription (auto-updating) rather than downloading it as a one-off file.
export function toWebcalUrl(httpsUrl: string): string {
  return httpsUrl.replace(/^https?:/, "webcal:");
}
