import {getDatabase, off, onValue, ref} from "firebase/database"
import {useContext, useEffect, useState} from "react"
import globalState from "../context"
import DB from "../database/DB"
import DatasetManager from "../managers/datasetManager"
import Manager from "../managers/manager"
import SecurityManager from "../managers/securityManager"
import useCurrentUser from "./useCurrentUser"

const useCalendarEvents = (userKey = null) => {
      const {state, setState} = useContext(globalState)
      const {refreshKey} = state
      const {currentUser} = useCurrentUser()
      const [calendarEvents, setCalendarEvents] = useState([])
      const [eventsAreLoading, setEventsAreLoading] = useState(true)
      const [error, setError] = useState(null)
      const path = `${DB.tables.calendarEvents}/${Manager.IsValid(userKey) ? userKey : currentUser?.key}`
      const queryKey = ["realtime", path]

      useEffect(() => {
            const database = getDatabase()
            const dataRef = ref(database, path)

            const listener = onValue(
                  dataRef,
                  async (snapshot) => {
                        const holidayEvents = await DB.getTable(DB.tables.holidayEvents)
                        const formattedEvents = DatasetManager.GetValidArray(snapshot.val())
                        const shared = await SecurityManager.getShareWithItems(currentUser, DB.tables.calendarEvents)
                        const formattedShared = DatasetManager.GetValidArray(shared)
                        const all = [...(formattedEvents || []), ...(formattedShared || []), ...(holidayEvents || [])]
                        if (Manager.IsValid(formattedEvents)) {
                              setCalendarEvents(DatasetManager.GetValidArray(all))
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
                  off(dataRef, "value", listener)
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