import ReminderTimes from '../constants/reminderTimes'
import DateManager from '../managers/dateManager'
import moment from "moment"
import Manager from "../managers/manager"

CalendarMapper =
  GetReminderTimes: (timeframe) ->
    if  timeframe == ReminderTimes.hour
      return ReminderTimes.hour
    if timeframe == ReminderTimes.halfHour
      return ReminderTimes.halfHour
    if timeframe == ReminderTimes.fiveMinutes
      return ReminderTimes.fiveMinutes
    if timeframe == ReminderTimes.timeOfEvent
      return ReminderTimes.timeOfEvent

  GetReadableReminderTimes: () ->
    readableTimes = []
    for time in Object.keys(ReminderTimes)
      readableTimes.push(CalendarMapper.GetReadableReminderTime(time))
    return readableTimes

  allUnformattedTimes: () ->
    all = ["timeOfEvent","fiveMinutes","halfHour","hour"]
    return all

  GetReadableReminderTime: (timeframe) ->
    if Manager.Contains(timeframe,'hour')
      return  '1 Hour Before'
    if Manager.Contains(timeframe,'half')
      return  '30 Minutes Before'
    if Manager.Contains(timeframe,'five')
      return  '5 Minutes Before'
    if Manager.Contains(timeframe,'time')
      return  'At Event Time'

  GetShortenedReadableReminderTime: (timeframe) ->
    if Manager.Contains(timeframe,'hour')
      return  '1 Hour'
    if Manager.Contains(timeframe,'half')
      return  '30 Minutes'
    if Manager.Contains(timeframe,'five')
      return  '5 Minutes'
    if Manager.Contains(timeframe,'time')
      return  'Time of Event'

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
        return '01/01'
      when name == "Martin Luther King Day"
        return '01/15'
      when name == "Good Friday"
        return '05/29'
      when name == 'Easter'
        return '04/20'
      when name == 'Juneteenth'
        return '06/19'
      when name == "Father's Day"
        return '06/15'
      when name == "Mother's Day"
        return '05/11'
      when name == 'Memorial Day'
        return '05/27'
      when name == 'Independence Day'
        return '07/04'
      when name == 'Labor Day'
        return '09/02'
      when name == "Patriot Day"
        return '09/11'
      when name == 'Columbus Day'
        return '10/14'
      when name == 'Halloween'
        return '10/31'
      when name == 'Christmas Day'
        return '12/25'
      when name == 'Christmas Eve'
        return '12/24'
      when name == "New Year's Eve"
        return '12/31'
      when name == "Veteran's Day"
        return '11/11'
      when name == "Thanksgiving Day"
        return '11/28'
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
      when date == '09/11'
        return "Patriot Day"
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