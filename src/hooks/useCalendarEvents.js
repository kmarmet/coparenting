import {getDatabase, off, onValue, ref} from 'firebase/database'
import {useContext, useEffect, useState} from 'react'
import globalState from '../context'
import DB from '../database/DB'
import Manager from '../managers/manager'
import SecurityManager from '../managers/securityManager'
import useCurrentUser from './useCurrentUser'

const useCalendarEvents = (userKey = null) => {
  const {state, setState} = useContext(globalState)
  const {currentUser} = useCurrentUser()
  const [calendarEvents, setCalendarEvents] = useState([])
  const [eventsAreLoading, setEventsAreLoading] = useState(true)
  const [error, setError] = useState(null)
  const path = `${DB.tables.calendarEvents}/${Manager.isValid(userKey) ? userKey : currentUser?.key}`
  const queryKey = ['realtime', path]

  useEffect(() => {
    const database = getDatabase()
    const dataRef = ref(database, path)

    const listener = onValue(
      dataRef,
      async (snapshot) => {
        const formattedEvents = Manager.convertToArray(snapshot.val()).flat()
        const shared = await SecurityManager.getShareWithItems(currentUser, DB.tables.calendarEvents)
        const formattedShared = Manager.convertToArray(shared).flat()
        if (Manager.isValid(formattedEvents)) {
          setCalendarEvents([...formattedEvents, ...formattedShared].flat())
        } else {
          setCalendarEvents([])
        }
        setEventsAreLoading(false)
      },
      (err) => {
        setError(err)
        setEventsAreLoading(false)
      }
    )

    return () => {
      off(dataRef, 'value', listener)
    }
  }, [path, currentUser])

  return {
    calendarEvents,
    eventsAreLoading,
    error,
    queryKey,
  }
}

export default useCalendarEvents