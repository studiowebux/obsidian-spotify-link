<div align="center">

<h2>Obsidian.md - Spotify Plugin</h2>

<p>Obsidian.md Plugin to include the song or podcast you're currently listening to in your note.</p>
<p>Fetch daily history of played tracks.</p>

<p align="center">
  <a href="https://github.com/studiowebux/obsidian-spotify-link/issues">Report Bug</a>
  ·
  <a href="https://github.com/studiowebux/obsidian-spotify-link/issues">Request Feature</a>
  ·
  <a href="https://discord.gg/KZ34mhTWZR">Discord Support</a>
</p>

</div>

---

## About

- **Spotify Account Integration**: Users can connect their Spotify accounts using the official Spotify API. This enables the plugin to access their **_current playing information_**.
- **Song/Podcast Insertion Shortcut**: With a simple snippet or shortcut, users can add the currently playing song from their Spotify account into the cursor position of their document. This feature simplifies the task of connecting music and creative thoughts.
- **Custom Template**: Create your template to add the currently playing song in your notes.
- **Supports**: Songs and podcasts.
- **Fetch all played tracks for the day**: Works only for the current day, fetch tracks from the beginning of the day.

---

## Installation and Usage

[Full Documentation is available here](https://studiowebux.github.io/obsidian-plugins-docs/docs/category/plugin-spotify-link)

---

## Screenshots

[See Screenshot here](https://studiowebux.github.io/obsidian-plugins-docs/docs/spotify-link/features)

---

### Releases and Github Actions

```bash
git tag -a X.Y.Z -m "Version X.Y.Z"
git push origin tags/X.Y.Z
```

---

## Contributing

1. Create a Feature Branch
2. Commit your changes
3. Push your changes
4. Create a PR

<details>
<summary>Working with your local branch</summary>

**Branch Checkout:**

```bash
git checkout -b <feature|fix|release|chore|hotfix>/prefix-name
```

> Your branch name must starts with [feature|fix|release|chore|hotfix] and use a / before the name;
> Use hyphens as separator;
> The prefix correspond to your Kanban tool id (e.g. abc-123)

**Keep your branch synced:**

```bash
git fetch origin
git rebase origin/master
```

**Commit your changes:**

```bash
git add .
git commit -m "<feat|ci|test|docs|build|chore|style|refactor|perf|BREAKING CHANGE>: commit message"
```

> Follow this convention commitlint for your commit message structure

**Push your changes:**

```bash
git push origin <feature|fix|release|chore|hotfix>/prefix-name
```

**Examples:**

```bash
git checkout -b release/v1.15.5
git checkout -b feature/abc-123-something-awesome
git checkout -b hotfix/abc-432-something-bad-to-fix
```

```bash
git commit -m "docs: added awesome documentation"
git commit -m "feat: added new feature"
git commit -m "test: added tests"
```

</details>

### Local Development

```bash
npm install
npm run build
```

## License

Distributed under the MIT License. See LICENSE for more information.

## Contact

-   Tommy Gingras @ tommy@studiowebux.com | Studio Webux

<div>
<b> | </b>
<a href="https://www.buymeacoffee.com/studiowebux" target="_blank"
      ><img
        src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
        alt="Buy Me A Coffee"
        style="height: 30px !important; width: 105px !important"
/></a>
<b> | </b>
<a href="https://webuxlab.com" target="_blank"
      ><img
        src="https://webuxlab-static.s3.ca-central-1.amazonaws.com/logoAmpoule.svg"
        alt="Webux Logo"
        style="height: 30px !important"
/> Webux Lab</a>
<b> | </b>
</div>
