import { describe, it, expect } from "vitest";
import {
	toggleRefreshState,
	statusBarText,
	noticeText,
	applyPause,
	applyResume,
	getFrontmatterOverride,
	type PausableDv,
} from "../toggle";

describe("toggleRefreshState", () => {
	it("flips true to false", () => {
		expect(toggleRefreshState(true)).toBe(false);
	});
	it("flips false to true", () => {
		expect(toggleRefreshState(false)).toBe(true);
	});
});

describe("statusBarText", () => {
	it("returns 'DV: Auto' when enabled", () => {
		expect(statusBarText(true)).toBe("DV: Auto");
	});
	it("returns 'DV: Paused' when disabled", () => {
		expect(statusBarText(false)).toBe("DV: Paused");
	});
});

describe("noticeText", () => {
	it("returns enabled message when true", () => {
		expect(noticeText(true)).toBe("Dataview auto-refresh enabled");
	});
	it("returns paused message when false", () => {
		expect(noticeText(false)).toBe("Dataview auto-refresh paused");
	});
});

describe("applyPause", () => {
	it("replaces debouncedRefresh with a no-op", () => {
		let called = false;
		const dv: PausableDv = {
			debouncedRefresh: () => { called = true; },
			updateRefreshSettings: () => {},
			index: { revision: 0 },
		};
		applyPause(dv);
		dv.debouncedRefresh();
		expect(called).toBe(false);
	});

	it("re-applies no-op when updateRefreshSettings is called during pause", () => {
		let called = false;
		const dv: PausableDv = {
			debouncedRefresh: () => { called = true; },
			updateRefreshSettings: () => {
				dv.debouncedRefresh = () => { called = true; };
			},
			index: { revision: 0 },
		};
		applyPause(dv);
		dv.updateRefreshSettings();
		dv.debouncedRefresh();
		expect(called).toBe(false);
	});
});

describe("applyResume", () => {
	it("restores debouncedRefresh so it fires after resume", () => {
		let called = false;
		const dv: PausableDv = {
			debouncedRefresh: () => { called = true; },
			updateRefreshSettings: () => {
				dv.debouncedRefresh = () => { called = true; };
			},
			index: { revision: 0 },
		};
		applyPause(dv);
		applyResume(dv, () => {});
		dv.debouncedRefresh();
		expect(called).toBe(true);
	});

	it("increments index.revision", () => {
		const dv: PausableDv = {
			debouncedRefresh: () => {},
			updateRefreshSettings: () => {},
			index: { revision: 3 },
		};
		applyPause(dv);
		applyResume(dv, () => {});
		expect(dv.index.revision).toBe(4);
	});

	it("calls triggerRefresh", () => {
		let triggered = false;
		const dv: PausableDv = {
			debouncedRefresh: () => {},
			updateRefreshSettings: () => {},
			index: { revision: 0 },
		};
		applyPause(dv);
		applyResume(dv, () => { triggered = true; });
		expect(triggered).toBe(true);
	});

	it("does not throw when called without a prior applyPause", () => {
		const dv: PausableDv = {
			debouncedRefresh: () => {},
			updateRefreshSettings: () => {},
			index: { revision: 0 },
		};
		expect(() => applyResume(dv, () => {})).not.toThrow();
	});
});

describe("getFrontmatterOverride", () => {
	it("returns true (paused) when dataview-refresh is false", () => {
		expect(getFrontmatterOverride({ "dataview-refresh": false })).toBe(true);
	});
	it("returns false (enabled) when dataview-refresh is true", () => {
		expect(getFrontmatterOverride({ "dataview-refresh": true })).toBe(false);
	});
	it("returns null when key is absent", () => {
		expect(getFrontmatterOverride({})).toBeNull();
	});
	it("returns null when frontmatter is undefined", () => {
		expect(getFrontmatterOverride(undefined)).toBeNull();
	});
	it("returns null when value is a non-boolean (string)", () => {
		expect(getFrontmatterOverride({ "dataview-refresh": "off" })).toBeNull();
	});
	it("returns null when value is a non-boolean (number)", () => {
		expect(getFrontmatterOverride({ "dataview-refresh": 0 })).toBeNull();
	});
});
