# Tauri Build & Release Guide

This guide explains how to build a production binary for the Nord Dashboard and how to package it for future releases.

## Prerequisites

Ensure you have the following installed (which you likely do if you are reading this):

- Node.js & npm
- Rust & Cargo (via your `rusticed` devshell)
- System dependencies (Linux: `libwebkit2gtk-4.0-dev`, `build-essential`, `curl`, `wget`, `file`, `libssl-dev`, `libgtk-3-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`)

> **Update**: We have migrated the project to use local Tailwind CSS (v4) instead of CDNs. This ensures the app looks correct when running as a standalone binary without internet or when CDNs are blocked.

## Building the Application

To create a production build (standalone binary):

1.  **Enter the Nix environment**:
    Since a `flake.nix` has been added to the project root, you can use:

    ```bash
    nix develop
    ```

    Or run the build command directly inside the environment:

    ```bash
    nix develop --command npm run tauri build
    ```

2.  **Run the build command** (if inside the shell):
    ```bash
    npm run tauri build
    ```
    This command does the following:
    - Builds your frontend (Vite build) -> outputs to `dist/`
    - Compiles the Rust backend -> outputs to `src-tauri/target/release/`
    - Bundles everything into a binary / package (deb, appimage, etc.)

## Locating the Output

Once the build completes successfully, you will find the artifacts in:

```
src-tauri/target/release/bundle/
```

- **Debian Package**: `src-tauri/target/release/bundle/deb/nord-dashboard_0.1.0_amd64.deb`
- **RPM Package**: `src-tauri/target/release/bundle/rpm/nord-dashboard-0.1.0-1.x86_64.rpm`
- **Raw Binary**: `src-tauri/target/release/app` (You can rename this to `nord-dashboard`)

> **Note**: AppImage generation might fail inside the Nix environment due to `fuse` limitations. This is normal. The `.deb`, `.rpm`, and raw binary should still be created successfully.

## Creating a New Release

When you have made changes and want to release a new version:

1.  **Update Version**:

    - Open `src-tauri/tauri.conf.json`
    - Update the `"version": "0.1.0"` field to your new version (e.g., `"0.1.1"`).
    - Open `package.json` and update the version there as well.

2.  **Rebuild**:
    Run `npm run tauri build` again.

3.  **Distribute**:
    Take the generated `.AppImage` or `.deb` file and upload it to GitHub Releases or share it.

## Nixifying (Future Steps)

To make this portable via Nix flakes:

1.  You will create a `flake.nix` that defines a package for this app.
2.  The flake will use `rustPlatform.buildRustPackage` or `crane` to build the Rust part, and `buildNpmPackage` for the frontend.
3.  You can then run `nix build` to get the result in `result/bin/`.

For now, the manual `npm run tauri build` inside your `rusticed` shell is the way to go!
