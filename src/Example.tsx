import { useEffect } from 'react'
import { useLiveQuery } from 'electric-sql/react'
import { genUUID } from 'electric-sql/util'
import { Items as Item } from './generated/client'
import { useElectric } from './ElectricProvider'

import './Example.css'

export const Example = () => {
  const { db } = useElectric()!
  const { results } = useLiveQuery(db.items.liveMany())

  useEffect(() => {
    const syncItems = async () => {
      // Purposely querying an unsynced table, will show a warning
      const items = await db.items.findMany()
      // Correctly gives me []
      console.log('Local items', items)


      // Resolves when the shape subscription has been established.
      const shape = await db.items.sync()
      console.log('Shape subscription established')


      // Resolves when the data has been synced into the local database.
      await shape.synced
      console.log('Shape data synced!')


      // Now the data should've been synced into the local database
      const syncedItems = await db.items.findMany()
      // But it still gives me []
      console.log('Synced items', syncedItems)


      // However, if I wait an arbitrary amount of time...
      const someTime = 15
      setTimeout(async () => {
        const syncedItems = await db.items.findMany()
        // ... it gives me ['some-totally-random-item']
        console.log(`Synced items (after ${someTime} ms timeout)`, syncedItems)
      }, someTime)
    }

    syncItems()
  }, [])

  const addItem = async () => {
    await db.items.create({
      data: {
        value: genUUID(),
      },
    })
  }

  const clearItems = async () => {
    await db.items.deleteMany()
  }

  const items: Item[] = results ?? []

  return (
    <div>
      <div className="controls">
        <button className="button" onClick={addItem}>
          Add
        </button>
        <button className="button" onClick={clearItems}>
          Clear
        </button>
      </div>
      {items.map((item: Item, index: number) => (
        <p key={index} className="item">
          <code>{item.value}</code>
        </p>
      ))}
    </div>
  )
}
