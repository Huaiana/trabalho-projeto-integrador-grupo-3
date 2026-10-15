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

- Cargo uses a model for validation, a repository for HTTP, a service for business orchestration, and a controller hook consumed by its panel; each layer has a single responsibility.
- Cargo API reads run in the browser through React Query, not SSR loaders, because the user's localhost API is reachable only from their own browser.
