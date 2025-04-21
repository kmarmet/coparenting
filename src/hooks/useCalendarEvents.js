import {getDatabase, off, onValue, ref} from 'firebase/database'
import {useContext, useEffect, useState} from 'react'
import Manager from '../managers/manager'
import globalState from '../context'
import DB from '../database/DB'
import SecurityManager from '../managers/securityManager'
import useCurrentUser from './useCurrentUser'

const useCalendarEvents = () => {
  const {state, setState} = useContext(globalState)
  const {currentUser} = useCurrentUser()
  const [calendarEvents, setCalendarEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const path = `${DB.tables.calendarEvents}/${currentUser?.key}`
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
        setIsLoading(false)
      },
      (err) => {
        setError(err)
        setIsLoading(false)
      }
    )

    return () => {
      off(dataRef, 'value', listener)
    }
  }, [path, currentUser])

  return {
    calendarEvents,
    isLoading,
    error,
    queryKey,
  }
}

export default useCalendarEvents