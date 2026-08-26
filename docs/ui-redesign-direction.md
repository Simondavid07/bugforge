# BugForge UI Redesign Direction

## North star

BugForge should feel like a focused engineering command center that teams want to return to. The interface must trade hard visual noise for **quiet confidence**, tactile responsiveness, and clear momentum. It should make an engineer feel informed in the first second, rewarded when they act, and never overwhelmed while scanning a busy project.

## Visual language

The replacement direction is **midnight glass + signal energy**. The workspace uses a near-black ink background with layered navy panels, faint radial glows, translucent surfaces, precise one-pixel boundaries, and restrained shadows. Electric coral becomes the primary action color; mint communicates healthy or complete states; amber communicates attention; violet marks intelligence and selection. Typography uses a refined grotesk for reading and a compact mono face only for issue keys, timestamps, and system metadata.

| Element | Redesign decision | Intended effect |
| --- | --- | --- |
| Layout | Slim floating rail, generous content canvas, command-style top bar | Higher focus and less dashboard density |
| Surface | Soft-radius panels, low-contrast borders, layered translucent backgrounds | Premium depth without visual clutter |
| Interaction | 160–240ms motion, hover elevation, pressed scale, clear progress feedback | Responsive, rewarding controls |
| Hierarchy | Large concise titles, muted operational metadata, meaningful color chips | Faster scanning and better decision confidence |
| Data | Small visual summaries, progressive disclosure, intentional empty states | The experience feels alive even before data accumulates |

## Interaction principles

All high-frequency interactions should be effectively instant while retaining a tactile result. Buttons and cards use transform and opacity transitions only, respect `prefers-reduced-motion`, and preserve visible keyboard focus. The most important actions—creating an issue, moving an issue, posting a comment, applying an AI draft, and uploading evidence—need explicit pending and success feedback. The application should never equate visual polish with automatic AI action: review remains visible and mandatory.
