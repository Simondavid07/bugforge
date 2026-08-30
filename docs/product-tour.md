# BugForge product tour

This page documents the implemented interface through four user-provided screenshots. The images are preserved in [`docs/assets/product-tour/`](assets/product-tour/) so the visual evidence travels with the GitHub repository and remains reviewable beside the source. The screenshots show the Overview, Workboard, and Insights surfaces in both light and dark presentation states; they are product evidence, not fabricated customer data.

## How to read this tour

The product uses a correspondence-inspired editorial system: serif display type establishes hierarchy, compact uppercase labels identify context, and restrained color accents distinguish workflow states. The screenshots show empty-state data because the captured workspace contains no active issues. That is an honest state of the product and should not be interpreted as a claim about production usage or team performance.

| Screen | Route / entry point | What it demonstrates | Primary implementation |
| --- | --- | --- | --- |
| Overview — dark | `/` after authentication | Workspace orientation, project selection, quick find, new-issue entry, status summary, and personalized shell | [`client/src/pages/Home.tsx`](../client/src/pages/Home.tsx), [`client/src/components/DashboardLayout.tsx`](../client/src/components/DashboardLayout.tsx) |
| Overview — light | `/` after authentication | Light-theme contrast, pastel status surfaces, project accent language, and the same information hierarchy | [`client/src/pages/Home.tsx`](../client/src/pages/Home.tsx), [`client/src/index.css`](../client/src/index.css) |
| Workboard — light | `/boards` | Five-stage issue workflow from Intake through Done, with calm empty lanes and visible next-action framing | [`client/src/pages/Boards.tsx`](../client/src/pages/Boards.tsx), [`drizzle/schema.ts`](../drizzle/schema.ts) |
| Insights — dark | `/insights` | Project-health summary, severity mix, release attention, and aging lanes with dark-theme contrast | [`client/src/pages/Analytics.tsx`](../client/src/pages/Analytics.tsx), [`server/routers.ts`](../server/routers.ts) |

## Overview — dark appearance

![BugForge Overview in dark appearance](assets/product-tour/overview-dark.png)

**What the screen proves:** the authenticated workspace opens into a focused Overview rather than a generic admin console. The persistent sidebar exposes Workboard, Issues, Overview, Insights, and Inbox; the header provides Quick find and New issue actions; and the hero panel gives the selected project a concise operational context. The dark treatment uses deep ink surfaces with readable pastel workflow cards and a visible Personalize control.

**Relevant behavior:** the Quick find control opens the keyboard command palette, New issue begins the issue-creation path, Open issues enters the Issue Explorer, and Personalize exposes theme, motion, project accent, ordering, and image settings. These interactions are implemented in the workspace shell and personalization components rather than being image-only decoration.

## Overview — light appearance

![BugForge Overview in light appearance](assets/product-tour/overview-light.png)

**What the screen proves:** the same Overview information architecture remains intact in the light theme. The paper background, warm surfaces, yellow open-issue card, rose release-blocker card, sage closed-recently card, and dark ink typography create a high-contrast alternative without changing the workflow vocabulary. This demonstrates theme preference as a presentation layer rather than a separate product mode.

**Design note:** the color treatment is semantic: each status card has a purpose and a readable label, while the selected project accent appears in the surrounding shell and project context. Empty values are shown as zero because the supplied capture contains no issues; no reviews, ratings, or testimonials are implied.

## Workboard — light appearance

![BugForge Workboard in light appearance](assets/product-tour/workboard-light.png)

**What the screen proves:** Workboard turns the issue lifecycle into a spatial decision surface. The five visible lanes are **Intake**, **Triage**, **In progress**, **Verify**, and **Done**, matching the status vocabulary defined in the typed schema. Each lane has a count, an explanatory empty state, and a distinct pastel cue that supports scanning without replacing the text label.

**Workflow connection:** this screen is the visual counterpart to the lifecycle graph in [`visuals.md`](visuals.md). The graph explains allowed transitions and authorization; the Workboard screenshot shows how those states are presented to a team member making the next decision.

## Insights — dark appearance

![BugForge Insights in dark appearance](assets/product-tour/insights-dark.png)

**What the screen proves:** Insights provides a project-health reading layer instead of only listing issues. The screen separates open issues, resolved work, and release attention at the top, then presents severity mix and aging lanes below. The copy deliberately frames analytics as conversation support—“Use patterns to guide a conversation, not replace one”—rather than claiming predictive certainty.

**Data interpretation:** the captured zero values are an empty workspace state. The UI demonstrates the layout, hierarchy, and metric definitions; it is not evidence of throughput, quality, or release performance. The underlying analytics procedures and aggregation logic are documented in [`docs/architecture.md`](architecture.md) and implemented through the typed server router.

## Theme and accessibility evidence

The pair of Overview captures makes the theme system reviewable: the light version uses paper and warm surfaces, while the dark version uses deep ink and high-contrast text. Both retain the same navigation order, action placement, labels, and project context. This is important for accessibility because a theme change should not require relearning the product or remove the semantic text that explains a colored state.

The interface also preserves keyboard reachability through the command palette and visible focus treatments, supports reduced-motion preferences, and keeps the custom cursor enhancement desktop-only. The visual evidence should therefore be read together with [`docs/security.md`](security.md), [`docs/testing.md`](testing.md), and the source-level accessibility behavior in the component tree.

## Screenshot evidence and limitations

| Evidence property | Documentation statement |
| --- | --- |
| Source | Screenshots supplied by the project owner for repository documentation. |
| Coverage | Overview dark, Overview light, Workboard light, and Insights dark. |
| Captured data state | Empty issue workspace with zero-valued summary cards and lanes. |
| Intended use | Product-tour evidence for evaluators and maintainers. |
| Not established by the screenshots | Production traffic, team productivity, issue quality, customer satisfaction, or system performance. |

For the structural view of authentication, persistence, authorization, Storage, deployment, and rollback, continue to [`visuals.md`](visuals.md). For a guided evaluator sequence, use [`demo-script.md`](demo-script.md).
