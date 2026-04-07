/**
 * Human-oriented summaries for JA3/JA4 and TLS ClientHello–related cf fields.
 *
 * @see https://developers.cloudflare.com/workers/runtime-apis/request/#incomingrequestcfproperties
 * @see https://developers.cloudflare.com/bots/additional-configurations/ja3-ja4-fingerprint/
 */

import { deepSerializeForJson } from "./serializeCf";

type CfRecord = Record<string, unknown>;

/**
 * JA3/JA4 as Cloudflare exposes them on Workers: under cf.botManagement when
 * Bot Management is enabled (Enterprise). Not present on workers.dev by default.
 */
export function summarizeJa3Ja4(cf: IncomingRequestCfProperties): CfRecord {
	const raw = cf as CfRecord;
	const bm = raw.botManagement;

	if (bm == null || typeof bm !== "object") {
		return {
			cloudflareJa3Ja4Populated: false,
			message:
				"request.cf.botManagement is null. Cloudflare exposes ja3Hash, ja4 (and related Bot Management fields) only when Bot Management is enabled on this zone (typically Enterprise).",
			docs: {
				incomingCf:
					"https://developers.cloudflare.com/workers/runtime-apis/request/#incomingrequestcfproperties",
				ja3Ja4:
					"https://developers.cloudflare.com/bots/additional-configurations/ja3-ja4-fingerprint/",
				botVariables:
					"https://developers.cloudflare.com/bots/reference/bot-management-variables/",
			},
			ja3Hash: null,
			ja4: null,
			botManagement: null,
		};
	}

	const b = bm as CfRecord;
	return {
		cloudflareJa3Ja4Populated: true,
		ja3Hash: b.ja3Hash ?? null,
		ja4: b.ja4 ?? null,
		score: b.score ?? null,
		verifiedBot: b.verifiedBot ?? null,
		staticResource: b.staticResource ?? null,
		detectionIds: b.detectionIds ?? null,
		ja4Signals: b.ja4Signals != null ? deepSerializeForJson(b.ja4Signals) : null,
		jaSignalsParsed: b.jaSignalsParsed != null ? deepSerializeForJson(b.jaSignalsParsed) : null,
		botManagementFull: deepSerializeForJson(bm),
	};
}

/**
 * What Cloudflare puts on cf that relates to the *client* TLS handshake.
 * The platform does NOT expose raw ClientHello bytes or the ordered cipher list.
 */
export function summarizeTlsClientHelloObservables(cfRecord: CfRecord): CfRecord {
	return {
		whatCloudflareExposes: {
			tlsClientHelloLength: cfRecord.tlsClientHelloLength ?? null,
			tlsClientRandom: cfRecord.tlsClientRandom ?? null,
			tlsClientCiphersSha1: cfRecord.tlsClientCiphersSha1 ?? null,
			tlsClientExtensionsSha1: cfRecord.tlsClientExtensionsSha1 ?? null,
			tlsClientExtensionsSha1Le: cfRecord.tlsClientExtensionsSha1Le ?? null,
			tlsExportedAuthenticator: cfRecord.tlsExportedAuthenticator ?? null,
		},
		negotiatedConnection: {
			tlsVersion: cfRecord.tlsVersion ?? null,
			tlsCipher: cfRecord.tlsCipher ?? null,
			httpProtocol: cfRecord.httpProtocol ?? null,
		},
		whatIsNotAvailableOnRequestCf: {
			rawClientHelloBytes: false,
			orderedCipherSuitesAsIANANamesOrHex: false,
			explanation:
				"Cloudflare does not expose raw ClientHello bytes or the ordered cipher-suite list on request.cf. tlsClientCiphersSha1 / tlsClientExtensionsSha1 are one-way summaries of parts of the hello. For JA3/JA4 *strings* (ja3Hash, ja4), see the ja3Ja4 section—those live under cf.botManagement when Bot Management is enabled on the zone.",
		},
		clientSideAlternativeForFullJa3Ja4Components: {
			url: "https://tls.browserleaks.com/json",
			note: "Open in the browser (same machine / Dope on vs off) to see ja3_text, ja4_r, and cipher lists as seen by that TLS endpoint—not by Cloudflare.",
		},
	};
}
