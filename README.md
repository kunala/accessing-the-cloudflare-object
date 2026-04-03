# accessing-the-cloudflare-object (Dope fork)

Vendored from [kunala/accessing-the-cloudflare-object](https://github.com/kunala/accessing-the-cloudflare-object) with changes so the Worker returns **everything Cloudflare exposes** on `request.cf` (TLS metadata, geo, `tlsExportedAuthenticator`, etc.) without dropping fields, plus optional request metadata for **Dope on vs off** comparisons.

## Behavior

- **Default** (`GET /`): JSON with:
  - `cf` — merged, deep-serialized `IncomingRequestCfProperties` (BigInt-safe, nested objects preserved).
  - `cfTopLevelKeys` — sorted list of keys for quick diffing.
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

**Note:** [JA3/JA4 Signals](https://developers.cloudflare.com/bots/additional-configurations/ja3-ja4-fingerprint/) (`ja4Signals`, …) require **Enterprise Bot Management** and may only appear in `cf` when your zone has those features enabled—this Worker only echoes what the runtime attaches to `request.cf`.

## References

- [Accessing the Cloudflare object (Workers example)](https://developers.cloudflare.com/workers/examples/accessing-the-cloudflare-object/)
- [IncomingRequestCfProperties](https://developers.cloudflare.com/workers/runtime-apis/request/#incomingrequestcfproperties)
