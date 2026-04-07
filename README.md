# accessing-the-cloudflare-object (Dope fork)

Vendored from [kunala/accessing-the-cloudflare-object](https://github.com/kunala/accessing-the-cloudflare-object) with changes so the Worker returns **everything Cloudflare exposes** on `request.cf` (TLS metadata, geo, `tlsExportedAuthenticator`, etc.) without dropping fields, plus optional request metadata for **Dope on vs off** comparisons.

## Behavior

- **Default** (`GET /`): JSON with:
  - `cf` — merged, deep-serialized `IncomingRequestCfProperties` (BigInt-safe, nested objects preserved).
  - `cfTopLevelKeys` — sorted list of keys for quick diffing.
  - `ja3Ja4` — explicit readout of **`request.cf.botManagement`** (`ja3Hash`, `ja4`, `score`, `ja4Signals`, …) when [Bot Management](https://developers.cloudflare.com/bots/reference/bot-management-variables/) is enabled on the zone; otherwise a clear `cloudflareJa3Ja4Populated: false` message (typical on `workers.dev` without Enterprise BM).
  - `tlsClientHelloObservables` — groups **`tlsClientHelloLength`**, cipher/extension **SHA1 fields**, **`tlsExportedAuthenticator`**, negotiated **`tlsVersion`/`tlsCipher`**, and documents what Cloudflare **does not** expose (no raw ClientHello, no ordered cipher list on `cf`).
  - `request` — URL, method, and **filtered** headers (`cf-*`, `User-Agent`, common `X-Forwarded-*`, `Host`, …).
  - `meta` — pointers to Cloudflare docs.

- **`?raw=1`**: body is **only** the `cf` object (same shape as the original upstream sample: one JSON object with `httpProtocol`, `tlsVersion`, `tlsClientHelloLength`, …).

- **`?allHeaders=1`**: include **every** incoming request header (may contain cookies—use only for local debugging).

## Deploy

```bash
cd tools/accessing-the-cloudflare-object
npm install
npm run deploy
```

## Dope TLS debugging

1. Load your deployed Worker URL with **Dope on**, save JSON.  
2. Same machine, **Dope off**, save JSON.  
3. Diff `cf` (or the whole default payload): `tlsClientHelloLength`, `tlsClientCiphersSha1`, `tlsClientExtensionsSha1`, `tlsExportedAuthenticator`, etc.

**Note:** [JA3/JA4 on `cf`](https://developers.cloudflare.com/bots/additional-configurations/ja3-ja4-fingerprint/) (`ja3Hash`, `ja4`, `ja4Signals`, …) require **Enterprise Bot Management** on **your** zone. This Worker cannot invent them. For **`ja3_text` / `ja4_r` / cipher lists** as a non-CF TLS endpoint sees them, use something like [tls.browserleaks.com/json](https://tls.browserleaks.com/json) in the browser (Dope on vs off).

## References

- [Accessing the Cloudflare object (Workers example)](https://developers.cloudflare.com/workers/examples/accessing-the-cloudflare-object/)
- [IncomingRequestCfProperties](https://developers.cloudflare.com/workers/runtime-apis/request/#incomingrequestcfproperties)
