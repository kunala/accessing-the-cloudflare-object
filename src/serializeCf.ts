/**
 * Deep-serialize values from request.cf for JSON responses.
 * Handles BigInt, nested objects/arrays, and avoids JSON.stringify throwing.
 */

const MAX_DEPTH = 48;

export function deepSerializeForJson(input: unknown, depth = 0): unknown {
	if (depth > MAX_DEPTH) return "[MaxDepth]";
	if (input === null) return null;
	if (input === undefined) return undefined;

	const t = typeof input;
	if (t === "bigint") return input.toString();
	if (t === "boolean" || t === "number" || t === "string") return input;
	if (t === "symbol") return input.toString();

	if (Array.isArray(input)) {
		return input.map((item) => deepSerializeForJson(item, depth + 1));
	}

	if (t === "object") {
		const obj = input as Record<string, unknown>;
		const out: Record<string, unknown> = {};
		for (const key of Object.keys(obj)) {
			try {
				out[key] = deepSerializeForJson(obj[key], depth + 1);
			} catch (e) {
				out[key] = `[error: ${(e as Error).message}]`;
			}
		}
		return out;
	}

	return String(input);
}

/**
 * Copy every enumerable own property from cf, including nested structures.
 * request.cf is usually a plain object; this matches JSON.stringify behavior
 * but adds BigInt safety.
 */
export function serializeCfShallowSpread(cf: object): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	for (const key of Object.keys(cf as object)) {
		try {
			out[key] = deepSerializeForJson((cf as Record<string, unknown>)[key]);
		} catch (e) {
			out[key] = `[error: ${(e as Error).message}]`;
		}
	}
	return out;
}

/**
 * Also read own property names (in case any are non-enumerable in edge runtimes).
 */
export function serializeCfExhaustive(cf: object): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	const names = Object.getOwnPropertyNames(cf);
	for (const name of names) {
		let raw: unknown;
		try {
			const desc = Object.getOwnPropertyDescriptor(cf, name);
			if (!desc) continue;
			raw = desc.get !== undefined ? desc.get.call(cf) : desc.value;
			out[name] = deepSerializeForJson(raw);
		} catch (e) {
			out[name] = `[error: ${(e as Error).message}]`;
		}
	}
	return out;
}

/**
 * Merge exhaustive + shallow spread so we keep the union of keys and prefer
 * successful values from exhaustive when spread missed getters.
 */
export function serializeCfMerged(cf: object): Record<string, unknown> {
	const a = serializeCfExhaustive(cf);
	const b = serializeCfShallowSpread(cf);
	return { ...b, ...a };
}
