/** Access-method tag shared by account kinds in the Subscriptions component. */
export type SubscriptionAccessMethod = 'direct' | 'official-cli';

/** Internal routing view. Official CLI accounts deliberately contain no token or session. */
export type SubscriptionAccount<TDirect> =
  | { accessMethod: 'direct'; key: string; label: string; session: TDirect }
  | { accessMethod: 'official-cli'; key: string; label: string };

/** Namespace persisted routing keys without changing either storage owner's key. */
export function subscriptionAccountKey(
  accessMethod: SubscriptionAccessMethod,
  storageKey: string,
): string {
  return `${accessMethod}:${encodeURIComponent(storageKey)}`;
}
