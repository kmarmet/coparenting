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
import LogManager from "./logManager"

export default CalendarManager =
  formatEventTitle: (title) ->
    if title and title.length > 0
      title = uppercaseFirstLetterOfAllWords(title)
      title = formatTitleWords(title)
      return title
  addMultipleCalEvents: (currentUser, newEvents) ->
    eventsAreShared = false
    eventsWithShareWith = newEvents.filter (x) -> Manager.isValid(x.shareWith)
    if eventsWithShareWith.length > 0
      eventsAreShared = true
    eventsOrSharedEvents = if eventsAreShared then "sharedEvents" else "events"
    dbRef = ref(getDatabase())
    currentEvents = await DB.getTable("#{DB.tables.calendarEvents}/#{currentUser.phone}/#{eventsOrSharedEvents}")
    console.log(currentEvents)
    console.log(newEvents)
    toAdd = [currentEvents..., newEvents...]
    try
      await set(child(dbRef, "#{DB.tables.calendarEvents}/#{currentUser.phone}/#{eventsOrSharedEvents}"), toAdd)
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

  addCalendarEvent: (currentUser, newEvent) ->
    dbRef = ref(getDatabase())
    currentEvents =  await DB.getTable("#{DB.tables.calendarEvents}/#{currentUser.phone}/events")
    currentEvents = currentEvents.filter (n) -> n
    toAdd = []
    try
      if Manager.isValid(currentEvents)
        toAdd = [currentEvents..., newEvent]
      else
        toAdd = [newEvent]
      set(child(dbRef, "#{DB.tables.calendarEvents}/#{currentUser.phone}/events"), toAdd)
    catch error
      LogManager.log(error.message, LogManager.logTypes.error, error.stack)

  addSharedEvent: (currentUser,newEvent) ->
    dbRef = ref(getDatabase())
    currentEvents =  Manager.convertToArray(await DB.getTable("#{DB.tables.calendarEvents}/#{currentUser.phone}/sharedEvents"))
    currentEvents = currentEvents.filter (n) -> n
    try
      set(child(dbRef, "#{DB.tables.calendarEvents}/#{currentUser.phone}/sharedEvents"), [currentEvents..., newEvent])
    catch error
      LogManager.log(error.message, LogManager.logTypes.error, error.stack)

  deleteMultipleEvents: (events, currentUser, eventParentName = "events") ->
    console.log("#{DB.tables.calendarEvents}/#{currentUser.phone}/#{eventParentName}")
    dbRef = ref(getDatabase())
    tableRecords = await DB.getTable("#{DB.tables.calendarEvents}/#{currentUser.phone}/#{eventParentName}")
    for record in tableRecords
      idToDelete = await DB.getSnapshotKey("#{DB.tables.calendarEvents}/#{currentUser.phone}/#{eventParentName}", record, 'id')
      await remove(child(dbRef, "#{DB.tables.calendarEvents}/#{currentUser.phone}/#{eventParentName}/#{idToDelete}"))

  deleteEvent: (currentUser, eventParentName = "events", id) ->
    dbRef = ref(getDatabase())
    idToDelete = null
    tableRecords = await DB.getTable("#{DB.tables.calendarEvents}/#{currentUser.phone}/#{eventParentName}")
    for record in tableRecords
      if record?.id is id
        idToDelete = await DB.getSnapshotKey("#{DB.tables.calendarEvents}/#{currentUser.phone}/#{eventParentName}", record, 'id')
        try
          remove(child(dbRef, "#{DB.tables.calendarEvents}/#{currentUser.phone}/#{eventParentName}/#{idToDelete}"))
        catch error
          LogManager.log(error.message, LogManager.logTypes.error, error.stack)