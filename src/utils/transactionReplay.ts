/**
 * Makes a verified Qgiv transaction id single-use.
 *
 * Replay is a lesser harm than forgery — a replayed id only ever re-invites
 * the person who genuinely paid — so this guard deliberately fails *open*:
 * a KV outage must not cost a real member their invite, whereas a failed
 * payment verification must always fail closed.
 */
const REPLAY_KEY_PREFIX = "qgiv-txn:";
const REPLAY_TTL_SECONDS = 60 * 60 * 24 * 30;

export async function claimTransaction(
  kv: KVNamespace | undefined,
  transactionId: string
): Promise<boolean> {
  if (!kv) return true;

  try {
    const key = `${REPLAY_KEY_PREFIX}${transactionId}`;
    if (await kv.get(key)) return false;
    await kv.put(key, new Date().toISOString(), { expirationTtl: REPLAY_TTL_SECONDS });
    return true;
  } catch {
    return true;
  }
}
