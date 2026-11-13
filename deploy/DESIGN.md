# PairUp visual direction

## Brief and preserved behavior

A collaborative study product for students and independent learners, with the purple brain-octopus Neuron as its recognizable companion. Preserve RU/EN, light/dark, equal listing-card heights, mobile icon navigation without a mobile header, public profiles, existing authorization, real-time chat, notes/tasks and voice. No new sidebar, header language/settings controls or duplicate create button on Discover.

## First pass: compact system

Palette: Chalk `#F4F6FA` (light canvas), Paper `#FFFFFF` (editable/content surfaces), Ink `#17233E` (text), Iris `#6055D8` (brand/action), Pool `#DDF3EF` (technical/science subjects), Apricot `#FAE5CE` (other subjects). Revised dark palette: Graphite `#171719`, raised surfaces `#222225`, text `#ECEBED`, soft lilac `#B5A2F4`, muted text `#AEAAB6`, borders `#3B3941`. Dark surfaces are neutral instead of navy; light tokens are unchanged.

Type: locally hosted Manrope Variable, including Cyrillic; one family, clear roles. Expressive, closely spaced 44–52px Discover headline; 32–38px page titles; 18–20px listing titles; 14px body and 12px meaningful metadata. Left alignment, readable line lengths, no decorative all-caps labels.

Layout candidates:

```
A — study desk                 B — conventional SaaS banner
brand / navigation             brand / navigation
headline | Neuron workspace     gradient + centered headline
search / active filters         statistics / floating cards
listing directory               identical cards
```

Choose A: the primary job is finding an actual study partner, so the directory remains the main content. Neuron lives on a small ruled-paper study surface beside the headline. Course tabs and subject colors distinguish announcements. Profiles are personal study pages; the chat is a quiet workspace with clear tools, rather than another marketing screen.

## Review before implementation

Reject candidate B: a gradient banner and arbitrary statistics could fit any SaaS product. Remove the old tracked uppercase eyebrow, repeated decorative arrows, uniform shadows on every surface and gradient profile covers. Keep the user's explicit equal-height cards; make them useful through consistent text slots and anchored author/actions. Subject tint and the course tab encode discipline rather than decorating each card arbitrarily. Spend visual boldness on Neuron and typography, keep form and session controls restrained.

## Implementation principles

Use shadcn semantic variables and shared primitives; different radius roles (controls, cards, large panels), understated borders and intentional elevation only for overlays. Align metadata and controls, preserve visible focus, 44px mobile targets where practical, respect reduced motion. Interactions receive feedback; avoid autonomous floating/bouncing elements. Use real data and do not invent user counts, ratings, testimonials or active sessions. Capture and inspect representative desktop/mobile screens in both themes, then run existing integration scenarios.

Based on the installed `anthropics/skills/skills/frontend-design` skill. Font: Manrope, SIL Open Font License, bundled with the font asset.
