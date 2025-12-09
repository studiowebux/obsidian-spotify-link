---
title: Obsidian Spotify Link
description: Obsidian plugin to include the currently playing song or podcast in your notes with template support
tags:
  - obsidian
  - spotify
  - plugin
  - music
  - podcast
---

# Obsidian Spotify Link

Obsidian plugin that integrates Spotify API to insert currently playing tracks and podcasts into notes using customizable templates.

## Features

- Connect Spotify account via OAuth
- Insert currently playing track/episode at cursor position
- Create dedicated files for tracks/episodes
- Fetch recently played tracks (current day)
- Template support for inline and file-based templates
- Support for both songs and podcasts
- Customizable variable substitution system

## Quick Start

1. Create Spotify App at [developer.spotify.com](https://developer.spotify.com/dashboard/)
2. Configure Client ID and Secret in plugin settings
3. Set Redirect URI to `obsidian://spotify-auth/`
4. Click Spotify icon in sidebar to authenticate
5. Use commands to insert tracks

## Core Commands

### Append to Current Note

- `Append Spotify currently playing track` - Insert track with timestamp
- `Append Spotify currently playing track using template` - Insert using custom template
- `Append Spotify currently playing episode` - Insert podcast with timestamp
- `Append Spotify currently playing episode using template` - Insert podcast using template

### Create New Files

- `Create file for currently playing track` - New file with basic info
- `Create file for currently playing track using template` - New file with template
- `Create file for currently playing episode` - New file for podcast
- `Create file for currently playing episode using template` - Template-based podcast file
- `Create file for recently played tracks using template` - Daily listening history

### Session Management

- `Refresh session` - Manually refresh access token

## Documentation

- [Architecture](architecture.md)
- [Configuration](configuration.md)
- [Templates](templates.md)
- [API Integration](api.md)

## Links

- [GitHub Repository](https://github.com/studiowebux/obsidian-spotify-link)
- [Official Documentation](https://studiowebux.github.io/obsidian-plugins-docs/docs/category/plugin-spotify-link)
