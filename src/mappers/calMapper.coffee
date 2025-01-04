import ReminderTimes from 'constants/reminderTimes'
import DateManager from 'managers/dateManager'
import moment from "moment"
import Manager from "../managers/manager"
import DB from "../database/DB"

CalendarMapper =
  currentUserEventPath: (currentUser, event) ->
    if Manager.isValid(event?.shareWith)
      return "#{DB.tables.calendarEvents}/#{currentUser.phone}/sharedEvents"
    else
      return "#{DB.tables.calendarEvents}/#{currentUser.phone}/events"

  reminderTimes: (timeframe) ->
    if Manager.contains(timeframe,'hour')
      return ReminderTimes.hour
    if Manager.contains(timeframe,'30')
      return ReminderTimes.halfHour
    if Manager.contains(timeframe,'5')
      return ReminderTimes.fiveMinutes
    if Manager.contains(timeframe,'event')
      return ReminderTimes.timeOfEvent

  readableReminderBeforeTimeframes: (timeframe) ->
    if Manager.contains(timeframe,'hour', false)
      return  '1 hour before'
    if Manager.contains(timeframe,'halfHour', false)
      return  '30 minutes before'
    if Manager.contains(timeframe,'fiveMinutes', false)
      return  '5 minutes before'
    if Manager.contains(timeframe,'timeOfEvent', false)
      return  'At time of event'

  readableRepeatIntervals: (selectedInterval) ->
    interval = null
    if selectedInterval.indexOf('hour') > -1
      interval = '1 hour before'
    if selectedInterval.indexOf('halfHour') > -1
      interval = '30 minutes before'
    if selectedInterval.indexOf('fiveMinutes') > -1
      interval = '5 minutes before'
    if selectedInterval.indexOf('timeOfEvent') > -1
      interval = 'At time of event'

    return interval

  repeatingEvents: (repeatInterval, eventStartDate, repeatingEndDate) ->
    datesToRepeat = null
    if repeatInterval is 'daily'
      datesToRepeat = DateManager.getDailyDates(eventStartDate, repeatingEndDate)
    if repeatInterval is 'weekly'
      datesToRepeat = DateManager.getWeeklyDates(eventStartDate, repeatingEndDate)
    if repeatInterval is 'biweekly'
      datesToRepeat = DateManager.getBiweeklyDates(eventStartDate, repeatingEndDate)
    if repeatInterval is 'monthly'
      datesToRepeat = DateManager.getMonthlyDates(eventStartDate, repeatingEndDate)
    return datesToRepeat

  holidayNameToDate: (name) ->
    switch true
      when name == "New Year's Day"
        '01/01'
      when name == "Martin Luther King Day"
        '01/15'
      when name == "Good Friday"
        '05/29'
      when name == 'Easter'
        '04/20'
      when name == 'Juneteenth'
        '06/19'
      when name == "Father's Day"
        '06/15'
      when name == "Mother's Day"
        '05/11'
      when name == 'Memorial Day'
        '05/27'
      when name == 'Independence Day'
        '07/04'
      when name == 'Labor Day'
        '09/02'
      when name == 'Columbus Day'
        '10/14'
      when name == 'Halloween'
        '10/31'
      when name == 'Christmas Day'
        '12/25'
      when name == 'Christmas Eve'
        '12/24'
      when name == "New Year's Eve"
        '12/31'
      when name == "Veteran's Day"
        '11/11'
      when name == "Thanksgiving Day"
        '11/28'
      else
        null
  holidayDateToName: (date) ->
    date = moment(date).format("MM/DD")
    switch true
      when date == '01/01'
        "New Year's Day"
      when date == '01/15'
        "Martin Luther King Day"
      when date == '05/29'
        "Good Friday"
      when date == '04/20'
        'Easter'
      when date == '06/19'
        'Juneteenth'
      when date == '06/15'
        "Father's Day"
      when date == '05/11'
        "Mother's Day"
      when date == '05/27'
        'Memorial Day'
      when date == '07/04'
        'Independence Day'
      when date == '09/02'
        'Labor Day'
      when date == '10/14'
        'Columbus Day'
      when date == '10/31'
        'Halloween'
      when date == '12/25'
        'Christmas Day'
      when date == '12/24'
        'Christmas Eve'
      when date == '12/31'
        "New Year's Eve"
      when date == '11/11'
        "Veteran's Day"
      when date == '11/28'
        "Thanksgiving Day"
      else
        ''
  eventsToHolidays: (holidayEvents) ->
    userHolidaysList = []
    for holiday in holidayEvents
      obj =
        name: ''
        date: ''
      holidayName = CalendarMapper.holidayDateToName(holiday.startDate)
      holidayDate = holiday.startDate
      obj.name = holidayName
      obj.date = holidayDate
      userHolidaysList.push(obj)
    return userHolidaysList


export default CalendarMapper