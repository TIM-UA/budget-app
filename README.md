# React + TypeScript + Vite

## Storage and user isolation

The app reads and writes persisted data through `StorageProvider` and the
`StorageAdapter` interface in `src/context/StorageContext.tsx`. The default
`LocalStorageAdapter` preserves the existing `budget-app-*` keys for the local
guest profile. Supplying a `userId` to `StorageProvider` gives that user a
separate key namespace; the provider can also receive a replacement adapter for
a future backend integration.

### Supabase setup

1. Copy `.env.example` to `.env.local` and fill in the Supabase project URL and
   publishable anon key. These client credentials are expected to be public;
   never put a service-role key in the frontend.
2. Run `supabase/schema.sql` in the Supabase SQL editor. It creates the
   `app_user_data` key/value table with row-level security policies that require
   `auth.uid() = user_id`.
3. Enable Email auth in Supabase. The app provides email/password login and
   sign-up; email confirmation behavior follows the project Auth settings.

Guest data continues using its original LocalStorage keys. Signed-in accounts
use a distinct per-user LocalStorage cache and sync app data to `app_user_data`
under the authenticated user's ID. When first connecting an account, existing
data already cached for that same user is uploaded if their cloud table is
empty; guest data is never copied into an account. The Settings reset clears
only the active app data scope. Supabase Auth persists independently, so reset
does not log out the user.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
