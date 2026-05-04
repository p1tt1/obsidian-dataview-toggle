import { Notice, Plugin } from "obsidian";
import {
	PausableDv,
	toggleRefreshState,
	statusBarText,
	noticeText,
	applyPause,
	applyResume,
	isApplied,
	getFrontmatterOverride,
} from "./toggle";

interface DataviewPlugin extends PausableDv {
	updateSettings(settings: Record<string, unknown>): Promise<void>;
}

const getDataviewPlugin = (app: { plugins?: { plugins?: Record<string, unknown> } }): DataviewPlugin | null => {
	const dv = app.plugins?.plugins?.["dataview"] as DataviewPlugin | undefined;
	if (
		!dv ||
		typeof dv.debouncedRefresh !== "function" ||
		typeof dv.updateRefreshSettings !== "function" ||
		typeof dv.index?.revision !== "number"
	) {
		return null;
	}
	return dv;
};

export default class DataviewTogglePlugin extends Plugin {
	private statusBarEl: HTMLElement | null = null;
	private isPaused = false;
	private globalIsPaused = false;
	private noteOverrideActive = false;

	async onload(): Promise<void> {
		this.statusBarEl = this.addStatusBarItem();
		this.statusBarEl.addClass("dataview-toggle-status");
		this.registerDomEvent(this.statusBarEl, "click", () => this.toggle());
		this.syncStatusBar();

		this.addCommand({
			id: "toggle-auto-refresh",
			name: "Toggle auto-refresh",
			callback: () => this.toggle(),
		});

		this.registerEvent(
			this.app.workspace.on("file-open", (file) => this.onFileOpen(file))
		);
	}

	onunload(): void {
		// Use isPaused (effective state), not globalIsPaused — we must restore
		// Dataview regardless of whether the current pause came from global or a note override.
		if (this.isPaused) {
			const dv = getDataviewPlugin(this.app as never);
			if (dv) applyResume(dv, () => {});
		}
	}

	private async toggle(): Promise<void> {
		const dv = getDataviewPlugin(this.app as never);
		if (!dv) {
			new Notice("Dataview plugin is not available");
			return;
		}

		this.isPaused = toggleRefreshState(this.isPaused);
		this.globalIsPaused = this.isPaused;
		this.noteOverrideActive = false;

		if (this.isPaused) {
			applyPause(dv);
		} else {
			applyResume(dv, () => this.app.workspace.trigger("dataview:refresh-views"));
		}

		this.syncStatusBar();
		new Notice(noticeText(!this.isPaused));
	}

	private onFileOpen(file: { path: string } | null): void {
		// Guard: ignore embed-triggered events (active file won't match).
		// Also silently drops events during workspace startup when getActiveFile()
		// returns null before the workspace is ready — this is intentional.
		const activeFile = (this.app.workspace as unknown as { getActiveFile(): { path: string } | null }).getActiveFile();
		if (file !== null && activeFile?.path !== file.path) return;

		const dv = getDataviewPlugin(this.app as never);
		if (!dv) return;

		// null file (no active note) → undefined frontmatter → getFrontmatterOverride returns null
		// → restores global state if an override was active
		const frontmatter = file
			? (this.app.metadataCache as unknown as {
					getFileCache(f: { path: string }): { frontmatter?: Record<string, unknown> } | null;
			  }).getFileCache(file)?.frontmatter
			: undefined;

		const override = getFrontmatterOverride(frontmatter);

		if (override !== null) {
			this.noteOverrideActive = true;
			this.isPaused = override;
		} else {
			if (this.noteOverrideActive) {
				this.noteOverrideActive = false;
				this.isPaused = this.globalIsPaused;
			}
		}

		if (this.isPaused && !isApplied(dv)) {
			applyPause(dv);
		} else if (!this.isPaused && isApplied(dv)) {
			applyResume(dv, () => this.app.workspace.trigger("dataview:refresh-views"));
		}

		this.syncStatusBar();
	}

	private syncStatusBar(): void {
		if (!this.statusBarEl) return;
		const isEnabled = !this.isPaused;
		this.statusBarEl.setText(statusBarText(isEnabled));
		this.statusBarEl.toggleClass("dataview-toggle-paused", !isEnabled);
	}
}
