import { useEffect, useRef, useState } from 'react';

// NIP-34 (git over nostr) event kinds.
export const GIT_KINDS = [30617, 30618, 1617, 1621, 1622, 1630, 1631, 1632, 1633] as const;

export type KindCounts = Record<number, number>;

// Passive subscription that tallies event counts per kind. Pass a `kinds`
// list to constrain (e.g. GIT_KINDS for a GRASP relay) or omit it to ask
// the relay for whatever it has (good for general-purpose relays).
export function useRelayKindCounts(
  url: string,
  kinds: readonly number[] | undefined,
  limit = 500,
): { counts: KindCounts; total: number; loading: boolean; error: boolean } {
  const [counts, setCounts] = useState<KindCounts>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const tallyRef = useRef<KindCounts>({});
  const kindsKey = kinds ? kinds.join(',') : '*';

  useEffect(() => {
    let ws: WebSocket;
    let closed = false;
    tallyRef.current = {};
    setCounts({});
    setLoading(true);
    setError(false);

    try {
      ws = new WebSocket(url);
    } catch {
      setLoading(false);
      setError(true);
      return;
    }

    const subId = `kindcounts-${Math.random().toString(36).slice(2, 8)}`;
    const filter: Record<string, unknown> = { limit };
    if (kinds && kinds.length > 0) filter.kinds = [...kinds];

    const timer = setTimeout(() => {
      if (!closed) {
        setLoading(false);
        try { ws.close(); } catch { /* ignore */ }
      }
    }, 12000);

    ws.onopen = () => {
      try {
        ws.send(JSON.stringify(['REQ', subId, filter]));
      } catch {
        setError(true);
      }
    };
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (!Array.isArray(msg)) return;
        if (msg[0] === 'EVENT' && msg[1] === subId) {
          const k = msg[2]?.kind as number | undefined;
          if (typeof k === 'number') {
            tallyRef.current[k] = (tallyRef.current[k] ?? 0) + 1;
            setCounts({ ...tallyRef.current });
          }
        } else if (msg[0] === 'EOSE' && msg[1] === subId) {
          setLoading(false);
          clearTimeout(timer);
          setTimeout(() => { if (!closed) { try { ws.close(); } catch { /* ignore */ } } }, 500);
        }
      } catch { /* ignore malformed frame */ }
    };
    ws.onerror = () => { setError(true); setLoading(false); clearTimeout(timer); };
    ws.onclose = () => { clearTimeout(timer); };

    return () => {
      closed = true;
      clearTimeout(timer);
      try { ws.close(); } catch { /* ignore */ }
    };
  }, [url, kindsKey, limit]);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return { counts, total, loading, error };
}

// Plain-English label for common Nostr event kinds. Falls back to `k<number>`
// so unknown kinds stay visible. Groups variants (e.g. NIP-34 status range)
// under a single label so they collapse in the UI.
export function kindLabel(kind: number): string {
  // NIP-34 git
  switch (kind) {
    case 30617: return 'repo';
    case 30618: return 'state';
    case 1617:  return 'patch';
    case 1621:  return 'issue';
    case 1622:  return 'comment';
    case 1630:
    case 1631:
    case 1632:
    case 1633:  return 'status';
  }
  // General Nostr
  switch (kind) {
    case 0:     return 'profile';
    case 1:     return 'note';
    case 3:     return 'contacts';
    case 4:     return 'dm';
    case 5:     return 'delete';
    case 6:     return 'repost';
    case 7:     return 'reaction';
    case 1059:  return 'giftwrap';
    case 1063:  return 'file';
    case 1111:  return 'comment';
    case 9734:  return 'zap-req';
    case 9735:  return 'zap';
    case 9802:  return 'highlight';
    case 10002: return 'relays';
    case 27235: return 'nip98';
    case 30023: return 'long-form';
    case 31237: return 'release';
  }
  return `k${kind}`;
}
