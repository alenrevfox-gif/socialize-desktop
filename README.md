# Socialize for Windows

Socialize is an open-source desktop workspace for Windows. Pick Instagram, X, Telegram, YouTube, Facebook, Reddit, LinkedIn, Threads, or a custom HTTPS website from the sidebar; the site opens in the main Socialize window.

## Run from source

Install Node.js 22.12 or newer and pnpm, then run:

```powershell
pnpm install
pnpm start
```

To build a single-file Windows app that needs no installation:

```powershell
pnpm dist:win
```

The portable executable is written to `release/`. It can be launched directly and keeps its profile on this PC. Use `pnpm installer:win` to build an installer, or `pnpm pack:win` to create an unpacked Windows app for local use.

## Free code signing for Windows

Socialize is MIT-licensed. The planned free signing route is the [SignPath Foundation open-source program](https://signpath.org/). Signing is not active yet: the Foundation requires a public source repository and an already released build, and approval is required before it issues a signing certificate. The first public release would therefore be unsigned. SignPath also requires a project code-signing policy and a GitHub-hosted release workflow.

The workflow in `.github/workflows/release-windows.yml` builds Socialize on a GitHub-hosted Windows runner. Before SignPath approval, it publishes a clearly named unsigned archive, which is needed for the initial release and application. After the project is accepted, configure the approved SignPath project settings and set the repository variable `SIGNPATH_READY` to `true`; tagged releases will then be signed before publication. Configure SignPath's artifact format against a sample workflow artifact and sign Socialize's own executable while preserving signatures on third-party files.

- Secret: `SIGNPATH_API_TOKEN`
- Variables: `SIGNPATH_ORGANIZATION_ID`, `SIGNPATH_PROJECT_SLUG`, `SIGNPATH_SIGNING_POLICY_SLUG`, and `SIGNPATH_ARTIFACT_CONFIGURATION_SLUG`

To get started, publish the source repository and an initial release, then apply through the [SignPath Foundation application](https://signpath.org/apply.html). Review its [eligibility terms](https://signpath.org/terms.html) first. They require an actively maintained open-source project, a release, and a public code-signing policy. Do not add SignPath tokens to source files or commit them to Git.

### Code signing policy

**Status:** Socialize has not yet been accepted into the SignPath Foundation program. Current downloads are unsigned.

If accepted, the official Windows release will state: “Free code signing provided by SignPath.io, certificate by SignPath Foundation.” Only release artifacts built by the GitHub Actions workflow in this repository will be submitted for signing.

- **Authors and reviewers:** [alenrevfox-gif](https://github.com/alenrevfox-gif), the current project maintainer.
- **Approver:** [alenrevfox-gif](https://github.com/alenrevfox-gif), the current project maintainer.
- **Privacy:** Socialize stores its profile and preferences locally. It contacts social websites when the user opens and uses them; it does not upload profile data to a Socialize server. “This program will not transfer any information to other networked systems unless specifically requested by the user or the person installing or operating it.”

## Sign-ins and privacy

Socialize uses a separate persistent Chromium session for each website. Sign in to a service once inside the app; its session cookies and site data stay on this PC across restarts. Socialize never reads or stores passwords. Use **Clear saved sign-ins** in the sidebar to remove saved website cookies and local site data. Social-site sign-in persistence is controlled by each site; some services may still ask you to sign in again.

Your Socialize profile and sidebar preferences stay in the app's local storage. They are not uploaded to a Socialize server. The social services themselves receive the data you submit to them when you use their sites.

## Desktop features

- Native Windows window with resizable social content area
- Independent saved sign-in sessions per social service
- Sidebar collapse, service switching, and custom HTTPS shortcuts
- Back, forward, reload, and open in the system browser controls
- Site permission requests use a native Allow / Block prompt

## Security

Social sites run in sandboxed Electron `WebContentsView`s with Node integration disabled. The local workspace uses context isolation and a restricted preload bridge. Only HTTPS social pages can be opened inside the desktop content area. Electron currently uses its recommended `WebContentsView` embedding API rather than the deprecated `<webview>` tag.

## License

MIT. See [LICENSE](LICENSE).



