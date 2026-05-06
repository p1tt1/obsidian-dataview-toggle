# Dataview Toggle

A minimal [Obsidian](https://obsidian.md) plugin that lets you pause and resume [Dataview](https://github.com/blacksmithgu/obsidian-dataview)'s automatic refresh with one click or hotkey.

## Why?

When editing notes with Dataview queries (especially daily notes with task queries), every keystroke triggers Dataview to re-render its blocks. This causes jank and interrupts your typing flow. This plugin adds a quick toggle so you can pause auto-refresh while writing and resume when you're done.

## Usage

- **Status bar**: Click `DV: Auto` / `DV: Paused` in the bottom-right to toggle
- **Command palette**: Search "Dataview Toggle: Toggle auto-refresh"
- **Hotkey**: Assign a hotkey in Settings > Hotkeys > search "Dataview Toggle"

When you resume, Dataview immediately refreshes all views to catch up.

## Per-note override

You can override the global setting for individual notes by adding a `dataview-refresh` property to the note's frontmatter:

```yaml
---
dataview-refresh: false
---
```

Setting the property to `false` pauses auto-refresh whenever that note is open, regardless of the global setting. Setting it to `true` forces auto-refresh on, even when the global setting is paused. Omitting the property entirely means the note follows the global setting.

The override is temporary. When you navigate away from the note, the global setting is restored. If you manually toggle while on an overriding note, that becomes the new global setting and the note's override is cleared for that visit.

## Requirements

- [Dataview](https://github.com/blacksmithgu/obsidian-dataview) plugin must be installed and enabled

## Installation

### Via BRAT (beta)

1. Install [BRAT](https://github.com/TfTHacker/obsidian42-brat) from Community Plugins
2. Open the command palette and run `BRAT: Add a beta plugin for testing`
3. Enter `p1tt1/obsidian-dataview-toggle`
4. Click "Add Plugin", then enable the plugin in Settings > Community plugins

### From Community Plugins (once published)

1. Open Settings > Community plugins > Browse
2. Search "Dataview Toggle"
3. Install and enable

### Manual

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/p1tt1/obsidian-dataview-toggle/releases)
2. Create a folder `dataview-toggle` in your vault's `.obsidian/plugins/` directory
3. Copy the downloaded files into that folder
4. Enable the plugin in Settings > Community plugins
