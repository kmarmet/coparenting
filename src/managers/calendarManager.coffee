import DB from "@db"
import "../prototypes"
import { child, getDatabase, ref, remove, set, update } from 'firebase/database'
import Manager from "./manager"
import LogManager from "./logManager"
import StringManager from "./stringManager"

export default CalendarManager =
  addMultipleCalEvents: (currentUser, newEvents) ->
    dbRef = ref(getDatabase())
    currentEvents = await DB.getTable("#{DB.tables.calendarEvents}/#{currentUser.phone}/")
    toAdd = [currentEvents..., newEvents...]
    try
      await set(child(dbRef, "#{DB.tables.calendarEvents}/#{currentUser.phone}/"), toAdd)
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
    currentEvents =  await DB.getTable("#{DB.tables.calendarEvents}/#{currentUser.phone}/")
    currentEvents = currentEvents.filter (n) -> n

    toAdd = []
    try
      if Manager.isValid(currentEvents)
        toAdd = [currentEvents..., newEvent]
      else
        toAdd = [newEvent]
      set(child(dbRef, "#{DB.tables.calendarEvents}/#{currentUser.phone}/"), toAdd)
    catch error
      LogManager.log(error.message, LogManager.logTypes.error, error.stack)

  updateEvent: (userPhone, prop, value, id) ->
    dbRef = getDatabase()
    key = null
    recordToUpdate
    tableRecords = await DB.getTable("#{DB.tables.calendarEvents}/#{userPhone}/")
    for record in tableRecords
      if record?.id is id
        key = await DB.getSnapshotKey("#{DB.tables.calendarEvents}/#{userPhone}/", record, 'id')
        record[prop] = value;
        recordToUpdate = record
    try
      update(ref(dbRef, "#{DB.tables.calendarEvents}/#{userPhone}/#{key}"), recordToUpdate)
    catch error
      LogManager.log(error.message, LogManager.logTypes.error, error.stack)

  deleteMultipleEvents: (events, currentUser) ->
    dbRef = ref(getDatabase())
    tableRecords = await DB.getTable("#{DB.tables.calendarEvents}/#{currentUser.phone}/")
    for record in tableRecords
      idToDelete = await DB.getSnapshotKey("#{DB.tables.calendarEvents}/#{currentUser.phone}/", record, 'id')
      await remove(child(dbRef, "#{DB.tables.calendarEvents}/#{currentUser.phone}/#{idToDelete}"))

  deleteAllHolidayEvents: () ->
    dbRef = ref(getDatabase())
    tableRecords = await DB.getTable("#{DB.tables.holidayEvents}")
    for record in tableRecords
      idToDelete = await DB.getSnapshotKey("#{DB.tables.holidayEvents}", record, 'id')
      await remove(child(dbRef, "#{DB.tables.holidayEvents}/#{idToDelete}"))

  deleteEvent: (currentUser, id) ->
    dbRef = ref(getDatabase())
    idToDelete = null
    tableRecords = await DB.getTable("#{DB.tables.calendarEvents}/#{currentUser.phone}/")
    for record in tableRecords
      if record?.id is id
        idToDelete = await DB.getSnapshotKey("#{DB.tables.calendarEvents}/#{currentUser.phone}/", record, 'id')
        try
          remove(child(dbRef, "#{DB.tables.calendarEvents}/#{currentUser.phone}/#{idToDelete}"))
        catch error
          LogManager.log(error.message, LogManager.logTypes.error, error.stack)