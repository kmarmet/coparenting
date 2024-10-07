import ReminderTimes from 'constants/reminderTimes'
import DateManager from 'managers/dateManager'

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

export default CalendarMapper

