import DB from "@db"
import "../prototypes"
import calMapper from "../mappers/calMapper"
import { child, get, getDatabase, push, ref, remove, set, update } from 'firebase/database'
import Manager from "./manager"
import {
  toCamelCase,
  getFirstWord,
  formatFileName,
  isAllUppercase,
  removeSpacesAndLowerCase,
  stringHasNumbers,
  wordCount,
  uppercaseFirstLetterOfAllWords,
  spaceBetweenWords,
  formatNameFirstNameOnly,
  removeFileExtension,
} from "../globalFunctions"
export default CalendarManager =
  getUniqueArrayOfObjects: (arr, key) =>
    output = Object.entries(Object.assign({}, ...arr))
    for obj in output
      obj[1]
  formatEventTitle: (title) =>
    if title and title.length > 0
      title = uppercaseFirstLetterOfAllWords(title)
      title = title.replaceAll("To", "to").replaceAll("Vs", "vs").replaceAll("With", "with").replaceAll("At","at").replaceAll("From", "from").replaceAll("The", "the")
      return title
  hideCalendar: () =>
    allCals = document.querySelectorAll(".flatpickr-calendar")
    if allCals && allCals.length > 0
      allCals.forEach((cal) => cal.remove())
  addMultipleCalEvents: (newEvents) ->
    dbRef = ref(getDatabase())
    currentEvents = Manager.convertToArray(await DB.getTable(DB.tables.calendarEvents))
    eventsToAdd = [currentEvents..., newEvents...].filter((x) -> x?).flat()

    try
      await set(child(dbRef, "#{DB.tables.calendarEvents}"), eventsToAdd)
    catch error
  addCalendarEvent: (data) ->
    dbRef = ref(getDatabase())
    currentEvents =  Manager.convertToArray(await DB.getTable(DB.tables.calendarEvents))
    currentEvents = currentEvents.filter (n) -> n
    set(child(dbRef, "#{DB.tables.calendarEvents}"), [currentEvents..., data])
  deleteMultipleEvents: (events, currentUser) ->
    dbRef = ref(getDatabase())
    tableRecords = Manager.convertToArray(await DB.getTable(DB.tables.calendarEvents))
    userHolidays = tableRecords.filter (x) => x.phone == currentUser.phone && x.isHoliday == true
    for holiday in userHolidays
      idToDelete = await DB.getSnapshotKey(DB.tables.calendarEvents, holiday, 'id')
      await remove(child(dbRef, "#{DB.tables.calendarEvents}/#{idToDelete}/"))
  deleteEvent: (tableName, id) ->
    dbRef = ref(getDatabase())
    idToDelete = null
    tableRecords = Manager.convertToArray(await DB.getTable(tableName))
    for record in tableRecords
      if record?.id is id
        idToDelete = await DB.getSnapshotKey(tableName, record, 'id')
        remove(child(dbRef, "#{tableName}/#{idToDelete}/"))



# Error handling can be added here if needed


