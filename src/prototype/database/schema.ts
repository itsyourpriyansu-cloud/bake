import { db } from './db'

/** All Dexie table names — used by resetDemoDatabase to clear every table without hardcoding the list twice. */
export const TABLE_NAMES = db.tables.map((table) => table.name)
