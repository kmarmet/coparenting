import DB from "@db"
import "../prototypes"
import calMapper from "../mappers/calMapper"
import { child, get, getDatabase, push, ref, remove, set, update } from 'firebase/database'
import Manager from "./manager"

export default CalendarManager =
  getUniqueArrayOfObjects: (arr, key) =>
    output = Object.entries(Object.assign({}, ...arr))
    for obj in output
      obj[1]
  formatEventTitle: (title) =>
    if title and title.length > 0
      title = title.replaceAll("To", "to").replaceAll("Vs", "vs").replaceAll("With", "with").replaceAll("At","at")
      return title.uppercaseFirstLetterOfAllWords()
  hideCalendar: () =>
    allCals = document.querySelectorAll(".flatpickr-calendar")
    if allCals && allCals.length > 0
      allCals.forEach((cal) => cal.remove())
  addMultipleCalEvents: (newEvents) ->
    dbRef = ref(getDatabase())
    currentEvents = await DB.getTable(DB.tables.calendarEvents)
    currentEvents = [currentEvents] unless Array.isArray(currentEvents)

    # Delete Existing
    for event in currentEvents
      for newEvent in newEvents
        if event.fromDate is newEvent.fromDate and event.title is newEvent.title
          await DB.delete(DB.tables.calendarEvents, event.id)

    eventsToAdd = [currentEvents..., newEvents...].filter((x) -> x?).flat()

    try
      await set(child(dbRef, "#{DB.tables.calendarEvents}"), eventsToAdd)
    catch error
  addCalendarEvent: (data) ->
    dbRef = ref(getDatabase())
    currentEvents = await DB.getTable(DB.tables.calendarEvents)
    currentEvents = [] unless Array.isArray(currentEvents)
    currentEvents = currentEvents.filter (n) -> n
    set(child(dbRef, "#{DB.tables.calendarEvents}"), [currentEvents..., data])
  deleteEvent: (tableName, id) ->
    dbRef = ref(getDatabase())
    idToDelete = null
    tableRecords = await DB.getTable(tableName)

    if Manager.isValid(tableRecords, true)
      tableRecords = DB.convertKeyObjectToArray(tableRecords) unless Array.isArray(tableRecords)

      for record in tableRecords
        if record?.id is id
          idToDelete = await DB.getSnapshotKey(tableName, record, 'id')
          remove(child(dbRef, "#{tableName}/#{idToDelete}/"))



# Error handling can be added here if needed


