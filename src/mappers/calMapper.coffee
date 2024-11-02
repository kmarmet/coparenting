import ReminderTimes from 'constants/reminderTimes'
import DateManager from 'managers/dateManager'
import moment from "moment"

CalendarMapper =
  reminderTimes: (timeframe) ->
    _timeframe = null
    if timeframe.indexOf('hour') > -1
      _timeframe = ReminderTimes.hour
    if timeframe.indexOf('30') > -1
      _timeframe = ReminderTimes.halfHour
    if timeframe.indexOf('5') > -1
      _timeframe = ReminderTimes.fiveMinutes
    if timeframe.indexOf('event') > -1
      _timeframe = ReminderTimes.timeOfEvent

    return _timeframe

  readableReminderBeforeTimeframes: (timeframe) ->
    _timeframe = null
    if timeframe.indexOf('hour') > -1
      _timeframe = '1 hour before'
    if timeframe.indexOf('halfHour') > -1
      _timeframe = '30 minutes before'
    if timeframe.indexOf('fiveMinutes') > -1
      _timeframe = '5 minutes before'
    if timeframe.indexOf('timeOfEvent') > -1
      _timeframe = 'At time of event'

    return _timeframe

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

  repeatingEvents: (repeatInterval, eventFromDate, repeatingEndDate) ->
    datesToRepeat = null
    if repeatInterval is 'daily'
      datesToRepeat = DateManager.getDailyDates(eventFromDate, repeatingEndDate)
    if repeatInterval is 'weekly'
      datesToRepeat = DateManager.getWeeklyDates(eventFromDate, repeatingEndDate)
    if repeatInterval is 'biweekly'
      datesToRepeat = DateManager.getBiweeklyDates(eventFromDate, repeatingEndDate)
    if repeatInterval is 'monthly'
      datesToRepeat = DateManager.getMonthlyDates(eventFromDate, repeatingEndDate)

    return datesToRepeat

  holidayNameToDate: (name) ->
    switch true
      when name == "New Year's Day"
        '01/01'
      when name == "New Year's"
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
      when name == 'Christmas'
        '12/25'
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
        null
  eventsToHolidays: (holidayEvents) ->
    userHolidaysList = []
    for holiday in holidayEvents
      obj =
        name: ''
        date: ''
      holidayName = CalendarMapper.holidayDateToName(holiday.fromDate)
      holidayDate = holiday.fromDate
      obj.name = holidayName
      obj.date = holidayDate
      userHolidaysList.push(obj)
    return userHolidaysList


export default CalendarMapper

