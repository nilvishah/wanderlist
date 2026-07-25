# Wanderlist

A personal travel wishlist app — places I want to visit, sorted into
categories, each with a lightweight checklist. Paired with a rotating
slideshow widget on iPhone (Scriptable) and Mac (Übersicht) that cycles
through starred places.

## Structure
- `app/` — the web app (built via Lovable), backed by Supabase
- `supabase/schema.sql` — database schema
- `widget-ios/` — Scriptable script for the iPhone home screen widget
- `widget-mac/` — Übersicht widget for the Mac desktop
- `docs/` — the original build prompts used to generate the app and widget