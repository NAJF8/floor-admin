import { get, onValue, ref, type Unsubscribe } from 'firebase/database'
import { httpsCallable } from 'firebase/functions'
import { database, functions, SHOP_ID } from './firebase'

export const shopPath = (suffix: string) => `shops/${SHOP_ID}/${suffix}`

const privatePath = (path: string) => path.includes(`/private/`) || path.endsWith('/private')
async function adminRead(path: string) { const call = httpsCallable(functions, 'adminRead'); return (await call({ path })).data as { data?: unknown } }

export function subscribeMap<T>(path: string, callback: (value: Record<string, T>) => void, onError?: (error: Error) => void): Unsubscribe {
  if (privatePath(path)) {
    let closed = false
    const refresh = async () => { try { const result = await adminRead(path); if (!closed) callback(result.data && typeof result.data === 'object' && !Array.isArray(result.data) ? result.data as Record<string, T> : {}) } catch (error) { if (!closed) onError?.(error instanceof Error ? error : new Error('تعذر قراءة البيانات الخاصة.')) } }
    void refresh()
    const timer = window.setInterval(refresh, 15000)
    return () => { closed = true; window.clearInterval(timer) }
  }
  return onValue(ref(database, path), (snapshot) => callback(snapshot.exists() ? snapshot.val() as Record<string, T> : {}), (error) => onError?.(error))
}

export async function readValue<T>(path: string): Promise<T | null> { if (privatePath(path)) { const result = await adminRead(path); return (result.data ?? null) as T | null } const snapshot = await get(ref(database, path)); return snapshot.exists() ? snapshot.val() as T : null }
async function adminWrite(operation: string, path: string, value?: unknown) { const call = httpsCallable(functions, 'adminWrite'); return (await call({ operation, path, value })).data as { key?: string } }
export async function createRecord<T extends object>(path: string, value: T) { const result = await adminWrite('create', path, value); return result.key as string }
export async function updateRecord(path: string, value: object) { await adminWrite('update', path, value) }
export async function deleteRecord(path: string) { await adminWrite('delete', path) }
export async function replaceValue(path: string, value: unknown) { await adminWrite('replace', path, value) }
