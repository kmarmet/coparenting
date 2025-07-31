import {getDatabase, off, onValue, ref} from "firebase/database"
import {useContext, useEffect, useState} from "react"
import globalState from "../context"
import DB from "../database/DB"
import DatasetManager from "../managers/datasetManager"
import DateManager from "../managers/dateManager"
import Manager from "../managers/manager"
import ObjectManager from "../managers/objectManager"
import SecurityManager from "../managers/securityManager"
import useCurrentUser from "./useCurrentUser"

const useEventsOfDay = (selectedCalendarDate) => {
    const {state, setState} = useContext(globalState)
    const {refreshKey} = state
    const {currentUser} = useCurrentUser()
    const [genericEventsOfDay, setGenericEventsOfDay] = useState([])
    const [allEventsOfDay, setAllEventsOfDay] = useState([])
    const [holidayEventsOfDay, setHolidayEventsOfDay] = useState([])
    const [visitationEventsOfDay, setVisitationEventsOfDay] = useState([])
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
                // Calendar Events
                const calendarEvents = DatasetManager.GetValidArray(snapshot.val())

                // Early Exit if no Calendar Events Exist
                if (!Manager.IsValid(calendarEvents)) {
                    setGenericEventsOfDay([])
                    setEventsAreLoading(false)
                    return
                }

                // Shared Calendar Events
                const rawShared = await SecurityManager.getShareWithItems(currentUser, DB.tables.calendarEvents)
                const shared = rawShared?.filter((x) => x?.startDate === selectedCalendarDate)
                const standardEvents = calendarEvents.filter((x) => x?.owner?.key === currentUser?.key && x?.startDate === selectedCalendarDate)

                const combinedEvents = DatasetManager.CombineArrays(standardEvents, shared, true, true)
                const formatted_one = DatasetManager.GetValidArray(combinedEvents)
                setGenericEventsOfDay(formatted_one)

                // Fetch and prepare holidays
                let holidays = (await DateManager.GetHolidaysAsEvents()) || []

                // Filter holidays that match the editDate
                let holidayEvents = holidays?.filter((x) => x?.isHoliday === true && x?.startDate === selectedCalendarDate) || []
                setHolidayEventsOfDay(DatasetManager.GetValidArray(holidayEvents, true, true))

                // Split events into those with time vs without time in a single pass
                let eventsWithoutTime = []
                let eventsWithTime = []

                combinedEvents.forEach((event) => {
                    if (Manager.IsValid(event?.startTime, true)) {
                        eventsWithTime.push(event)
                    } else {
                        eventsWithoutTime.push(event)
                    }
                })

                // All Day Events
                const allDayEvents = [...(eventsWithoutTime || []), ...(holidayEvents || [])]
                const visitationEvents = allDayEvents?.filter((x) => x?.fromVisitationSchedule === true)
                setVisitationEventsOfDay(DatasetManager.GetValidArray(visitationEvents, true, true))

                let allEvents = [
                    ...(eventsWithoutTime || []),
                    ...(holidayEvents || []),
                    ...(visitationEvents || []),
                    ...(eventsWithTime || []),
                    ...(formatted_one || []),
                ]

                const sortedEvents = DatasetManager.SortByTime(
                    allEvents.map((x) => ObjectManager.CleanObject(x)),
                    "asc"
                )

                const formattedEvents = DatasetManager.GetValidArray(sortedEvents, true, true) || []

                // Set events of day state
                setAllEventsOfDay(formattedEvents)
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
        genericEventsOfDay,
        allEventsOfDay,
        holidayEventsOfDay,
        visitationEventsOfDay,
        eventsAreLoading,
        error,
        queryKey,
    }
}

export default useEventsOfDay