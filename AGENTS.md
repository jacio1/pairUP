# Working on PairUp

PairUp is a bilingual platform for finding study partners and collaborating in
study rooms. Read the [README](README.md) or [Russian README](README.ru.md) for
setup and the product overview.

## Where to look

| Area | Entry points |
| --- | --- |
| Web app | `client/src/app` for Next.js routes, `client/src/components` for feature UI, `client/src/lib` for client state and API calls |
| API and realtime | `server/src` for NestJS feature modules, `server/src/realtime` for Socket.IO, `server/prisma` for the PostgreSQL schema and migrations |
| Chat | `client/src/components/chat` and `server/src/chat`. The existing connection hook owns socket setup and history synchronization |
| Accounts and study tools | `server/src/auth`, `server/src/profiles`, and `server/src/study-tools`. Related UI is grouped by feature |
| Neuron and calls | `server/src/ai` and `worker` for AI orchestration and local inference, `server/src/voice` and `client/src/components/voice` for LiveKit |

For frontend conventions, see [client/AGENTS.md](client/AGENTS.md) and the
[component guide](client/src/components/README.md).

## Project rules

- Add user-facing strings to both `client/messages/en.json` and
  `client/messages/ru.json`. Keep server error codes stable and translate them
  on the client.
- Enforce session identity, room membership, and ownership on the server for
  protected actions. Hiding a control in the UI does not authorize an action.
- Preserve room isolation, reconnect and history behavior, and message
  deduplication when changing chat or realtime code. Reuse the existing socket.
- Preserve unrelated working-tree changes. Stage only files that belong to the
  requested change. Treat pushing to GitHub and deploying the live site as
  separate actions.
- Keep credentials, production environment files, and local deployment
  overrides out of commits and tool output. Use the documented configuration
  and example environment files.

## Checks

Run the checks relevant to the change from the repository root:

- Client: `npm run lint --prefix client` and `npm run build --prefix client`.
- Server: `npm run build --prefix server` and `npm test --prefix server`.
- Chat transport: `node --test tools/chat-transport.test.mjs`.
- Auth and room integration: `npm run test:modules --prefix server` with
  `TEST_DATABASE_URL` pointing to a dedicated disposable PostgreSQL database
  whose name contains `test`.

Use a separate test room and accounts for chat checks. Clean up only the data
created by the test. Do not run the legacy `test:integration` script or old
chat-reset and recording scripts against the shared demo or any live room.

For deployment details, see [hosting](deploy/HOSTING.md),
[home hosting](deploy/HOME.md), and [LiveKit](deploy/VOICE.md).
