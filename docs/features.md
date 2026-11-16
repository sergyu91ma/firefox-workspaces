# Project Features: Slim Workspaces

This document details the core functionalities implemented in the Slim Workspaces extension.

## 1. Workspace Management
- **Creation:** Create new workspaces with custom names and colors.
- **Capture:** Convert the current unmanaged window into a new workspace with a single click.
- **Editing:** Rename or change the color of existing workspaces.
- **Deletion:** Permanent removal of workspaces with a safety confirmation modal.
- **Move Tabs to Workspace:** Right-click a tab and choose "Move tab to Workspace" to send it to another workspace (its window opens if needed). When several tabs are selected (Ctrl/Shift+click) and you right-click one of them, all selected tabs are moved together, keeping their order; the menu reads "Move N tabs to Workspace". If every tab of a window is moved, a new tab is left behind so the source workspace window stays open.

## 2. Session Persistence
- **Automatic Sync:** Real-time saving of tab changes (creation, movement, updates) within a workspace.
- **Startup Restore:** Reopens the most recently used (last focused) workspace when Firefox starts, falling back to the last closed one. If a new window is needed, the empty startup window is closed. If no workspace was used, Firefox starts normally.
- **Lazy Loading (Performance):** When restoring a workspace, background tabs are created in a "discarded" state. This prevents them from consuming memory or CPU until they are explicitly clicked, ensuring near-instant window restoration even for workspaces with 100+ tabs.
- **Tab Groups:** Support for Firefox's native tab groups (experimental) to maintain complex tab structures.
- **Enhanced Pin Support:** Robust restoration of pinned tabs that appear immediately fixed (no UI jumping), maintaining their state across sessions.
- **Multi-Account Containers:** Full support for [Firefox Multi-Account Containers](https://addons.mozilla.org/en-US/firefox/addon/multi-account-containers/). Workspaces remember which container (e.g., Personal, Work, Banking) each tab belongs to and restores them in the correct context automatically.

## 3. Advanced UI/UX
- **Dynamic Icons:** Integration with Heroicons using a CSS Mask system for `currentColor` support.
- **Dynamic Toolbar Icon:** The extension's main toolbar icon automatically changes color to match the active workspace in the current window. This provides immediate visual context without opening the popup.
- **Window Coloring:** Like Microsoft Edge, each workspace window's tab strip and toolbar are tinted with the workspace color, and the selected tab gets an accent line in that color. It follows the system light/dark mode, leaves unmanaged windows untouched, and can be turned off from the popup menu ("Color browser windows"). Note: while enabled it replaces any installed Firefox theme in workspace windows.
- **Active Identification:** A prominent "Pill" indicator in the popup header shows the active workspace name with its associated color.
- **State Indicators:** Visual badges for "Open" workspaces that are currently in other windows.
- **Tab Count:** Each workspace in the popup shows how many tabs it has (e.g. "12 tabs") under its name, similar to Microsoft Edge. Open workspaces use the live window count; closed ones use the saved tabs.
- **Reorder Mode:** A toggleable mode to reorganize the workspace list with drag-and-drop handles.

## 4. Data Portability
- **Export:** Download all workspace data as a structured JSON backup.
- **Destructive Restore:** A "Legacy Style" import feature that replaces the current state with a backup file, ensuring data consistency as a "Single Source of Truth".
