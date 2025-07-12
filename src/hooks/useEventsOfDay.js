import {getDatabase, off, onValue, ref} from 'firebase/database'
import moment from 'moment'
import {useContext, useEffect, useState} from 'react'
import DatetimeFormats from '../constants/datetimeFormats'
import globalState from '../context'
import DB from '../database/DB'
import DatasetManager from '../managers/datasetManager'
import Manager from '../managers/manager'
import ObjectManager from '../managers/objectManager'
import SecurityManager from '../managers/securityManager'
import useCurrentUser from './useCurrentUser'

const useEventsOfDay = () => {
    const {state, setState} = useContext(globalState)
    const {dateToEdit} = state
    const {currentUser} = useCurrentUser()
    const [eventsOfDay, setEventsOfDay] = useState([])
    const [eventsAreLoading, setEventsAreLoading] = useState(true)
    const [error, setError] = useState(null)
    const path = `${DB.tables.calendarEvents}/${currentUser?.key}`
    const queryKey = ['realtime', path]

    useEffect(() => {
        const database = getDatabase()
        const dataRef = ref(database, path)

        const listener = onValue(
            dataRef,
            async (snapshot) => {
                const editDate = Manager.IsValid(dateToEdit)
                    ? moment(dateToEdit).format(DatetimeFormats.dateForDb)
                    : moment().format(DatetimeFormats.dateForDb)

                // Calendar Events
                const calendarEvents = DatasetManager.GetValidArray(snapshot.val())

                // Shared Calendar Events
                const shared = await SecurityManager.getShareWithItems(currentUser, DB.tables.calendarEvents)
                const formattedShared = DatasetManager.GetValidArray(shared)

                // Holidays Events
                let holidays = await DB.getTable(DB.tables.holidayEvents)
                holidays = DatasetManager.sortByProperty(holidays, 'startDate', 'asc') ?? []
                const holidaysToLoop = holidays.filter(
                    (x) => moment(x.startDate).format(DatetimeFormats.dateForDb) === moment(editDate).format(DatetimeFormats.dateForDb)
                )

                // Time Based Events
                const eventsWithoutTime = calendarEvents.filter((x) => !Manager.IsValid(x?.startTime))
                const eventsWithTime = calendarEvents.filter((x) => Manager.IsValid(x?.startTime))

                // All Day Events
                const allDayEvents = DatasetManager.CombineArrays(eventsWithoutTime, holidaysToLoop)
                const visitationEvents = allDayEvents.filter((x) => x?.fromVisitationSchedule === true)
                const extendedAllDayEvents = DatasetManager.CombineArrays(visitationEvents, allDayEvents)
                const eventsWithTimeFirst = DatasetManager.CombineArrays(eventsWithTime, allDayEvents)
                const allCurrentUserEvents = DatasetManager.CombineArrays(extendedAllDayEvents, eventsWithTimeFirst)
                const allEvents = DatasetManager.CombineArrays(allCurrentUserEvents, formattedShared)
                const today = moment(editDate).startOf('day')

                // Get Events For Selected Date
                const selectedDateBasedEvents = allEvents.filter((event) => {
                    const _editDate = moment(event.startDate, DatetimeFormats.dateForDb)
                    return _editDate.isSame(today, 'day')
                })

                // Sorted Events
                const sortedEvents = DatasetManager.SortByTime(
                    selectedDateBasedEvents.map((x) => ObjectManager.CleanObject(x)),
                    'asc'
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
            off(dataRef, 'value', listener)
        }
    }, [path, currentUser, dateToEdit])

    return {
        eventsOfDay,
        eventsAreLoading,
        error,
        queryKey,
    }
}

export default useEventsOfDay