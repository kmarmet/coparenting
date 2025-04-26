import ReminderTimes from '../constants/reminderTimes'
import DateManager from '../managers/dateManager'
import moment from "moment"
import Manager from "../managers/manager"

CalendarMapper =
  reminderTimes: (timeframe) ->
    if Manager.contains(timeframe,'hour')
      return ReminderTimes.hour
    if Manager.contains(timeframe,'30')
      return ReminderTimes.halfHour
    if Manager.contains(timeframe,'5')
      return ReminderTimes.fiveMinutes
    if Manager.contains(timeframe,'event')
      return ReminderTimes.timeOfEvent

  allReadableReminderTimes: () ->
    readableTimes = []
    for time in Object.keys(ReminderTimes)
      readableTimes.push(CalendarMapper.readableReminderBeforeTimeframes(time))
    return readableTimes

  allUnformattedTimes: () ->
    all = ["timeOfEvent","fiveMinutes","halfHour","hour"]
    return all

  readableReminderBeforeTimeframes: (timeframe) ->
    if Manager.contains(timeframe,'hour', false)
      return  '1 hour before'
    if Manager.contains(timeframe,'halfHour', false)
      return  '30 minutes before'
    if Manager.contains(timeframe,'fiveMinutes', false)
      return  '5 minutes before'
    if Manager.contains(timeframe,'timeOfEvent', false)
      return  'At event time'

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

  recurringEvents: (recurringInterval, eventStartDate, recurringEndDate) ->
    datesToRepeat = null
    if recurringInterval is 'daily'
      datesToRepeat = DateManager.getDailyDates(eventStartDate, recurringEndDate)
    if recurringInterval is 'weekly'
      datesToRepeat = DateManager.getWeeklyDates(eventStartDate, recurringEndDate)
    if recurringInterval is 'biweekly'
      datesToRepeat = DateManager.getBiweeklyDates(eventStartDate, recurringEndDate)
    if recurringInterval is 'monthly'
      datesToRepeat = DateManager.getMonthlyDates(eventStartDate, recurringEndDate)
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
        return "New Year's Day"
      when date == '01/15'
        return "Martin Luther King Day"
      when date == '05/29'
        return "Good Friday"
      when date == '04/20'
        return 'Easter'
      when date == '06/19'
        return 'Juneteenth'
      when date == '06/15'
        return "Father's Day"
      when date == '05/11'
        return "Mother's Day"
      when date == '05/27'
        return 'Memorial Day'
      when date == '07/04'
        return 'Independence Day'
      when date == '09/02'
        return 'Labor Day'
      when date == '10/14'
        return 'Columbus Day'
      when date == '10/31'
        return 'Halloween'
      when date == '12/25'
        return 'Christmas Day'
      when date == '12/24'
        return 'Christmas Eve'
      when date == '12/31'
        return "New Year's Eve"
      when date == '11/11'
        return "Veteran's Day"
      when date == '11/28'
        return "Thanksgiving Day"
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