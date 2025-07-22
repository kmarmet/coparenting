import {getDatabase, off, onValue, ref} from "firebase/database"
import moment from "moment"
import {useContext, useEffect, useState} from "react"
import DatetimeFormats from "../constants/datetimeFormats"
import globalState from "../context"
import DB from "../database/DB"
import DatasetManager from "../managers/datasetManager"
import DateManager from "../managers/dateManager"
import Manager from "../managers/manager"
import ObjectManager from "../managers/objectManager"
import SecurityManager from "../managers/securityManager"
import useCurrentUser from "./useCurrentUser"

const useEventsOfDay = () => {
      const {state, setState} = useContext(globalState)
      const {selectedCalendarDate, refreshKey} = state
      const {currentUser} = useCurrentUser()
      const [eventsOfDay, setEventsOfDay] = useState([])
      const [eventsAreLoading, setEventsAreLoading] = useState(true)
      const [error, setError] = useState(null)
      const path = `${DB.tables.calendarEvents}/${currentUser?.key}`
      const queryKey = ["realtime", path]

      useEffect(() => {
            const database = getDatabase()
            const dataRef = ref(database, path)

            const listener = onValue(
                  dataRef,
                  async (snapshot) => {
                        const editDate = Manager.IsValid(selectedCalendarDate)
                              ? moment(selectedCalendarDate).format(DatetimeFormats.dateForDb)
                              : moment().format(DatetimeFormats.dateForDb)

                        // Calendar Events
                        const calendarEvents = DatasetManager.GetValidArray(snapshot.val())

                        // Shared Calendar Events
                        const shared = await SecurityManager.getShareWithItems(currentUser, DB.tables.calendarEvents)
                        const formattedShared = DatasetManager.GetValidArray(shared)

                        // Fetch and prepare holidays
                        let holidays = (await DateManager.GetHolidaysAsEvents()) || []

                        // Filter holidays that match the editDate
                        let holidaysToLoop = holidays.filter(
                              (h) => moment(h.startDate).format(DatetimeFormats.dateForDb) === moment(editDate).format(DatetimeFormats.dateForDb)
                        )

                        // Split events into those with time vs without time in a single pass
                        let eventsWithoutTime = []
                        let eventsWithTime = []

                        calendarEvents.forEach((event) => {
                              if (Manager.IsValid(event?.startTime)) {
                                    eventsWithTime.push(event)
                              } else {
                                    eventsWithoutTime.push(event)
                              }
                        })

                        // All Day Events
                        const allDayEvents = [...(eventsWithoutTime || []), ...(holidaysToLoop || [])]
                        const visitationEvents = allDayEvents.filter((x) => x?.fromVisitationSchedule === true)

                        let allEvents = [
                              ...(eventsWithoutTime || []),
                              ...(holidaysToLoop || []),
                              ...(visitationEvents || []),
                              ...(eventsWithTime || []),
                              ...(formattedShared || []),
                        ]

                        const today = moment(editDate).startOf("day")

                        // Get Events For Selected Date
                        const selectedDateBasedEvents = allEvents.filter((event) => {
                              const _editDate = moment(event.startDate, DatetimeFormats.dateForDb)
                              return _editDate.isSame(today, "day")
                        })

                        // Sorted Events
                        const sortedEvents = DatasetManager.SortByTime(
                              selectedDateBasedEvents.map((x) => ObjectManager.CleanObject(x)),
                              "asc"
                        )

                        const formattedEvents = DatasetManager.GetValidArray(sortedEvents)

                        // Set events of day state
                        if (Manager.IsValid(formattedEvents)) {
                              setEventsOfDay(formattedEvents)
                        } else {
                              setEventsOfDay([])
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
      }, [path, currentUser, selectedCalendarDate])

      return {
            eventsOfDay,
            eventsAreLoading,
            error,
            queryKey,
      }
}

export default useEventsOfDay