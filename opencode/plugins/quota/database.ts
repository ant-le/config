import { Database } from "bun:sqlite"
import { homedir } from "node:os"
import { isAbsolute, join } from "node:path"

let database: Database | undefined

export function databasePath() {
  const dataHome =
    process.env.XDG_DATA_HOME || join(homedir(), ".local", "share")
  const configured = process.env.OPENCODE_DB
  if (!configured) return join(dataHome, "opencode", "opencode.db")
  return isAbsolute(configured)
    ? configured
    : join(dataHome, "opencode", configured)
}

export function openDatabase() {
  if (!database) database = new Database(databasePath(), { readonly: true })
  return database
}
