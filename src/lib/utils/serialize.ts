import { Timestamp } from 'firebase-admin/firestore'

/**
 * Serializes an object by converting Firestore Timestamps and Dates to ISO strings
 * This ensures the object can be safely passed from Server Components to Client Components
 *
 * @param data - The data to serialize
 * @returns A plain object with all Timestamps and Dates converted to strings
 */
export function serializeForClient<T>(data: T): T {
  if (data === null || data === undefined) {
    return data
  }

  // Handle Firestore Timestamp
  if (data instanceof Timestamp) {
    return data.toDate().toISOString() as T
  }

  // Handle Date
  if (data instanceof Date) {
    return data.toISOString() as T
  }

  // Handle Arrays
  if (Array.isArray(data)) {
    return data.map((item) => serializeForClient(item)) as T
  }

  // Handle Objects
  if (typeof data === 'object') {
    const serialized: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data)) {
      serialized[key] = serializeForClient(value)
    }
    return serialized as T
  }

  // Primitive types
  return data
}
