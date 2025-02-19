import DB from "../database/DB"
import { child, getDatabase, ref, remove, set, update } from 'firebase/database'
import Manager from "./manager"
import LogManager from "./logManager"
import DateFormats from "../constants/dateFormats"
import moment from "moment"
import DateManager from "./dateManager"
import CalendarMapper from "../mappers/calMapper"
import DatasetManager from "./datasetManager"
import CalendarEvent from "../models/calendarEvent"
import ObjectManager from "./objectManager"
import ModelNames from "../models/modelNames"

export default CalendarManager =
  addMultipleCalEvents: (currentUser, newEvents, isRangeClonedOrRecurring = false) ->
    dbRef = ref(getDatabase())
    currentEvents = await DB.getTable("#{DB.tables.calendarEvents}/#{currentUser.key}")
    multipleDatesId = Manager.getUid()

    if isRangeClonedOrRecurring = true
      for event in newEvents
        event.multipleDatesId = multipleDatesId

    if !Manager.isValid(currentEvents)
      toAdd = [...newEvents]
    else
      toAdd = [currentEvents..., newEvents...]
    try
      await set(child(dbRef, "#{DB.tables.calendarEvents}/#{currentUser.key}/"), toAdd)
    catch error
      LogManager.log(error.message, LogManager.logTypes.error, error.stack)

  buildArrayOfEvents: (currentUser, eventObject, arrayType = "recurring", startDate, endDate) ->
    datesToPush = []
    datesToIterate = []

  # DATE RANGE / CLONED
    if arrayType == "range" || arrayType == "cloned"
      datesToIterate = DateManager.getDateRangeDates(startDate, endDate)

  # REPEATING
    if arrayType == "recurring"
      datesToIterate = CalendarMapper.recurringEvents(
        eventObject.repeatInterval,
        moment(startDate, DateFormats.fullDatetime).format(DateFormats.monthDayYear),
        endDate
      )

    for date in datesToIterate
      dateObject = new CalendarEvent()
      # Required
      dateObject.title = eventObject.title
      dateObject.id = Manager.getUid()
      dateObject.startDate = moment(date).format(DateFormats.dateForDb)
      dateObject.endDate = moment(endDate).format(DateFormats.dateForDb)

      if arrayType == "range"
        dateObject.staticStartDate = moment(datesToIterate[0]).format(DateFormats.dateForDb)

      # Not Required
      dateObject.directionsLink = Manager.getDirectionsLink(eventObject.location)
      dateObject.location = eventObject.location
      dateObject.children = eventObject.children
      dateObject.ownerKey = currentUser?.key
      dateObject.createdBy = currentUser?.name
      dateObject.phone = eventObject.phone
      dateObject.shareWith = DatasetManager.getUniqueArray(eventObject.shareWith, true)
      dateObject.notes = eventObject.notes
      dateObject.websiteUrl = eventObject.websiteUrl
      dateObject.isRepeating = eventObject.isRepeating
      dateObject.isDateRange = eventObject.isDateRange
#      dateObject.isCloned = Manager.isValid(clonedDates)

      # Times
      if Manager.isValid(eventObject.startTime)
        dateObject.startTime = moment(eventObject.startTime).format(DateFormats.timeForDb)
      if Manager.isValid(eventObject.endTime)
        dateObject.endTime = moment(eventObject.endTime).format(DateFormats.timeForDb)

      dateObject.reminderTimes = eventObject.reminderTimes
      dateObject.recurrenceInterval = eventObject.repeatInterval
      dateObject = ObjectManager.cleanObject(dateObject, ModelNames.calendarEvent)
      datesToPush.push dateObject

    console.log datesToPush
    return datesToPush

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
    currentEvents =  await DB.getTable("#{DB.tables.calendarEvents}/#{currentUser.key}")
    currentEvents = currentEvents.filter (n) -> n

    toAdd = []
    try
      if Manager.isValid(currentEvents)
        toAdd = [currentEvents..., newEvent]
      else
        toAdd = [newEvent]
      set(child(dbRef, "#{DB.tables.calendarEvents}/#{currentUser.key}/"), toAdd)
    catch error
      LogManager.log(error.message, LogManager.logTypes.error, error.stack)

  updateEvent: (userKey, prop, value, id) ->
    dbRef = getDatabase()
    key = null
    recordToUpdate
    tableRecords = await DB.getTable("#{DB.tables.calendarEvents}/#{userKey}")
    for record in tableRecords
      if record?.id is id
        key = await DB.getSnapshotKey("#{DB.tables.calendarEvents}/#{userKey}", record, 'id')
        record[prop] = value;
        recordToUpdate = record
    try
      update(ref(dbRef, "#{DB.tables.calendarEvents}/#{userKey}/#{key}"), recordToUpdate)
    catch error
      LogManager.log(error.message, LogManager.logTypes.error, error.stack)

  updateMultipleEvents: (events, currentUser) ->
    dbRef = getDatabase()
    path = "#{DB.tables.calendarEvents}/#{currentUser.key}";
    existingEvents = await DB.getTable(path)
    if Manager.isValid(events)
      for updatedEvent in events
        for event in existingEvents
          if event.id == updatedEvent.id
            key = await DB.getSnapshotKey(path, event, 'id')
            await DB.deleteByPath("#{path}/#{key}")
            await DB.add("#{path}/#{key}", event)
            await update(ref(dbRef, "#{path}/#{key}"), updatedEvent)

  deleteMultipleEvents: (events, currentUser) ->
    dbRef = ref(getDatabase())
    tableRecords = await DB.getTable("#{DB.tables.calendarEvents}/#{currentUser.key}")
    idsToDelete = events.map (x) -> x.id
    if Manager.isValid(tableRecords)
      for record in tableRecords
        if Manager.contains(idsToDelete, record.id)
          await CalendarManager.deleteEvent(currentUser, record.id)

  deleteAllHolidayEvents: () ->
    dbRef = ref(getDatabase())
    tableRecords = await DB.getTable("#{DB.tables.holidayEvents}")
    for record in tableRecords
      idToDelete = await DB.getSnapshotKey("#{DB.tables.holidayEvents}", record, 'id')
      await remove(child(dbRef, "#{DB.tables.holidayEvents}/#{idToDelete}"))

  deleteEvent: (currentUser, id) ->
    dbRef = ref(getDatabase())
    idToDelete = null
    tableRecords = await DB.getTable("#{DB.tables.calendarEvents}/#{currentUser.key}/")
    for record in tableRecords
      if record?.id is id
        idToDelete = await DB.getSnapshotKey("#{DB.tables.calendarEvents}/#{currentUser.key}/", record, 'id')
        try
          remove(child(dbRef, "#{DB.tables.calendarEvents}/#{currentUser.key}/#{idToDelete}"))
        catch error
          LogManager.log(error.message, LogManager.logTypes.error, error.stack)