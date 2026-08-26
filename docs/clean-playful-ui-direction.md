# BugForge Clean Playful UI Direction

## Product feel

BugForge should feel like the best version of an internal product: **clean enough to think in, playful enough to enjoy returning to**. The redesign rejects the dark command-console mood. It uses a warm porcelain canvas, a generous asymmetric layout, forest ink typography, soft mist-gray surfaces, and optimistic color moments that are earned by interactions rather than spread everywhere.

> The visual reference is a thoughtful modern productivity tool: editorial hierarchy, friendly rounded cards, a few expressive shapes, and interactions that make progress feel tangible.

## System

| Area | Design decision |
| --- | --- |
| Canvas | Warm off-white background with a barely visible paper grid and soft peach/lilac/mint washes. |
| Typography | Editorial serif display for major moments, neutral sans for product work, compact mono only for IDs and metadata. |
| Navigation | A light floating rail with an active “pill” and concise, high-contrast labels. |
| Surfaces | White cards with soft outlines, diffuse shadows, generous radii, and intentional asymmetry. |
| Color | Ink #18342C, coral #FF7164 for decisive actions, mint #A8E6CF for progress, lilac #DCCEFF for intelligence, lemon #FFF0A8 for attention. |
| Motif | Little “signal beads” and playful orbital dots that connect states, never compete with content. |

## Motion behavior

The experience uses slow, elegant page-entry motion and fast feedback motion. Sections emerge with a small upward translation and 40–70ms stagger; actionable controls respond in 160ms; cards lift only one or two pixels. A soft local radial highlight tracks the cursor on larger interactive surfaces, but it is disabled on touch devices and under `prefers-reduced-motion`. Scrolling remains native and smooth, with no scroll-jacking.
