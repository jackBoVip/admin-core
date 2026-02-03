 # Style And Animation Unification
 
 This note documents the unification of shared style, animation, and utility
 layers across `@admin-core/preferences` and `@admin-core/layout`.
 
 ## Goals
 
 - Single source of truth for global animation timing, easing, and z-index.
 - One set of transition class names for page and component transitions.
 - Shared scrollbar utilities and variables, with consistent behavior.
 
 ## What Changed
 
 - Global variables are now sourced from `@admin-core/preferences/styles`:
   - `--admin-duration-*`
   - `--admin-easing-*`
   - `--admin-z-index-*`
 - Page transitions use the `fade-*` classes from
   `packages/preferences/core/src/styles/css/animations.css`.
 - Scrollbar utilities (`scrollbar-thin`, `scrollbar-none`, `scrollbar-elegant`)
   and related variables live in
   `packages/preferences/core/src/styles/css/utilities.css` and
   `packages/preferences/core/src/styles/css/variables.css`.
 
 ## Layout Package Guidance
 
 - Layout keeps layout-specific sizing variables (header height, sidebar width,
   panel width, etc.).
 - Avoid reintroducing `layout-transition-*` or layout-specific transition
   durations; use `--admin-duration-*` instead.
 
 ## Example Update
 
 - Vue demo transitions now use `fade-slide`:
   - `examples/vue-demo/src/App.vue`
 
