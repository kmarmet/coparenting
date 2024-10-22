import moment from 'moment'
import DB from '@db'
import Manager from '@manager'
import CalendarEvent from '@models/calendarEvent'
import DateFormats from '@constants/dateFormats'
import '../prototypes'
import CalendarManager from './calendarManager'

const DateManager = {
  reminderTimes: {
    oneHour: 'hour',
    halfHour: 'halfHour',
  },
  formValidation: (title, shareWith, fromDate) => {
    if (!Manager.isValid(title)) {
      return 'Please enter an event title'
    }
    if (!Manager.isValid(shareWith, true)) {
      return 'Please select who you would like to share this event with'
    }
    if (!Manager.dateIsValid(fromDate)) {
      return 'Please select an event date'
    }
    return null
  },
  formatDate: (inputDate, inputFormat = 'M-DD-YYYY', outputFormat = 'dddd, MMM DD') => {
    let inputFormatString = inputFormat
    let inputString = inputDate
    if (inputFormat.indexOf('-') > -1) {
      inputFormatString = inputFormat.replaceAll('-', '/')
    }
    if (inputDate.indexOf('-') > -1) {
      inputString = inputDate.replaceAll('-', '/')
    }
    return moment(inputDate, inputFormatString).format(outputFormat)
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
  getMonthsUntilEndOfYear: () => {
    const currentMonth = Number(moment().month()) + 1
    return 12 - currentMonth
  },
  getDaysUntilEndOfYear: () => {
    const endOfYear = moment([moment().format('yyyy')])
      .endOf('year')
      .format('MM/DD/yyyy')
    const daysLeftMs = moment(endOfYear, 'MM-DD-YYYY', 'days').diff(moment())
    var duration = moment.duration(daysLeftMs, 'milliseconds')
    var daysLeft = duration.asDays()
    return Math.ceil(daysLeft)
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
  getWeeklyDates: (startDate, endDate) => {
    const daysLeft = DateManager.getDaysUntilEndOfYear(endDate)
    let weeklyEvents = []
    for (let i = 1; i <= daysLeft / 7; i++) {
      let newWeek = moment(startDate).add(i, 'week')
      let weekMonth = moment(newWeek).format('MM')
      const hasReachedEndDate = moment(weekMonth).isSameOrAfter(moment(endDate).format('MM'))
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
  getVisitationHolidays: async () => {
    let holidays = await DateManager.getHolidays()
    let visitationHolidays = []
    let visitationRelatedHolidays = [
      "New Year's Day",
      'Good Friday',
      'Memorial Day',
      'Juneteenth',
      'Independence Day',
      'Columbus Day',
      'Labor Day',
      'Thanksgiving Day',
      'Christmas Day',
      'Christmas Eve',
      "New Year's Eve",
      'Halloween',
      'Easter',
      "Father's Day",
      "Mother's Day",
    ]
    holidays.forEach((holiday) => {
      visitationRelatedHolidays.forEach((mainHoliday) => {
        if (mainHoliday.getFirstWord() === holiday.name.getFirstWord()) {
          const exists = visitationHolidays.filter((x) => x.name.contains(holiday.name))
          if (exists.length === 0) {
            if (holiday.name === 'Juneteenth National Independence Day') {
              holiday.name = 'Juneteenth'
            }
            if (holiday.name === "New Year's Day") {
              holiday.date = '2025-01-01'
            }
            const holidayObject = {
              name: holiday.name,
              date: holiday.date,
            }
            visitationHolidays.push(holidayObject)
          }
        }
      })
    })
    return Manager.getUniqueArray(visitationHolidays).flat()
  },
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
  getJsDate: (inputDate) => {
    const month = moment(inputDate).format('MM')
    const day = moment(inputDate).format('DD')
    const newDate = new Date(`${moment().year()},${month},${day}`)
    return newDate
  },
  standardToMilitaryTime: (time) => {
    if (time.indexOf('am') > -1) {
      return Number(time.replace('am', ''))
    }
    if (time.indexOf('pm') > -1) {
      console.log(time)
      return Number(time.replace('pm', '').replace(' ', '')) + 12
    }
  },
  getJsDatetime: (date, time) => {
    const month = parseInt(moment(date).format('M')) - 1
    const year = parseInt(moment().year())
    let hour = parseInt(moment(time, 'hh:mma').format('HH'))
    const minute = parseInt(moment(time, 'hh:mma').format('mm'))
    const day = parseInt(moment(date).format('DD'))
    let returnDate = new Date(year, month, day, hour, minute)
    return returnDate
  },
  addDays: (inputDate, numberOfDays) => {
    return moment(new Date(inputDate.setDate(inputDate.getDate() + numberOfDays))).format(DateFormats.forDb)
  },
  setHolidays: async () => {
    let users = await DB.getTable(DB.tables.users)
    let userPhones = DB.convertKeyObjectToArray(users).map((x) => x.phone)
    DateManager.getHolidays().then(async (holidays) => {
      let events = []
      const switchCheck = (title, holidayName) => {
        return !!title.contains(holidayName)
      }
      for (const holiday of holidays) {
        const newEvent = new CalendarEvent()
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
        newEvent.fromDate = moment(holiday.date).format('MM/DD/yyyy')
        newEvent.isHoliday = true
        // Not Required
        newEvent.shareWith = Manager.getUniqueArray(userPhones).flat()
        events.push(newEvent)
      }
      await CalendarManager.addMultipleCalEvents(events)
    })
  },
  dateIsValid: (inputDate) => {
    if (!inputDate) {
      return false
    }
    if (typeof inputDate === 'string') {
      return inputDate.length > 0 && inputDate.toLowerCase() !== 'invalid date'
    }
    return true
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
}

export default DateManager
