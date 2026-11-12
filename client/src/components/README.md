# Frontend structure

Components live beside the feature they implement: `auth`, `chat`, `discover`,
`layout`, `listings`, `profile`, `session-tools`, and `settings`.
App Router pages import their screen component directly. Shared shadcn primitives
remain in `ui`.

- Screen components compose sections. Hooks such as `useChatActions`,
  `useListingForm`, and `useProfileForm` own interaction logic.
- Redux remains the source of chat messages, drafts, AI mode, and selected quotes.
  Typed Redux hooks live in `lib/hooks.ts`; error mapping lives in `lib/errors.ts`.
- `Providers` mounts one `useChatConnection`. It owns socket creation, history
  synchronization, reconnection, and cleanup. Sending uses `lib/chat-transport.ts`.
  Presentation components do not create connections or import the provider.
- Keep component props limited to the state and callbacks the view needs.
  Split components by responsibility, not by an arbitrary line count.

## Checks

Run `npm run build --prefix client`, `npm run lint --prefix client`, and
`npm run test:transport --prefix tools` from the repository root.
With the app, server, and database running, run `npm run test:flow --prefix tools`.
`npm run test:refactor --prefix tools` additionally requires the AI worker and
checks real translation, drafts, locale/theme changes, and room isolation.
Browser tests create isolated listings and remove their own data.
Do not use older recording/chat-reset scripts against conversations in use.
