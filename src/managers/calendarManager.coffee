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
import CalendarMapper from "../mappers/calMapper"

export default CalendarManager =
  formatEventTitle: (title) ->
    if title and title.length > 0
      title = uppercaseFirstLetterOfAllWords(title)
      title = formatTitleWords(title)
      return title

  getAllEventsForUser: (currentUser) ->
    all = await DB.getTable("#{DB.tables.calendarEvents}/#{currentUser.phone}")
    console.log(all)

  addMultipleCalEvents: (currentUser, newEvents) ->
    dbRef = ref(getDatabase())
    currentEvents = await DB.getTable(CalendarMapper.currentUserEventPath(currentUser, newEvents[0]))
    toAdd = [currentEvents..., newEvents...]
    try
      await set(child(dbRef, CalendarMapper.currentUserEventPath(currentUser, newEvents[0])), toAdd)
    catch error
      LogManager.log(error.message, LogManager.logTypes.error, error.stack)

  setHolidays: (holidays) ->
    dbRef = ref(getDatabase())
    currentEvents = await DB.getTable(DB.tables.holidayEvents)
    eventsToAdd = [currentEvents..., holidays...].filter((x) -> x?).flat()
    try
      await set(child(dbRef, "#{DB.tables.holidayEvents}"), eventsToAdd)
    catch error
      LogManager.log(error.message, LogManager.logTypes.error, error.stack)

  addCalendarEvent: (currentUser, newEvent) ->
    dbRef = ref(getDatabase())
    currentEvents =  await DB.getTable(CalendarMapper.currentUserEventPath(currentUser, newEvent))
    currentEvents = currentEvents.filter (n) -> n
    toAdd = []
    try
      if Manager.isValid(currentEvents)
        toAdd = [currentEvents..., newEvent]
      else
        toAdd = [newEvent]
      set(child(dbRef, CalendarMapper.currentUserEventPath(currentUser, newEvent)), toAdd)
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
    dbRef = ref(getDatabase())
    tableRecords = await DB.getTable("#{DB.tables.calendarEvents}/#{currentUser.phone}/#{eventParentName}")
    for record in tableRecords
      idToDelete = await DB.getSnapshotKey("#{DB.tables.calendarEvents}/#{currentUser.phone}/#{eventParentName}", record, 'id')
      await remove(child(dbRef, "#{DB.tables.calendarEvents}/#{currentUser.phone}/#{eventParentName}/#{idToDelete}"))

  deleteAllHolidayEvents: () ->
    dbRef = ref(getDatabase())
    tableRecords = await DB.getTable("#{DB.tables.holidayEvents}")
    for record in tableRecords
      idToDelete = await DB.getSnapshotKey("#{DB.tables.holidayEvents}", record, 'id')
      await remove(child(dbRef, "#{DB.tables.holidayEvents}/#{idToDelete}"))

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