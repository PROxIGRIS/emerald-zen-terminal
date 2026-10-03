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
- Use a viewport-height flex workspace with an unframed expanding transcript and a bottom command composer so logs remain the main screen rather than a nested panel.
- This surface is a deterministic CLI terminal, not an AI conversation; preserve its native command form and log semantics instead of installing AI chat primitives.
