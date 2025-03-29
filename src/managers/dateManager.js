import moment from 'moment'
import Manager from '../managers/manager'
import CalendarEvent from '../models/calendarEvent'
import DateFormats from '../constants/dateFormats'
import CalendarManager from './calendarManager.js'
import ObjectManager from './objectManager'
import ModelNames from '../models/modelNames'
import DatasetManager from '../managers/datasetManager.coffee'

const DateManager = {
  reminderTimes: {
    oneHour: 'hour',
    halfHour: 'halfHour',
  },
  getTodayJsDate: () => {
    const today = new Date()

    const day = String(today.getDate()).padStart(2, '0')
    const month = String(today.getMonth() + 1).padStart(2, '0') // Month is 0-indexed
    const year = today.getFullYear()

    return `${year}-${month}-${day}`
  },
  formatDate: (inputDate, inputFormat = 'M-DD-YYYY', outputFormat = 'dddd, MMM DD') => {
    let inputFormatString = inputFormat
    let inputString = inputDate
    if (inputDate) {
      if (inputFormat.indexOf('-') > -1) {
        inputFormatString = inputFormat.replaceAll('-', '/')
      }
      if (inputDate.indexOf('-') > -1) {
        inputString = inputDate.replaceAll('-', '/')
      }
      return moment(inputDate, inputFormatString).format(outputFormat)
    }
    return inputDate
  },
  sortCalendarEvents: (events, datePropertyName, timePropertyName) => {
    const sorted = events.sort((a, b) => moment(a.startTime, DateFormats.timeForDb).diff(moment(b.startTime, DateFormats.timeForDb)))
    // console.log(sorted)
    let nestedSort =
      (prop1, prop2 = null, direction = 'asc') =>
      (e1, e2) => {
        const a = prop2 ? e1[prop1][prop2] : e1[prop1],
          b = prop2 ? e2[prop1][prop2] : e2[prop1],
          sortOrder = direction === 'asc' ? 1 : -1
        return a < b ? -sortOrder : a > b ? sortOrder : 0
      }
    // const sortedByDate = events.sort(nestedSort(datePropertyName, null, 'asc'))
    // const sortedByDateAndTime = events.sort(nestedSort(timePropertyName, null, 'asc'))
    // const combined = DatasetManager.getUniqueArray([...sortedByDate, ...sortedByDateAndTime], true)
    return sorted
  },
  sortByTime: (events) => {
    const sorted = events.sort((a, b) => moment(a.startTime).diff(moment(b.startTime)))
    console.log(sorted)
    return []
  },
  getWeeksUntilEndOfYear: () => {
    const endOfYear = moment([moment().format('yyyy')])
      .endOf('year')
      .format(DateFormats.dateForDb)

    const weeksLeftMs = moment(endOfYear, 'MM-DD-YYYY', 'weeks').diff(moment())
    const mil = weeksLeftMs
    const weeks = Math.floor(mil / (1000 * 7 * 24 * 60 * 60))
    return weeks
  },
  getMomentFormat: (date) => {
    // Date only
    if (date.indexOf('/') > -1 && date.indexOf(':') === -1) {
      return DateFormats.dateForDb
    } else if (date.indexOf('/') === -1 && date.indexOf(':') > -1) {
      return DateFormats.timeForDb
    }
    if (date.indexOf('/') > -1 && date.indexOf(':') > -1) {
      return DateFormats.fullDatetime
    }
    if (date.indexOf('-') > -1) {
      return DateFormats.jsDate
    }
  },
  getValidDate: (date) => {
    if (!Manager.isValid(date)) {
      return null
    }
    const format = DateManager.getMomentFormat(date)
    const asMoment = moment(date, format).format(DateFormats.dateForDb)
    if (Manager.contains(asMoment, 'Invalid')) {
      return null
    }
    return asMoment
  },
  msToDate: (ms) => {
    return moment(ms, 'x').format(DateFormats.dateForDb)
  },
  dateOrNull: (date) => {
    if (!Manager.isValid(date)) {
      return null
    }

    return date
  },
  isValidDate: (date) => {
    if (!Manager.isValid(date)) {
      return false
    }
    const format = DateManager.getMomentFormat(date)
    const asMoment = moment(date, format).format(format)
    if (Manager.contains(asMoment, 'Invalid')) {
      return false
    }
    return asMoment.length !== 0
  },
  getDaysInRange: (startDate, endDate) => {
    let a = moment(startDate)
    let b = moment(endDate)
    return b.diff(a, 'days')
  },
  getMonthsUntilEndOfYear: () => {
    const currentMonth = Number(moment().month()) + 1
    return 12 - currentMonth
  },
  getDaysUntilEndOfYear: () => {
    const endOfYear = moment([moment().format('yyyy')])
      .endOf('year')
      .format(DateFormats.dateForDb)
    const daysLeftMs = moment(endOfYear, 'MM-DD-YYYY', 'days').diff(moment())
    let duration = moment.duration(daysLeftMs, 'milliseconds')
    let daysLeft = duration.asDays()
    return Math.ceil(daysLeft)
  },
  getDateRangeDates: (startDate, endDate) => {
    const daysInRange = DateManager.getDaysInRange(startDate, endDate)
    console.log(daysInRange)
    let dailyEvents = []
    for (let i = 0; i <= daysInRange; i++) {
      let nextDay = moment(startDate).add(i * 1, 'days')
      const hasReachedEndDate = moment(nextDay).isSameOrAfter(moment(endDate).add(1, 'day'))
      if (hasReachedEndDate) {
        break
      }
      dailyEvents.push(moment(nextDay).format(DateFormats.dateForDb))
    }
    return dailyEvents
  },
  getDailyDates: (startDate, endDate) => {
    const durationInDays = DateManager.getDuration('days', startDate, endDate)
    let dailyEvents = []

    for (let i = 0; i <= durationInDays; i++) {
      let newDay = moment(startDate).add(i, 'days')
      const hasReachedEndDate = moment(newDay).isSameOrAfter(endDate)
      if (!hasReachedEndDate) {
        dailyEvents.push(newDay.format(DateFormats.dateForDb))
      }
    }
    return dailyEvents
  },
  getMonthlyDates: (startDate, endDate) => {
    const durationInDays = DateManager.getDuration('days', startDate, endDate)
    let monthlyEvents = []
    for (let i = 1; i <= durationInDays; i++) {
      let newMonth = moment(startDate).add(i, 'month')
      const hasReachedEndDate = moment(newMonth).isSameOrAfter(moment(endDate))
      if (!hasReachedEndDate) {
        monthlyEvents.push(moment(newMonth).format('MM/DD/yyyy'))
      }
    }
    return monthlyEvents
  },
  getBiweeklyDates: (startDate, endDate) => {
    let biweeklyEvents = []
    const durationInDays = DateManager.getDuration('days', startDate, endDate)
    const weeksLeft = Math.floor(durationInDays / 7)
    for (let i = 0; i <= weeksLeft; i++) {
      let newWeek = moment(startDate).add(i, 'weeks')
      const hasReachedEndDate = moment(newWeek).isAfter(endDate)
      if (i % 2 === 0 && !hasReachedEndDate) {
        biweeklyEvents.push(newWeek.format(DateFormats.dateForDb))
      }
    }
    console.log(biweeklyEvents)
    return biweeklyEvents
  },
  getWeeklyDates: (startDate, endDate) => {
    const durationInDays = DateManager.getDuration('days', startDate, endDate)
    let weeklyEvents = []

    for (let i = 0; i <= durationInDays; i++) {
      let newWeek = moment(startDate).add(i, 'week')
      const hasReachedEndDate = moment(newWeek).isAfter(endDate)
      if (!hasReachedEndDate) {
        weeklyEvents.push(moment(newWeek).format(DateFormats.dateForDb))
      }
    }
    return weeklyEvents
  },
  getHolidays: async () =>
    new Promise(async (resolve) => {
      await fetch(`https://date.nager.at/api/v3/publicholidays/${moment().year()}/US`)
        .then((response) => response.json())
        .then((holidayArray) => {
          let holidays = []
          let unique = DatasetManager.getUniqueByPropValue(holidayArray, 'name')
          unique = unique.map((obj) => {
            if (obj.name === 'Juneteenth National Independence Day') {
              obj.name = 'Juneteenth'
              return obj
            }
            return obj
          })

          holidays = unique

          holidays.push({
            name: 'Christmas Eve',
            date: `${moment().year()}-12-24`,
          })
          holidays.push({
            name: "New Year's Eve",
            date: `${moment().year()}-12-31`,
          })
          holidays.push({
            name: 'Halloween',
            date: `${moment().year()}-10-31`,
          })
          holidays.push({
            name: 'Easter',
            date: `${moment().year()}-04-20`,
          })
          holidays.push({
            name: "Father's Day",
            date: `${moment().year()}-06-15`,
          })
          holidays.push({
            name: "Mother's Day",
            date: `${moment().year()}-05-11`,
          })

          resolve(holidays)
        })
    }),
  getDuration: (timeInterval, start, end) => {
    if (timeInterval === 'days') {
      return moment.duration(moment(end).diff(moment(start))).asDays()
    }
    if (timeInterval === 'hours') {
      return moment.duration(moment(end).diff(moment(start))).asHours()
    }
    if (timeInterval === 'seconds') {
      return moment.duration(moment(end).diff(moment(start))).asSeconds()
    }
    if (timeInterval === 'minutes') {
      return moment.duration(moment(end).diff(moment(start))).asMinutes()
    }
  },
  addDays: (inputDate, numberOfDays) => {
    return moment(new Date(inputDate.setDate(inputDate.getDate() + numberOfDays))).format(DateFormats.forDb)
  },
  setHolidays: async () => {
    await DateManager.deleteAllHolidays()
    const holidays = await DateManager.getHolidays()
    let holidayEvents = []
    const switchCheck = (title, holidayName) => {
      return !!Manager.contains(title, holidayName)
    }

    // SET EMOJIS / CREATE EVENT SET
    for (const holiday of holidays) {
      let newEvent = new CalendarEvent()
      // Required
      switch (true) {
        case switchCheck(holiday.name, 'Halloween'):
          newEvent.title = holiday.name += ' 🎃'
          break
        case switchCheck(holiday.name, 'Christmas'):
          newEvent.title = holiday.name += ' 🎄'
          break
        case switchCheck(holiday.name, 'Thanksgiving'):
          newEvent.title = holiday.name += ' 🦃'
          break
        case switchCheck(holiday.name, 'Memorial'):
          newEvent.title = holiday.name += ' 🎖️'
          break
        case switchCheck(holiday.name, 'New Year'):
          newEvent.title = holiday.name += ' 🥳'
          break
        case switchCheck(holiday.name, 'Easter'):
          newEvent.title = holiday.name += ' 🐇'
          break
        case switchCheck(holiday.name, 'Mother'):
          newEvent.title = holiday.name += ' 👩‍👧‍👦'
          break
        case switchCheck(holiday.name, 'Father'):
          newEvent.title = holiday.name += ' 👨‍👧‍👦'
          break
        case switchCheck(holiday.name, 'Independence'):
          newEvent.title = holiday.name += ' 🎇'
          break
        default:
          newEvent.title = holiday.name
      }
      newEvent.id = Manager.getUid()
      newEvent.holidayName = holiday.name
      newEvent.startDate = moment(holiday.date).format(DateFormats.dateForDb)
      newEvent.isHoliday = true
      newEvent.visibleToAll = true
      newEvent = ObjectManager.cleanObject(newEvent, ModelNames.calendarEvent)
      holidayEvents.push(newEvent)
    }
    await CalendarManager.setHolidays(holidayEvents)
  },
  dateIsValid: (inputDate, format = DateFormats.dateForDb) => {
    return moment(inputDate, format).isValid()
  },
  // DELETE
  deleteAllHolidays: async () => {
    await CalendarManager.deleteAllHolidayEvents()
  },
}

export default DateManager