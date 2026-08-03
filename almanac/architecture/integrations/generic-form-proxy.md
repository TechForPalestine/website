---
title: "The Generic Form Proxy and Shared Form Infrastructure"
summary: "project-proxy.ts is a path-normalizing, header-allowlisting authenticated proxy to the Frappe/ProjectHub backend that only the volunteer application form's react-hook-form infrastructure actually uses; PledgeForm and EndorsementForm deliberately bypass all of it."
topics: [architecture, integrations, forms]
sources:
  - id: project-proxy
    type: file
    path: src/pages/api/project-proxy.ts
  - id: store-api
    type: file
    path: src/store/api.ts
  - id: store-index
    type: file
    path: src/store/index.tsx
  - id: hook-form-dir
    type: file
    path: src/components/hook-form/
  - id: form-provider
    type: file
    path: src/components/hook-form/form-provider.tsx
  - id: rhf-table-section
    type: file
    path: src/components/hook-form/rhf-table-section.tsx
  - id: volunteer-form
    type: file
    path: src/components/volunteerForm.tsx
  - id: inputs-mapping
    type: file
    path: src/components/inputs-mapping.tsx
  - id: helpers
    type: file
    path: src/utils/helpers.ts
  - id: pledge-form
    type: file
    path: src/components/PledgeForm.tsx
  - id: endorsement-form
    type: file
    path: src/components/EndorsementForm.tsx
---

`src/pages/api/project-proxy.ts` is the canonical server-side secret-proxying route on the site: it holds `PUBLIC_API_URL` and `PUBLIC_SECRET_KEY` and stands between the browser and the T4P incubator's Frappe backend so that neither the upstream URL's authority nor the secret ever reach client-side JavaScript. A parallel stack of react-hook-form infrastructure exists specifically to drive forms through this proxy, but only one form on the site — the volunteer application form — actually uses it; the pledge and endorsement forms deliberately go around all of it, and understanding why clarifies what this infrastructure is actually for.

## Path normalization and the header allowlist

The proxy accepts a `path` query parameter naming the upstream endpoint to call, and does two things before it will forward anything. First, it runs the raw path through `new URL(path, "http://localhost").pathname` — collapsing any `../` or `./` segments the caller supplied — *before* checking the path against an allowlist, so a crafted path like `/api/method/../../api/auth/admin` cannot be used to walk out of the allowed prefix and reach an unintended upstream route [@project-proxy]. Second, it requires the normalized path to start with `/api/method/`; anything else gets a `403` [@project-proxy]. Only after both checks pass does it build the upstream URL as `${PUBLIC_API_URL}${normalizedPath}` and forward the request.

Forwarded headers are an explicit allowlist — `content-type`, `accept`, `accept-language`, `accept-encoding` — and nothing else is copied from the incoming request, so cookies, the caller's IP, or any other browser-supplied header never reach the upstream Frappe instance [@project-proxy]. The `Authorization` header is then always overwritten server-side with the raw `PUBLIC_SECRET_KEY` value, regardless of what (if anything) the browser sent, which is what keeps the secret out of the client bundle entirely: the browser never holds a value that could authenticate to the upstream API on its own [@project-proxy]. The response's `transfer-encoding` and `connection` headers are stripped before being passed back, since Cloudflare Workers manage those hop-by-hop headers itself and a proxied copy would conflict. This combination — normalize before allowlisting, allowlist forwarded headers, inject the secret server-side — is the pattern the [security hardening baseline](security-hardening-baseline) treats as the reference implementation for any future proxy route; see [API route conventions](api-route-conventions) for the wider shape (`prerender = false`, `getEnv`, generic error responses) this route also follows.

## The client stack built on top of it

`src/store/api.ts` is the only place on the client that talks to the Frappe backend, and it does so entirely through the proxy: its axios instance has `baseURL: "/api/project-proxy"`, so every request it makes is automatically routed through the normalization and secret-injection above [@store-api]. It exports `fetchFormFields` and `fetchFieldData` (both `GET`, wrapping a `path` param prefixed with `/api/method`) and `submitForm`, which builds a `multipart/form-data` body via `convertToFormData` — a helper that recursively flattens a nested object into `FormData` entries, JSON-stringifying arrays and plain objects and appending `File` instances directly [@store-api]. `src/store/index.tsx` is just a one-line barrel that re-exports this module as `API`; despite living in a directory named `store`, none of this is a React context or app-wide state container — it is a thin HTTP client layer [@store-index].

`src/components/hook-form/` is a set of `react-hook-form` wrapper components built on Material UI: text fields, single/multi selects, checkboxes, radio groups, file upload, a skill-selector table (`RHFSkillSelector`, defined in `rhf-checkTable.tsx`), and `RHFTableSection` for dynamic add/remove rows bound to a `useFieldArray` [@hook-form-dir] [@rhf-table-section]. They're barreled through `index.ts`, whose default export is `FormProvider` — a component that wraps react-hook-form's own `FormProvider` plus a native `<form>` element that calls `methods.handleSubmit` on submit [@form-provider]. `src/utils/helpers.ts` exports `transformObject`, which walks a nested object and turns any sub-object containing an array into the row-array shape (`[{ key: value }, ...]`) the Frappe backend's Table field type expects on write [@helpers].

## The one real consumer, and why the rest of the site skips it

`src/components/volunteerForm.tsx` is the only component that actually wires all of this together: it calls `fetchFormFields` on mount to pull the volunteer application's field schema from Frappe, renders it through `RenderFormFields` in `src/components/inputs-mapping.tsx` (which switches on Frappe field type — `Data`, `Select`, `Table MultiSelect`, `Attach`, `Table`, `Link`, and so on — to pick the matching `hook-form` component), and on submit runs the collected values through `transformObject` before calling `submitForm` [@volunteer-form] [@inputs-mapping] [@helpers]. `inputs-mapping.tsx` also calls `fetchFormFields`/`fetchFieldData` itself, to resolve the option lists for `Link` and `Table MultiSelect` fields that need a second Frappe lookup before they can render [@inputs-mapping].

By contrast, `src/components/PledgeForm.tsx` and `src/components/EndorsementForm.tsx` call `useForm` directly from `react-hook-form`, render plain Material UI inputs by hand, and submit with a bare `fetch` — to `/api/e4p-pledge-sign` and `/api/endorsement-request` respectively [@pledge-form] [@endorsement-form]. Neither of those routes talks to the Frappe backend at all; they write directly to Notion. There is no shared backend for those two forms to route through `project-proxy`, so there is nothing for the `hook-form`/`store/api.ts` stack to buy them — the shared infrastructure exists to solve "drive a dynamic, server-defined form against the ProjectHub/Frappe API," and pledge and endorsement are neither dynamic nor talking to that API.
