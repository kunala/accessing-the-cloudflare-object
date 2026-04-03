import { serializeCfMerged } from "./serializeCf";

/**
 * Echo everything Cloudflare exposes on request.cf (IncomingRequestCfProperties),
 * plus request metadata useful for Dope / TLS debugging (compare Dope on vs off).
 *
 * @see https://developers.cloudflare.com/workers/examples/accessing-the-cloudflare-object/
 * @see https://developers.cloudflare.com/workers/runtime-apis/request/#incomingrequestcfproperties
 */

function headersToRecord(headers: Headers): Record<string, string> {
	const out: Record<string, string> = {};
	headers.forEach((value, key) => {
		out[key] = value;
	});
	return out;
}

export default {
	async fetch(req: Request): Promise<Response> {
		const url = new URL(req.url);
		const includeAllHeaders =
			url.searchParams.get("allHeaders") === "1" ||
			url.searchParams.get("all_headers") === "1";
		/** Only the merged cf object (same information density as the upstream sample JSON body). */
		const rawCfOnly = url.searchParams.get("raw") === "1";

		if (req.cf === undefined) {
			const body = {
				error:
					"The `cf` object is not available (e.g. local wrangler preview without --remote).",
				hint: "Try `wrangler dev --remote` or deploy to workers.dev.",
				request: {
					url: req.url,
					method: req.method,
					headers: includeAllHeaders
						? headersToRecord(req.headers)
						: pickDebugHeaders(req.headers),
				},
			};
			return jsonResponse(body);
		}

		const cfRecord = serializeCfMerged(req.cf);

		if (rawCfOnly) {
			return jsonResponse(cfRecord);
		}

		// Enterprise Bot Management / JA fields may appear under cf when available
		const payload: Record<string, unknown> = {
			cf: cfRecord,
			cfTopLevelKeys: Object.keys(cfRecord).sort(),
			request: {
				url: req.url,
				method: req.method,
				headers: includeAllHeaders
					? headersToRecord(req.headers)
					: pickDebugHeaders(req.headers),
			},
			meta: {
				description:
					"cf = IncomingRequestCfProperties as seen by Cloudflare for this request. Compare Dope on vs off.",
				cloudflareDocs:
					"https://developers.cloudflare.com/workers/runtime-apis/request/#incomingrequestcfproperties",
				ja3Ja4Docs:
					"https://developers.cloudflare.com/bots/additional-configurations/ja3-ja4-fingerprint/",
				queryParams: {
					raw: "Add ?raw=1 to return only the cf object (merged), similar to the original worker body.",
					allHeaders:
						"Add ?allHeaders=1 to include every request header (may contain cookies).",
				},
			},
		};

		return jsonResponse(payload);
	},
} satisfies ExportedHandler;

function pickDebugHeaders(headers: Headers): Record<string, string> {
	const out: Record<string, string> = {};
	const allow = (name: string) => {
		const lower = name.toLowerCase();
		return (
			lower.startsWith("cf-") ||
			lower === "user-agent" ||
			lower === "x-forwarded-for" ||
			lower === "x-real-ip" ||
			lower === "true-client-ip" ||
			lower === "forwarded" ||
			lower === "x-forwarded-proto" ||
			lower === "host"
		);
	};
	headers.forEach((value, key) => {
		if (allow(key)) out[key] = value;
	});
	return out;
}

function jsonResponse(data: unknown): Response {
	return new Response(JSON.stringify(data, jsonReplacer, 2), {
		headers: {
			"content-type": "application/json; charset=UTF-8",
			"cache-control": "no-store",
		},
	});
}

function jsonReplacer(_key: string, value: unknown): unknown {
	if (typeof value === "bigint") return value.toString();
	return value;
}
