# Copilot instructions

## Project commands

Use Node.js 22.x and npm (the repository includes `package-lock.json`).

```bash
npm start
npm run build
npm run watch
npm test
```

Run one Jasmine spec file without starting watch mode:

```bash
npm test -- --include=src/app/path/to/feature.spec.ts --watch=false
```

Tests use Angular's Karma/Jasmine builder. There are currently no `*.spec.ts` files in `src`.

## Architecture

- This is an Angular 22 standalone application. `src/main.ts` bootstraps the root component with providers from `src/app/app.config.ts`; routes live in `src/app/app.routes.ts`.
- The root route tree puts dashboard pages inside `AppLayoutComponent` (sidebar, header, backdrop, and child router outlet). Sign-in, sign-up, and not-found pages are top-level routes outside that shell.
- `authGuard` gates the dashboard and checks optional route `data.roles`. `AuthService` owns the authenticated session and persists it in `sessionStorage`; `HttpAuthInterceptor` adds its bearer token to API requests and clears the session/redirects on HTTP 401. Keep session shape/key changes consistent across `AuthService`, the interceptor, and `UserService`.
- Feature pages compose standalone components from `src/app/shared/components`. API-facing services in `src/app/shared/services` use `HttpClient` and the base URL from `src/environments/environment*.ts`; keep request/response mapping at that boundary rather than embedding API calls in templates.
- Shared `ThemeService`, `SidebarService`, and `ModalService` expose reactive state with RxJS `BehaviorSubject`s. Theme and RTL preferences also update document-level state; RTL is restored by the root component and toggled by the user menu.
- Tailwind CSS v4 is configured in `src/styles.css` with `@theme` design tokens and global third-party overrides. Extend those tokens/utilities rather than introducing a Tailwind v3 config.

## Repository conventions

- Components are standalone and explicitly list their template dependencies in `imports`. Templates use Angular's built-in control flow (`@if`, `@for` with a `track` expression, and `@switch`), not structural `*ngIf`/`*ngFor`.
- Register pages in `app.routes.ts` under the dashboard layout or at the root for auth/error views, and give routes a descriptive `title`. Dashboard pages follow the existing breadcrumb and component-card composition patterns.
- Keep dashboard UI aligned with the tokens and dark-mode classes in `src/styles.css`. Support both layout directions: prefer logical Tailwind utilities (`ms-*`, `start-*`, `border-s-*`, `text-start`) and use RTL-aware variants for directional icons.
- Preserve the existing English UI copy and avoid adding translation packages or translation pipes.
- Role-gated routes declare allowed roles in route `data.roles`; shared role checks use the `UserRole` type from `UserService`.
