import {useEffect, useState} from 'react'
import DB from '../database/DB'
import DatasetManager from '../managers/datasetManager'

const cache = new Map()

const useHolidays = (currentUserKey, fromApi = false) => {
  const cacheKey = currentUserKey

  const [holidays, setHolidays] = useState(null)
  const [error, setError] = useState(null)
  const [holidaysAreLoading, setHolidaysAreLoading] = useState(true)

  useEffect(() => {
    if (cache.has(cacheKey)) return // already cached
    const controller = new AbortController()
    const {signal} = controller

    const fetchData = async () => {
      let result = []
      setHolidaysAreLoading(true)
      try {
        if (fromApi) {
          const response = await fetch('https://date.nager.at/api/v3/PublicHolidays/2019/US', {currentUserKey, signal})
          const _holidays = await response.json()
          result = DatasetManager.getUniqueArray(_holidays, true)
        } else {
          let _holidays = await DB.getTable(DB.tables.holidayEvents)
          result = _holidays
        }
        cache.set(cacheKey, result)
        setHolidays(result)
        setError(null)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Unknown error')
        }
      } finally {
        setHolidaysAreLoading(false)
      }
    }

    fetchData().then((r) => r)

    return () => controller.abort() // Cleanup on unmount or url/options change
  }, fromApi)

  return {holidays, error, holidaysAreLoading}
}
export default useHolidays