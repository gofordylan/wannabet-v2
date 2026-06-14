import { Hono } from 'hono'
import pg from 'pg'
import { client, graphql, replaceBigInts } from 'ponder'
import { db } from 'ponder:api'
import schema from 'ponder:schema'

import { getEnrichedBets } from './handlers/bets'
import { fetchUserByAddress } from '../ens'

const VALID_SOURCES = new Set(['fc', 'x', 'web'])

// Direct PostgreSQL connection for writes (bypasses Ponder's read-only API db)
const writePool = process.env.DATABASE_URL
  ? new pg.Pool({ connectionString: process.env.DATABASE_URL })
  : null

let tableCreated = false
async function ensureSourceOverrideTable() {
  if (tableCreated || !writePool) return
  await writePool.query(`
    CREATE TABLE IF NOT EXISTS source_override (
      bet_address TEXT PRIMARY KEY,
      source TEXT NOT NULL
    )
  `)
  tableCreated = true
}

const app = new Hono()

app.use('/sql/*', client({ db, schema }))

app.use('/', graphql({ db, schema }))
app.use('/graphql', graphql({ db, schema }))

app.get('/bets', async (c) => {
  const source = c.req.query('source')
  const bets = await getEnrichedBets(source ? { source } : undefined)
  return c.json(replaceBigInts(bets, (b) => b.toString()))
})

app.post('/bets/:address/source', async (c) => {
  if (!writePool) {
    return c.json({ error: 'DATABASE_URL not configured' }, 500)
  }

  const address = c.req.param('address').toLowerCase()
  const body = await c.req.json()
  const source = body?.source

  if (!source || !VALID_SOURCES.has(source)) {
    return c.json({ error: 'Invalid source. Must be one of: fc, x, web' }, 400)
  }

  await ensureSourceOverrideTable()
  await writePool.query(
    `INSERT INTO source_override (bet_address, source)
     VALUES ($1, $2)
     ON CONFLICT (bet_address) DO UPDATE SET source = $2`,
    [address, source]
  )

  return c.json({ ok: true })
})

app.get('/user/:address', async (c) => {
  const address = c.req.param('address')
  const user = await fetchUserByAddress(address)
  return c.json(user)
})

export default app
