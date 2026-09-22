// Kept in its own file, separate from env.d.ts: a `declare module` for a
// virtual specifier only gets picked up by OTHER files when it lives in a
// .d.ts file that has no top-level `import`/`export` of its own (i.e. isn't
// itself a module) — otherwise, with `skipLibCheck: true` (astro's strict
// tsconfig), TypeScript silently fails to resolve it project-wide.
//
// Deliberately hand-rolled and scoped to just what this repo uses, rather
// than pulling in the full `@cloudflare/workers-types` package — that
// package also globally redefines DOM types like `fetch`/`Response` (e.g.
// `Response.json()` returns `unknown` instead of `any`), which broke type
// checking across unrelated, non-Workers-specific code.
declare module "cloudflare:workers" {
  const env: Cloudflare.Env;
  export { env };
}
