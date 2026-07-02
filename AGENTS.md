# Purpose

- Own the Expo React Native mobile app under `mobile/`.
- Keep mobile behavior, navigation, UI components, weather features, and Supabase integration understandable from this doc plus the root DOX contract.

## Ownership

- This doc governs `app/`, `components/`, `constants/`, `context/`, `hooks/`, `services/`, `utils/`, `assets/`, `reference/`, mobile package files, and Expo configuration.
- Generated dependency and build folders such as `node_modules/`, `.expo/`, and native build output are not durable source.

## Local Contracts

- Preserve the Expo Router structure under `app/`; route files define navigation surfaces.
- Keep shared visual choices in `constants/` and reusable UI in `components/`.
- Keep Supabase and API access in `services/` or `utils/`; do not hard-code secrets into components or routes.
- Treat `reference/` as visual/reference material, not active runtime code.

## Work Guidance

- Follow existing TypeScript, React Native, Expo, and context-provider patterns before adding new abstractions.
- Prefer reusing `DesignTokens`, `Colors`, shared touchable/loading/error components, and existing context providers.
- Keep mobile UI changes responsive across small Android and iOS screens.

## Verification

- Use the relevant existing Expo script for runtime checks: `npm run start`, `npm run android`, `npm run ios`, or `npm run web`.
- No automated mobile test or typecheck script is defined in `package.json` yet; document any manual verification performed.

## Child DOX Index

- No child `AGENTS.md` files are currently defined under `mobile/`.
