import DB from "@db"
import "../prototypes"
import { child, getDatabase, ref, remove, set } from 'firebase/database'
import Manager from "./manager"
import {
  formatFileName,
  formatNameFirstNameOnly,
  formatTitleWords,
  getFirstWord,
  isAllUppercase,
  removeFileExtension,
  removeSpacesAndLowerCase,
  spaceBetweenWords,
  stringHasNumbers,
  toCamelCase,
  uppercaseFirstLetterOfAllWords,
  wordCount
} from "../globalFunctions"
import DatasetManager from "./datasetManager"
import LogManager from "./logManager"

export default CalendarManager =
  formatEventTitle: (title) =>
    if title and title.length > 0
      title = uppercaseFirstLetterOfAllWords(title)
      title = formatTitleWords(title)
      return title
  addMultipleCalEvents: (currentUser, newEvents) ->
    dbRef = ref(getDatabase())
    currentEvents = await DB.getTable(DB.tables.calendarEvents)
    if !Array.isArray(newEvents)
      newEvents = [newEvents]
    newEvents = DatasetManager.getUniqueArrayByProp(newEvents, "startDate", "startDate")
    merged = DatasetManager.mergeMultiple([currentEvents,newEvents])
    try
      await set(child(dbRef, "#{DB.tables.calendarEvents}"), merged)
    catch error
      LogManager.log(error.message, LogManager.logTypes.error, error.stack)
  setHolidays: (holidays) ->
    dbRef = ref(getDatabase())
    currentEvents = await DB.getTable(DB.tables.calendarEvents)
    eventsToAdd = [currentEvents..., holidays...].filter((x) -> x?).flat()
    try
      await set(child(dbRef, "#{DB.tables.calendarEvents}"), eventsToAdd)
    catch error
      LogManager.log(error.message, LogManager.logTypes.error, error.stack)
  addCalendarEvent: (data) ->
    dbRef = ref(getDatabase())
    currentEvents =  Manager.convertToArray(await DB.getTable(DB.tables.calendarEvents))
    currentEvents = currentEvents.filter (n) -> n
    try
      set(child(dbRef, "#{DB.tables.calendarEvents}"), [currentEvents..., data])
    catch error
      LogManager.log(error.message, LogManager.logTypes.error, error.stack)
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
        try
          remove(child(dbRef, "#{tableName}/#{idToDelete}/"))
        catch error
          LogManager.log(error.message, LogManager.logTypes.error, error.stack)