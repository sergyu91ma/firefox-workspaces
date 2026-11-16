/**
 * Context Menus Manager
 * Handles creating and updating the "Move to Workspace" menu.
 */

const MenusManager = {
    ROOT_ID: 'move-to-workspace-root',
    workspaceMenuIds: new Set(),
    rootCreated: false,

    async ensureRootMenu() {
        if (this.rootCreated) return;

        try {
            browser.menus.create({
                id: this.ROOT_ID,
                title: 'Move tab to Workspace',
                contexts: ['tab']
            });
            this.rootCreated = true;
        } catch (error) {
            if (!String(error).includes('ID already exists')) {
                throw error;
            }
            this.rootCreated = true;
        }
    },

    /**
     * Initializes the context menu items.
     * Idempotent-ish (recreates items).
     */
    async init() {
        // Create/Recreate root menu
        // We remove all first to ensure clean slate
        await browser.menus.removeAll();

        this.workspaceMenuIds.clear();
        this.rootCreated = false;
        await this.ensureRootMenu();

        await this.updateSubmenus();
    },

    /**
     * Rebuilds the list of workspaces in the menu.
     */
    async updateSubmenus() {
        await this.ensureRootMenu();

        const workspaces = await StorageService.getWorkspaces();
        const nextWorkspaceIds = new Set(workspaces.map(ws => ws.id));

        for (const existingId of this.workspaceMenuIds) {
            if (!nextWorkspaceIds.has(existingId)) {
                try {
                    await browser.menus.remove(existingId);
                } catch (error) {
                    console.error(`Menus: Failed to remove menu item ${existingId}`, error);
                }
            }
        }

        this.workspaceMenuIds = new Set([...this.workspaceMenuIds].filter(id => nextWorkspaceIds.has(id)));

        for (const ws of workspaces) {
            if (!this.workspaceMenuIds.has(ws.id)) {
                try {
                    browser.menus.create({
                        id: ws.id,
                        parentId: this.ROOT_ID,
                        title: ws.name,
                        contexts: ['tab']
                    });
                    this.workspaceMenuIds.add(ws.id);
                } catch (error) {
                    console.error(`Menus: Failed to create menu item ${ws.id}`, error);
                }
            } else {
                try {
                    await browser.menus.update(ws.id, { title: ws.name });
                } catch (error) {
                    console.error(`Menus: Failed to update menu item ${ws.id}`, error);
                }
            }
        }
    },

    /**
     * Returns the tabs the context-menu action applies to: every selected
     * (highlighted) tab in the window when the clicked tab is part of the
     * selection, otherwise only the clicked tab. Mirrors Firefox's own
     * "Move Tab" behavior.
     */
    async getTabsForAction(tab) {
        if (!tab) return [];
        if (!tab.highlighted) return [tab];

        try {
            const selected = await browser.tabs.query({ windowId: tab.windowId, highlighted: true });
            return selected.length > 0 ? selected : [tab];
        } catch (error) {
            console.error('Menus: Failed to query selected tabs', error);
            return [tab];
        }
    },

    /**
     * Updates the root menu title with the number of tabs that will be moved.
     */
    async handleShown(info, tab) {
        if (!info.contexts || !info.contexts.includes('tab')) return;

        const tabs = await this.getTabsForAction(tab);
        const title = tabs.length > 1
            ? `Move ${tabs.length} tabs to Workspace`
            : 'Move tab to Workspace';

        try {
            await browser.menus.update(this.ROOT_ID, { title });
            browser.menus.refresh();
        } catch (error) {
            console.error('Menus: Failed to update root menu title', error);
        }
    },

    /**
     * Moves the clicked tab, or all selected tabs, to the target workspace window.
     */
    async handleMove(tab, workspaceId) {
        const tabsToMove = await this.getTabsForAction(tab);
        if (tabsToMove.length === 0) return;

        Logger.debug(`Menus: Moving ${tabsToMove.length} tab(s) to workspace ${workspaceId}`);

        const sourceWindowId = tab.windowId;

        // 1. Ensure target window is open
        await WorkspaceManager.openWorkspace(workspaceId);
        
        // Give a tiny buffer for window registration if it was just created
        await new Promise(r => setTimeout(r, 300));

        // 2. Get the new windowId
        const workspaces = await StorageService.getWorkspaces();
        const ws = workspaces.find(w => w.id === workspaceId);
        if (!ws || !ws.windowId || ws.windowId === sourceWindowId) return;

        try {
            // 3. Keep the source window alive when every tab is moved out of it.
            // A closing window skips auto-save, which would leave the moved tabs
            // duplicated in the source workspace's stored state.
            const sourceTabs = await browser.tabs.query({ windowId: sourceWindowId });
            if (sourceTabs.length <= tabsToMove.length) {
                await browser.tabs.create({ windowId: sourceWindowId, active: true });
            }

            // 4. Move tabs, preserving their order (pinned tabs first, as Firefox requires)
            const orderedIds = tabsToMove
                .slice()
                .sort((a, b) => a.index - b.index)
                .map(t => t.id);

            await browser.tabs.move(orderedIds, { windowId: ws.windowId, index: -1 });

            const focusTabId = orderedIds.includes(tab.id) ? tab.id : orderedIds[0];
            await browser.tabs.update(focusTabId, { active: true });
        } catch (error) {
            console.error('Menus: Error moving tabs', error);
        }
    }
};

// --- Register Listeners ONCE at top level ---
browser.menus.onShown.addListener((info, tab) => {
    MenusManager.handleShown(info, tab);
});

browser.menus.onClicked.addListener((info, tab) => {
    if (info.parentMenuItemId === MenusManager.ROOT_ID) {
        MenusManager.handleMove(tab, info.menuItemId);
    }
});
