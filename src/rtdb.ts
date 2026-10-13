import { get, onValue, push, ref, remove, set, update, type Unsubscribe } from 'firebase/database'
import { database, SHOP_ID } from './firebase'

export const shopPath = (suffix: string) => `shops/${SHOP_ID}/${suffix}`

export function subscribeMap<T>(path: string, callback: (value: Record<string, T>) => void, onError?: (error: Error) => void): Unsubscribe {
  return onValue(ref(database, path), (snapshot) => callback(snapshot.exists() ? snapshot.val() as Record<string, T> : {}), (error) => onError?.(error))
}

export async function readValue<T>(path: string): Promise<T | null> { const snapshot = await get(ref(database, path)); return snapshot.exists() ? snapshot.val() as T : null }
export async function createRecord<T extends object>(path: string, value: T) { const record = push(ref(database, path)); await set(record, { ...value, createdAt: Date.now(), updatedAt: Date.now() }); return record.key as string }
export async function updateRecord(path: string, value: object) { await update(ref(database, path), { ...value, updatedAt: Date.now() }) }
export async function deleteRecord(path: string) { await remove(ref(database, path)) }
export async function replaceValue(path: string, value: unknown) { await set(ref(database, path), value) }
