import DB from "../database/DB"
import {child, getDatabase, ref, remove, set, update} from 'firebase/database'
import Manager from "./manager"
import LogManager from "./logManager"
import DateFormats from "../constants/datetimeFormats"
import moment from "moment"
import DateManager from "./dateManager"
import CalendarMapper from "../mappers/calMapper"
import DatasetManager from "./datasetManager"
import CalendarEvent from "../models/new/calendarEvent"
import * as Sentry from '@sentry/react'
import ObjectManager from "./objectManager"
import EventCategories from "../constants/eventCategories"

export default CalendarManager =
  AddMultipleCalEvents: (currentUser, newEvents, isRangeClonedOrRecurring = false) ->
    dbRef = ref getDatabase()
    userEventsPath = "#{DB.tables.calendarEvents}/#{currentUser.key}"
    
    try
    # Fetch existing events or default to []
      currentEvents = await DB.GetTableData(userEventsPath) or []
      
      # If cloning/recurring, generate a shared multipleDatesId
      multipleDatesId = if isRangeClonedOrRecurring then Manager.GetUid() else null
      
      # Process new events (add multipleDatesId if needed)
      processedNewEvents = newEvents.map (event) ->
        if multipleDatesId?
          Object.assign {}, event, multipleDatesId: multipleDatesId
        else
          event
      
      # Merge current events + new ones
      toAdd = (if Array.isArray(currentEvents) then currentEvents else []).concat processedNewEvents
      
      # Save to DB
      await set child(dbRef, userEventsPath), toAdd
    
    catch error
      LogManager.Log error.message, LogManager.LogTypes.error, error.stack
      
  MapCategoryToParent: (categoryName) ->
    categories = EventCategories
    
    for group in categories
      if (group.categories.includes(categoryName))
        return group.parentCategory;
        
    return null;
    
     # Example Usage:  console.log categoryToParentMap["Marathon"] # "Sports & Fitness 🏃"

  BuildArrayOfEvents: (currentUser, eventObject, arrayType = "recurring", startDate, endDate) ->
    datesToPush = []
    datesToIterate = []

    # DATE RANGE / CLONED
    if arrayType == "range" || arrayType == "cloned"
      datesToIterate = DateManager.GetDateRangeDates(startDate, endDate)

    console.log("datesToIterate", datesToIterate)

    # REPEATING
    if arrayType == "recurring"
      datesToIterate = CalendarMapper.recurringEvents(
        eventObject.recurringInterval,
        moment(startDate).format(DateFormats.monthDayYear),
        endDate
      )

    for date in datesToIterate
      dateObject = new CalendarEvent()
      # Required
      dateObject.title = eventObject.title
      dateObject.startDate = moment(date).format(DateFormats.dateForDb)
      dateObject.endDate = moment(endDate).format(DateFormats.dateForDb)

      if arrayType == "range"
        dateObject.staticStartDate = moment(datesToIterate[0]).format(DateFormats.dateForDb)

      # Not Required
      dateObject.directionsLink = Manager.GetDirectionsLink(eventObject.address)
      dateObject.address = eventObject.address
      dateObject.children = eventObject.children
      dateObject.ownerKey = currentUser?.key
      dateObject.createdBy = currentUser?.name
      dateObject.phone = eventObject.phone
      dateObject.shareWith = DatasetManager.getUniqueArray(eventObject.shareWith, true)
      dateObject.notes = eventObject.notes
      dateObject.websiteUrl = eventObject.websiteUrl
      dateObject.isRecurring = eventObject.isRecurring
      dateObject.isDateRange = eventObject.isDateRange
      #      dateObject.isCloned = Manager.isValid(clonedDates)

      # Times
      if Manager.IsValid(eventObject.startTime)
        dateObject.startTime = moment(eventObject.startTime).format(DateFormats.timeForDb)

      if Manager.IsValid(eventObject.endTime)
        dateObject.endTime = moment(eventObject.endTime).format(DateFormats.timeForDb)

      dateObject.reminderTimes = eventObject.GetReminderTimes
      dateObject.recurrenceInterval = eventObject.recurringInterval
      datesToPush.push ObjectManager.CleanObject(dateObject)

    return datesToPush

  SetHolidays: (holidays) ->
    dbRef = ref(getDatabase())
    currentEvents = await DB.GetTableData(DB.tables.holidayEvents)
    eventsToAdd = DatasetManager.GetValidArray([currentEvents..., holidays...], true, true)
    eventsToAdd = DatasetManager.GetValidArray(eventsToAdd, true, true)
    
    try
      await set(child(dbRef, "#{DB.tables.holidayEvents}"), eventsToAdd)
    catch error
      LogManager.Log(error.message, LogManager.LogTypes.error, error.stack)

  addCalendarEvent: (currentUser, newEvent) ->
    dbRef = ref(getDatabase())
    currentEvents = await DB.GetTableData("#{DB.tables.calendarEvents}/#{currentUser.key}")
    currentEvents = currentEvents.filter (n) -> n

    toAdd = []
    try
      if Manager.IsValid(currentEvents)
        toAdd = [currentEvents..., newEvent]
      else
        toAdd = [newEvent]
      set(child(dbRef, "#{DB.tables.calendarEvents}/#{currentUser.key}/"), toAdd)
    catch error
      LogManager.Log(error.message, LogManager.LogTypes.error, error.stack)

  UpdateEvent: (currentUserKey, updateIndex, updatedEvent) ->
    dbRef = getDatabase()

    try
      if updateIndex
        await update(ref(dbRef, "#{DB.tables.calendarEvents}/#{currentUserKey}/#{updateIndex}"), updatedEvent)
    catch error
      Sentry.captureException("Error: #{error} | Code File: CalendarManager | Function: UpdateExpense")

  deleteMultipleEvents: (events, currentUser) ->
    dbRef = ref(getDatabase())
    tableRecords = await DB.GetTableData("#{DB.tables.calendarEvents}/#{currentUser.key}")
    idsToDelete = events.map (x) -> x.id
    if Manager.IsValid(tableRecords)
      for record in tableRecords
        if Manager.Contains(idsToDelete, record.id)
          await CalendarManager.deleteEvent(currentUser, record.id)

  deleteAllHolidayEvents: () ->
    dbRef = ref(getDatabase())
    tableRecords = await DB.GetTableData("#{DB.tables.holidayEvents}")
    for record in tableRecords
      idToDelete = await DB.getSnapshotKey("#{DB.tables.holidayEvents}", record, 'id')
      await remove(child(dbRef, "#{DB.tables.holidayEvents}/#{idToDelete}"))

  deleteEvent: (currentUser, id) ->
    dbRef = ref(getDatabase())
    idToDelete = null
    tableRecords = await DB.GetTableData("#{DB.tables.calendarEvents}/#{currentUser.key}/")
    for record in tableRecords
      if record?.id is id
        idToDelete = await DB.getSnapshotKey("#{DB.tables.calendarEvents}/#{currentUser.key}/", record, 'id')
        try
          remove(child(dbRef, "#{DB.tables.calendarEvents}/#{currentUser.key}/#{idToDelete}"))
        catch error
          LogManager.Log(error.message, LogManager.LogTypes.error, error.stack)