# pls.upleb.uk

> Nostr relay dashboard.

**Live**: <https://pls.upleb.uk>

## Stack

- [Vite](https://vitejs.dev/) + React 18 + TypeScript
- Tailwind CSS
- [nostr-tools](https://github.com/nbd-wtf/nostr-tools)
- lucide-react

## Nostr

- **Login**: NIP-07 (browser extension) + NIP-55 (Amber callback URI)
- `kind:1` — live notes feed

Primary relay card defaults to `wss://relay.fizx.uk`; secondary `RelayBadge` strip probes the GRASP-only `wss://git.upleb.uk`.

## Develop

```bash
npm install
npm run dev
```

## Build + deploy

```bash
npm run build
rsync -avz --delete -e "ssh -p 2121" dist/ root@45.154.199.154:/var/www/pls.upleb.uk/
```

VPS: `45.154.199.154`. Full server / nginx / SSL / DNS notes for the wider deployment live in the local `code_upleb/CLAUDE.md` (not pushed; this README is the public-facing summary).

---

_Sister repo on the other side: <https://github.com/adjmx/pls.fizx.uk>_
