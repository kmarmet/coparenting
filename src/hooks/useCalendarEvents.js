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
                        const holidayEvents = await DB.GetTableData(DB.tables.holidayEvents)
                        const formattedEvents = DatasetManager.GetValidArray(snapshot.val())
                        const shared = await SecurityManager.getShareWithItems(currentUser, DB.tables.calendarEvents)
                        const formattedShared = DatasetManager.GetValidArray(shared)
                        const all = [...(formattedShared || []), ...(formattedEvents || []), ...(holidayEvents || [])]

                        // Sort: all-day events (no startTime) first, timed events after
                        const sortedEvents = all.sort((a, b) => {
                              // Determine priority
                              const getPriority = (event) => {
                                    const isAllDay = !event.startTime || event?.isHoliday
                                    const isVisitation = event.fromVisitationSchedule === true || event?.title?.toLowerCase().includes("visitation")

                                    if (isVisitation && isAllDay) return 0 // Visitation all-day highest priority
                                    if (isAllDay) return 1 // Other all-day events next
                                    return 2 // Timed events last
                              }

                              const aPriority = getPriority(a)
                              const bPriority = getPriority(b)

                              // First, compare by priority
                              if (aPriority !== bPriority) return aPriority - bPriority

                              // If both are timed events, sort by startTime
                              if (aPriority === 2 && bPriority === 2) {
                                    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
                              }
                        })

                        // Then continue
                        if (Manager.IsValid(sortedEvents)) {
                              setCalendarEvents(DatasetManager.GetValidArray(sortedEvents))
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