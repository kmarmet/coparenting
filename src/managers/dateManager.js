import moment from 'moment'
import DB from '@db'
import Manager from '@manager'
import CalendarEvent from '@models/calendarEvent'
import DateFormats from '@constants/dateFormats'
import CalendarManager from './calendarManager'
import {
  contains,
  displayAlert,
  formatFileName,
  formatNameFirstNameOnly,
  getFileExtension,
  getFirstWord,
  hasClass,
  isAllUppercase,
  removeFileExtension,
  removeSpacesAndLowerCase,
  spaceBetweenWords,
  stringHasNumbers,
  toCamelCase,
  uniqueArray,
  uppercaseFirstLetterOfAllWords,
  wordCount,
} from '../globalFunctions'
import _ from 'lodash'
import ObjectManager from './objectManager'
import ModelNames from '../models/modelNames'

const DateManager = {
  reminderTimes: {
    oneHour: 'hour',
    halfHour: 'halfHour',
  },
  formValidation: (title, shareWith, startDate) => {
    if (_.isEmpty(title)) {
      return 'Please enter an event title'
    }
    if (_.isEmpty(shareWith)) {
      return 'Please select who you would like to share this event with'
    }
    if (!DateManager.dateIsValid(startDate)) {
      return 'Please select an event date'
    }
    return null
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
    const sortedByDate = events.sort(nestedSort(datePropertyName, null, 'asc'))
    const sortedByDateAndTime = events.sort(nestedSort(timePropertyName, null, 'asc'))
    const combined = Manager.getUniqueArray(sortedByDate.concat(sortedByDateAndTime))
    return combined
  },
  sortByTime: (events) => {
    const sorted = events.sort((a, b) => moment(a.startTime).diff(moment(b.startTime)))
    console.log(sorted)
    return []
  },
  getWeeksUntilEndOfYear: () => {
    const endOfYear = moment([moment().format('yyyy')])
      .endOf('year')
      .format('MM/DD/yyyy')

    const weeksLeftMs = moment(endOfYear, 'MM-DD-YYYY', 'weeks').diff(moment())
    const mil = weeksLeftMs
    const weeks = Math.floor(mil / (1000 * 7 * 24 * 60 * 60))
    return weeks
  },
  msToDate: (ms) => {
    return moment(ms, 'x').format('MM/DD/yyyy')
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
      .format('MM/DD/yyyy')
    const daysLeftMs = moment(endOfYear, 'MM-DD-YYYY', 'days').diff(moment())
    let duration = moment.duration(daysLeftMs, 'milliseconds')
    let daysLeft = duration.asDays()
    return Math.ceil(daysLeft)
  },
  getDateRangeDates: (startDate, endDate) => {
    const daysInRange = DateManager.getDaysInRange(startDate, endDate)
    let dailyEvents = []
    for (let i = 0; i <= daysInRange; i++) {
      let nextDay = moment(startDate).add(i * 1, 'days')
      const hasReachedEndDate = moment(nextDay).isSameOrAfter(moment(endDate).add(1, 'day'))
      if (hasReachedEndDate) {
        break
      }
      dailyEvents.push(moment(nextDay).format('MM/DD/yyyy'))
    }
    return dailyEvents
  },
  getDailyDates: (startDate, endDate) => {
    const daysLeft = DateManager.getDaysUntilEndOfYear()
    let dailyEvents = []
    for (let i = 1; i <= daysLeft; i++) {
      let newWeek = moment(startDate).add(i * 1, 'days')
      let month = moment(newWeek).format('MM')
      const hasReachedEndDate = moment(month).isSameOrAfter(moment(endDate).format('MM'))
      if (hasReachedEndDate) {
        break
      }
      dailyEvents.push(moment(newWeek).format('MM/DD/yyyy'))
    }
    return dailyEvents
  },
  getMonthlyDates: (startDate, endDate) => {
    const monthsLeft = DateManager.getMonthsUntilEndOfYear()
    let monthlyEvents = []
    for (let i = 1; i <= monthsLeft; i++) {
      let newMonth = moment(startDate).add(i * 1, 'months')
      let month = moment(newMonth).format('MM')
      const hasReachedEndDate = moment(month).isSameOrAfter(moment(endDate).format('MM'))
      if (hasReachedEndDate) {
        break
      }
      monthlyEvents.push(moment(newMonth).format('MM/DD/yyyy'))
    }
    return monthlyEvents
  },
  getBiweeklyDates: (startDate, endDate) => {
    let biweeklyEvents = []
    const weeksLeft = DateManager.getWeeksUntilEndOfYear()
    for (let i = 1; i <= weeksLeft; i++) {
      if (i % 2 === 0) {
        let newWeek = moment(startDate).add(i, 'weeks')
        let month = moment(newWeek).format('MM')
        const hasReachedEndDate = moment(month).isSameOrAfter(moment(endDate).format('MM'))
        if (hasReachedEndDate) {
          break
        }
        biweeklyEvents.push(newWeek.format('MM/DD/yyyy'))
      }
    }
    return biweeklyEvents
  },
  getWeeklyDates: (startDate, endMonth) => {
    const daysLeft = DateManager.getDaysUntilEndOfYear(endMonth)
    let weeklyEvents = []
    const weeksLeft = daysLeft / 7

    for (let i = 1; i <= weeksLeft; i++) {
      let newWeek = moment(startDate).add(i, 'week')
      const endDate = `${moment(startDate).format('MM/DD')}/${moment(endMonth)}${moment(startDate).format('yyyy')}`
      const hasReachedEndDate = moment(newWeek).isSameOrAfter(moment(endDate))
      if (hasReachedEndDate) {
        break
      }
      weeklyEvents.push(moment(newWeek).format('MM/DD/yyyy'))
    }
    return weeklyEvents
  },
  getHolidays: async () =>
    new Promise(async (resolve) => {
      await fetch(`https://date.nager.at/api/v3/publicholidays/${moment().year()}/US`)
        .then((response) => response.json())
        .then((holidayArray) => {
          let holidays = []
          holidays = holidayArray

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
      return !!contains(title, holidayName)
    }

    console.log(holidays)

    // SET EMOJIS
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
      newEvent.startDate = moment(holiday.date).format('MM/DD/yyyy')
      newEvent.isHoliday = true
      newEvent.visibleToAll = true
      newEvent = ObjectManager.cleanObject(newEvent, ModelNames.calendarEvent)
      holidayEvents.push(newEvent)
    }
    // holidayEvents = holidayEvents.filter((value, index, self) => index === self.findIndex((t) => t.startDate === value.startDate))
    await CalendarManager.setHolidays(holidayEvents)
  },
  dateIsValid: (inputDate, format = DateFormats.dateForDb) => {
    return moment(inputDate, format).isValid()
  },
  returnValidDate: (inputDate, type, outputFormat) => {
    const inputFormats = [DateFormats.dateForDb, DateFormats.timeForDb, DateFormats.dateForDb, DateFormats.fullDatetime]
    let formatted = moment(inputDate).format(DateFormats.dateForDb)

    if (type === 'time') {
      formatted = moment(inputDate).format(DateFormats.timeForDb)
    }
    let returnDate = inputDate
    if (!DateManager.dateIsValid(returnDate)) {
      returnDate = ''
    }
    // console.log(moment(returnDate, inputFormats).format(outputFormat))
    return moment(returnDate, formatted).format(outputFormat)
  },

  // DELETE
  deleteAllHolidays: async () => {
    const allEvents = await DB.getTable(DB.tables.calendarEvents)
    for (let event of allEvents) {
      if (event?.isHoliday) {
        await DB.delete(DB.tables.calendarEvents, event.id)
      }
    }
  },
}

export default DateManager