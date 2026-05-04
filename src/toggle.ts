export interface PausableDv {
	debouncedRefresh: () => void;
	updateRefreshSettings: () => void;
	index: { revision: number };
}

export function applyPause(dv: PausableDv): void {
	const noop = () => {};
	const orig = dv.updateRefreshSettings.bind(dv);
	(dv as unknown as Record<string, unknown>)["_origUpdateRefreshSettings"] = orig;
	dv.updateRefreshSettings = () => {
		orig();
		dv.debouncedRefresh = noop;
	};
	dv.debouncedRefresh = noop;
}

export function applyResume(dv: PausableDv, triggerRefresh: () => void): void {
	const dvAny = dv as unknown as Record<string, unknown>;
	const stored = dvAny["_origUpdateRefreshSettings"] as (() => void) | undefined;
	if (stored) {
		dv.updateRefreshSettings = stored;
		delete dvAny["_origUpdateRefreshSettings"];
	}
	dv.updateRefreshSettings();
	dv.index.revision += 1;
	triggerRefresh();
}

export function toggleRefreshState(currentState: boolean): boolean {
	return !currentState;
}

export function statusBarText(refreshEnabled: boolean): string {
	return refreshEnabled ? "DV: Auto" : "DV: Paused";
}

export function noticeText(refreshEnabled: boolean): string {
	return refreshEnabled
		? "Dataview auto-refresh enabled"
		: "Dataview auto-refresh paused";
}

export function isApplied(dv: PausableDv): boolean {
	return (dv as unknown as Record<string, unknown>)["_origUpdateRefreshSettings"] !== undefined;
}

export function getFrontmatterOverride(
	frontmatter: Record<string, unknown> | undefined
): boolean | null {
	if (frontmatter === undefined) return null;
	const value = frontmatter["dataview-refresh"];
	if (typeof value !== "boolean") return null;
	return !value; // false in frontmatter → paused (true); true → enabled (false)
}

