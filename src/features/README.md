# features/

Reserved for feature modules — one folder per business capability, each
bundling its own components, hooks, and API-calling logic together
(e.g. `features/workshops/`, `features/registrations/`, `features/admin/`).

Nothing lives here yet. This directory stays empty until Phase 3
(Registration) and Phase 4 (Admin) introduce real feature logic. Generic,
reusable UI belongs in `components/ui` instead — only put something here
once it's specific to a business feature.
