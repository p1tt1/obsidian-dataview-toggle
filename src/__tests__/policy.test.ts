import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(import.meta.url), "../../..");

function readJson<T>(path: string): T {
	return JSON.parse(readFileSync(path, "utf-8")) as T;
}

interface Manifest {
	id: string;
	name: string;
	version: string;
	minAppVersion: string;
	description: string;
	author: string;
	isDesktopOnly: boolean;
	fundingUrl?: string;
}

interface Versions {
	[version: string]: string;
}

const manifest = readJson<Manifest>(join(ROOT, "manifest.json"));
const versions = readJson<Versions>(join(ROOT, "versions.json"));

// ── 1. File presence ──────────────────────────────────────────────────────────

describe("file presence", () => {
	it("README.md exists at repo root", () => {
		expect(existsSync(join(ROOT, "README.md"))).toBe(true);
	});

	it("LICENSE exists at repo root", () => {
		expect(existsSync(join(ROOT, "LICENSE"))).toBe(true);
	});

	it("manifest.json exists at repo root", () => {
		expect(existsSync(join(ROOT, "manifest.json"))).toBe(true);
	});

	it("versions.json exists at repo root", () => {
		expect(existsSync(join(ROOT, "versions.json"))).toBe(true);
	});
});

// ── 2. Manifest description rules ─────────────────────────────────────────────

describe("manifest description", () => {
	it("is 250 characters or fewer", () => {
		expect(manifest.description.length).toBeLessThanOrEqual(250);
	});

	it("ends with a period", () => {
		expect(manifest.description.endsWith(".")).toBe(true);
	});

	it('does not start with "This is a plugin"', () => {
		expect(manifest.description.startsWith("This is a plugin")).toBe(false);
	});

	it("contains no emoji", () => {
		expect(/\p{Emoji_Presentation}/u.test(manifest.description)).toBe(false);
	});
});

// ── 3. Manifest structural rules ──────────────────────────────────────────────

describe("manifest structure", () => {
	it("manifest version exists as a key in versions.json", () => {
		expect(Object.keys(versions)).toContain(manifest.version);
	});

	it("fundingUrl is absent (not accepting donations)", () => {
		expect(manifest.fundingUrl).toBeUndefined();
	});
});

// ── 4. isDesktopOnly consistency ──────────────────────────────────────────────

function collectTsFiles(dir: string): string[] {
	const results: string[] = [];
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) {
			results.push(...collectTsFiles(full));
		} else if (entry.endsWith(".ts") && !entry.endsWith(".test.ts")) {
			results.push(full);
		}
	}
	return results;
}

const NODE_ONLY_MODULES = ["fs", "crypto", "os", "path", "child_process", "net", "tls", "http", "https"];
const NODE_IMPORT_RE = new RegExp(
	`from\\s+['"](?:node:)?(${NODE_ONLY_MODULES.join("|")})['"]|require\\(['"](?:node:)?(${NODE_ONLY_MODULES.join("|")})['"]\\)`,
);

describe("isDesktopOnly consistency", () => {
	it("isDesktopOnly is false in manifest", () => {
		expect(manifest.isDesktopOnly).toBe(false);
	});

	it("source files contain no Node.js-only module imports", () => {
		const srcDir = join(ROOT, "src");
		const tsFiles = collectTsFiles(srcDir);
		const violations: string[] = [];
		for (const file of tsFiles) {
			const source = readFileSync(file, "utf-8");
			if (NODE_IMPORT_RE.test(source)) {
				violations.push(file.replace(ROOT + "/", ""));
			}
		}
		expect(violations).toEqual([]);
	});
});

// ── 5. Command ID format ───────────────────────────────────────────────────────

describe("command ID format", () => {
	it("no addCommand id starts with the plugin id as a prefix", () => {
		const mainTs = readFileSync(join(ROOT, "src/main.ts"), "utf-8");
		const matches = [...mainTs.matchAll(/addCommand\s*\(\s*\{[\s\S]*?id\s*:\s*"([^"]+)"/g)];
		const commandIds = matches.map((m) => m[1]).filter((id): id is string => id !== undefined);

		expect(commandIds.length).toBeGreaterThan(0);

		for (const id of commandIds) {
			expect(id.startsWith(manifest.id)).toBe(false);
		}
	});
});

// ── 6. minAppVersion sanity ───────────────────────────────────────────────────

const SEMVER_RE = /^\d+\.\d+\.\d+$/;

function semverGte(a: string, b: string): boolean {
	const parse = (v: string): [number, number, number] => {
		const parts = v.split(".").map(Number);
		return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
	};
	const [aMaj, aMin, aPat] = parse(a);
	const [bMaj, bMin, bPat] = parse(b);
	if (aMaj !== bMaj) return aMaj > bMaj;
	if (aMin !== bMin) return aMin > bMin;
	return aPat >= bPat;
}

describe("minAppVersion", () => {
	it("is a valid semver string (major.minor.patch)", () => {
		expect(SEMVER_RE.test(manifest.minAppVersion)).toBe(true);
	});

	it("is 0.15.0 or newer", () => {
		expect(semverGte(manifest.minAppVersion, "0.15.0")).toBe(true);
	});
});

// ── 7. versions.json consistency ──────────────────────────────────────────────

describe("versions.json consistency", () => {
	it("every key is a valid semver string", () => {
		for (const key of Object.keys(versions)) {
			expect(SEMVER_RE.test(key), `key "${key}" is not valid semver`).toBe(true);
		}
	});

	it("manifest version exists as a key in versions.json", () => {
		expect(Object.keys(versions)).toContain(manifest.version);
	});
});
