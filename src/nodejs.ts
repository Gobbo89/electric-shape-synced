import 'dotenv/config'
import fs from 'fs'
import Database from 'better-sqlite3'
import exitHook from 'exit-hook'
import Debug from 'debug';

// ElectricSQL
import { electrify } from 'electric-sql/node'
import { authToken } from './auth.js'
import { schema as electricSqlSchema } from './generated/client/index.js'

const debug = Debug('electric-shape-synced');

const sqliteDbPath = './sqlite_db'
if (!fs.existsSync(sqliteDbPath)){
  fs.mkdirSync(sqliteDbPath)
}

const electricSqlConfig = {
  debug: process.env.ELECTRIC_CLIENT_DEBUG === 'true',
  url: process.env.ELECTRIC_SERVICE,
}

const conn = new Database(`${sqliteDbPath}/example`)
conn.pragma('journal_mode = WAL')
conn.pragma('synchronous = NORMAL')

const electric = await electrify(conn, electricSqlSchema, electricSqlConfig)
await electric.connect(authToken())
const { db } = electric


// Purposely querying an unsynced table, will show a warning
const items = await db.items.findMany()
// Correctly gives me []
debug('Local items', items)


// Resolves when the shape subscription has been established.
const shape = await db.items.sync()
debug('Shape subscription established')


// Resolves when the data has been synced into the local database.
await shape.synced
debug('Shape data synced!')


// Now the data should've been synced into the local database
const syncedItems = await db.items.findMany()
// But it still gives me []
debug('Synced items', syncedItems)


// However, if I wait an arbitrary amount of time...
const someTime = 15
setTimeout(async () => {
  const syncedItems = await db.items.findMany()
  // ... it gives me ['some-totally-random-item']
  debug(`Synced items (after ${someTime} ms timeout)`, syncedItems)
}, someTime)

exitHook(() => {
  debug('\nClosing electric connection')
  electric.close()

  debug('Closing sqlite connection')
  conn.close()
})