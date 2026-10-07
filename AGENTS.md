<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Terminal architecture
- Keep the uploaded terminal command registry and executor callback in the terminal module; privileged execution remains the host application's responsibility.
- Define terminal visuals and theme tokens in src/styles.css; both themes share the same composition.
- Keep the command composer stacked with text above its accessory toolbar and contextual suggestions above it; use shared semantic tokens so both themes retain the same control hierarchy.
- Use a viewport-height centered workspace with an expanding glass terminal and a separate bottom command composer, following the selected prismatic design while keeping logs primary.
- Serve uploaded theme artwork directly from public/ and select its root-relative URL with the terminal theme so both images load without a CDN dependency.
- This surface is a deterministic CLI terminal, not an AI conversation; preserve its native command form and log semantics instead of installing AI chat primitives.
- Keep the extracted mobile dock in MobileTerminalDock with terminal callbacks, not host-only routes; reserve its own flex row and hide it for the visual-viewport keyboard so navigation cannot cover the composer.
- Implement entrance motion with CSS clipping rather than changing layout height; disable decorative motion for reduced-motion users so the transcript and mobile composer remain stable and usable.
