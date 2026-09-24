import { openDatabase } from "./database"
import {
  credentialFromValue,
  type ActiveConnection,
  type SourceCredential,
} from "./sources"

/** Resolve only the connection selected as active by OpenCode's integration API. */
export function resolveConnectionCredential(
  connection: ActiveConnection,
): SourceCredential | undefined {
  if (connection.type === "env") {
    const key = process.env[connection.name]
    return key ? { type: "key", key } : undefined
  }
  if (!connection.id) return undefined

  try {
    const row = openDatabase()
      .query("SELECT value FROM credential WHERE id = ?")
      .get(connection.id) as { value?: unknown } | undefined
    return row ? credentialFromValue(row.value) : undefined
  } catch {
    return undefined
  }
}
