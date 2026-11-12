/** Namespace persisted routing keys without changing either storage owner's key. */
export function subscriptionAccountKey(accessMethod, storageKey) {
    return `${accessMethod}:${encodeURIComponent(storageKey)}`;
}
