import moment from 'moment'
import DateManager from './dateManager'
import Manager from 'managers/manager'
import DB from 'database/DB'
import DateFormats from '../constants/dateFormats'
import DatasetManager from './datasetManager'
import LogManager from './logManager'
import CalendarManager from './calendarManager.js'

const VisitationManager = {
  weekendMapper: (input) => {
    let returnVal
    switch (true) {
      case input.indexOf('1st') > -1:
        returnVal = 0
        break
      case input.indexOf('2nd') > -1:
        returnVal = 1
        break
      case input.indexOf('3rd') > -1:
        returnVal = 2
        break
      case input.indexOf('4th') > -1:
        returnVal = 3
        break
      case input.indexOf('5th') > -1:
        returnVal = 4
        break
      default:
        returnVal = input
    }

    return returnVal
  },
  getDateRange: (firstDate, lastDate) => {
    if (moment(firstDate, 'MM/DD/yyyy').isSame(moment(lastDate, 'MM/DD/yyyy'), 'day')) return [lastDate]
    let date = firstDate
    const dates = [date]
    do {
      date = moment(date).add(1, 'day')
      dates.push(date.format('MM/DD/yyyy'))
    } while (moment(date).isBefore(lastDate))
    return dates
  },
  getSpecificWeekends: (scheduleType, endDate, selectedWeekends, fifthWeekendSelection) => {
    let formattedWeekends = selectedWeekends.map((x) => VisitationManager.weekendMapper(x))

    let iterationMonth = moment().startOf('month').format('MM')
    let readableMonths = []
    const monthsLeftInYear = 12 - moment().month() - 1
    const lastDayOfYear = moment([moment().year()]).endOf('year').format('MM-DD-YYYY')

    // Get readable months until end of year
    for (let counter = 0; counter <= monthsLeftInYear; counter++) {
      readableMonths.push(iterationMonth)
      iterationMonth = moment(moment(iterationMonth).add(1, 'month')).format('MM')
    }

    const dateArray = []
    // Loop fridays in month
    for (let i = 0; i <= readableMonths.length; i++) {
      const thisMonth = readableMonths[i]
      let daysInMonth = moment(readableMonths[i]).daysInMonth()
      let fridayInMonthNumber = 0
      for (let x = 1; x <= daysInMonth; x++) {
        let thisDay = moment(`${thisMonth} ${x} ${moment().year()}`).format('MM/DD/yyyy')
        // Do not go past end of year
        if (moment(thisDay).isSameOrAfter(moment(lastDayOfYear))) {
          break
        }
        let dayOfTheWeek = moment(thisDay, 'MM DD').format('dddd')

        // Add to dates array
        if (dayOfTheWeek === 'Friday') {
          // First friday
          if (formattedWeekends.includes(fridayInMonthNumber) && fridayInMonthNumber === 0) {
            const range = VisitationManager.getDateRange(thisDay, moment(thisDay).add(2, 'days'))
            dateArray.push(range.flat())
          }

          // Second Weekend
          if (formattedWeekends.includes(fridayInMonthNumber) && fridayInMonthNumber === 1) {
            const range = VisitationManager.getDateRange(thisDay, moment(thisDay).add(2, 'days'))
            dateArray.push(range.flat())
          }

          // // Third Weekend
          if (formattedWeekends.includes(fridayInMonthNumber) && fridayInMonthNumber === 2) {
            const range = VisitationManager.getDateRange(thisDay, moment(thisDay).add(2, 'days'))
            dateArray.push(range.flat())
          }

          // Fourth Weekend
          if (formattedWeekends.includes(fridayInMonthNumber) && fridayInMonthNumber === 3) {
            const range = VisitationManager.getDateRange(thisDay, moment(thisDay).add(2, 'days'))
            dateArray.push(range.flat())
          }

          // Fifth Weekend
          if (fridayInMonthNumber === 4) {
            if (VisitationManager.weekendMapper(fifthWeekendSelection) === 4) {
              const range = VisitationManager.getDateRange(thisDay, moment(thisDay).add(2, 'days'))
              dateArray.push(range.flat())
            }
          }
          fridayInMonthNumber += 1
        }
      }
      fridayInMonthNumber = 0
    }
    return dateArray
  },
  getEveryOtherWeekend: (firstWeekend) => {
    const firstWeekendDate = moment(firstWeekend).format(DateFormats.dateForDb)
    let iterationMonth = moment().startOf('month').format('MM')
    let readableMonths = []
    const monthsLeftInYear = 12 - moment().month() - 1
    const lastDayOfYear = moment([moment().year()]).endOf('year').format('MM-DD-YYYY')
    let fridayToAddTo = firstWeekendDate
    // Get readable months until end of year
    for (let counter = 0; counter <= monthsLeftInYear; counter++) {
      readableMonths.push(iterationMonth)
      iterationMonth = moment(moment(iterationMonth).add(1, 'month')).format('MM')
    }
    const dateArray = []
    // Loop fridays in month
    for (let i = 0; i <= readableMonths.length; i++) {
      const thisMonth = readableMonths[i]
      let daysInMonth = moment(readableMonths[i]).daysInMonth()
      for (let x = 1; x <= daysInMonth; x++) {
        let thisDay = moment(`${thisMonth} ${x} ${moment().year()}`).format('MM/DD/yyyy')
        // Do not go past end of year
        if (moment(thisDay).isSameOrAfter(moment(lastDayOfYear))) {
          break
        }
        let dayOfTheWeek = moment(thisDay, 'MM DD').format('dddd')

        // Add to dates array
        if (dayOfTheWeek === 'Friday') {
          const thisFridayDate = moment(thisDay).format(DateFormats.dateForDb)
          if (thisFridayDate === fridayToAddTo) {
            const range = VisitationManager.getDateRange(moment(fridayToAddTo).format(DateFormats.dateForDb), moment(thisDay).add(2, 'days'))
            const fridayPlusTwoWeeks = moment(thisDay).add(2, 'weeks')
            fridayToAddTo = moment(fridayPlusTwoWeeks).format(DateFormats.dateForDb)
            dateArray.push(range.flat())
          }
        }
      }
    }
    return dateArray
  },
  getEveryWeekend: () => {
    let iterationMonth = moment().startOf('month').format('MM')
    let readableMonths = []
    const monthsLeftInYear = 12 - moment().month() - 1
    const lastDayOfYear = moment([moment().year()]).endOf('year').format('MM-DD-YYYY')
    // Get readable months until end of year
    for (let counter = 0; counter <= monthsLeftInYear; counter++) {
      readableMonths.push(iterationMonth)
      iterationMonth = moment(moment(iterationMonth).add(1, 'month')).format('MM')
    }
    const dateArray = []
    // Loop fridays in month
    for (let i = 0; i <= readableMonths.length; i++) {
      const thisMonth = readableMonths[i]
      let daysInMonth = moment(readableMonths[i]).daysInMonth()
      for (let x = 1; x <= daysInMonth; x++) {
        let thisDay = moment(`${thisMonth} ${x} ${moment().year()}`).format('MM/DD/yyyy')
        // Do not go past end of year
        if (moment(thisDay).isSameOrAfter(moment(lastDayOfYear))) {
          break
        }
        let dayOfTheWeek = moment(thisDay, 'MM DD').format('dddd')

        // Add to dates array
        if (dayOfTheWeek === 'Friday') {
          const range = VisitationManager.getDateRange(thisDay, moment(thisDay).add(2, 'days'))
          dateArray.push(range.flat())
        }
      }
    }
    return dateArray
  },
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
  setVisitationHolidays: async (currentUser, holidays) => {
    await VisitationManager.deleteAllHolidaysForUser(currentUser)
    holidays = DatasetManager.getUniqueArrayByProp(holidays, 'startDate', 'holidayName')
    try {
      await CalendarManager.addMultipleCalEvents(currentUser, holidays)
    } catch (error) {
      LogManager.log(error.message, LogManager.logTypes.error, error.stack)
    }
  },
  getSchedule: async (currentUser) => {
    return new Promise(async (resolve) => {
      await DB.getTable(`${DB.tables.calendarEvents}/${currentUser.phone}`).then((events) => {
        let scheduleEvents = events.filter((x) => x.fromVisitationSchedule === true && x.ownerPhone === currentUser.phone)
        resolve(scheduleEvents)
      })
    })
  },
  addWeeks: (datetime, howManyWeeks) => {
    return new Date(datetime.setDate(datetime.getDate() + howManyWeeks * 7))
  },
  getFiftyFifty: (dates) => {
    const { firstFFPeriodStart, firstFFPeriodEnd, secondFFPeriodStart, secondFFPeriodEnd, thirdFFPeriodStart, thirdFFPeriodEnd } = dates
    const nextYear = moment().year() + 1
    const year = new Date().getFullYear()

    // Periods
    let firstPeriodArray = []
    let secondPeriodArray = []
    let thirdPeriodArray = []

    // First Period
    ;(() => {
      const visitationDurationInDays = DateManager.getDuration('days', firstFFPeriodStart, firstFFPeriodEnd)
      for (let index = 0; index <= 12; index++) {
        const day = moment(firstFFPeriodStart).format('DD')
        const month = new Date().getMonth() + 1
        let datetime = new Date(`${year},${month},${day}`)
        VisitationManager.addWeeks(datetime, index * 2).toString()
        const visitationDates = VisitationManager.getDateRange(datetime, moment(datetime).add(visitationDurationInDays, 'days'))
          .map((x) => moment(x).format('MM/DD/yyyy'))
          .filter((x) => x.toString().indexOf(nextYear) === -1)

        // Add to date array
        firstPeriodArray.push(visitationDates)
      }
    })()

    // Second Period
    ;(() => {
      const visitationDurationInDays = DateManager.getDuration('days', secondFFPeriodStart, secondFFPeriodEnd)
      for (let index = 0; index <= 12; index++) {
        const day = moment(secondFFPeriodStart).format('DD')
        const month = new Date().getMonth() + 1
        let datetime = new Date(`${year},${month},${day}`)
        VisitationManager.addWeeks(datetime, index * 2).toString()
        const visitationDates = VisitationManager.getDateRange(datetime, moment(datetime).add(visitationDurationInDays, 'days'))
          .map((x) => moment(x).format('MM/DD/yyyy'))
          .filter((x) => x.toString().indexOf(nextYear) === -1)

        // Add to date array
        secondPeriodArray.push(visitationDates)
      }
    })()
    // Third Period
    ;(() => {
      const visitationDurationInDays = DateManager.getDuration('days', thirdFFPeriodStart, thirdFFPeriodEnd)
      for (let index = 0; index <= 12; index++) {
        const day = moment(thirdFFPeriodStart).format('DD')
        const month = new Date().getMonth() + 1
        let datetime = new Date(`${year},${month},${day}`)
        VisitationManager.addWeeks(datetime, index * 2).toString()
        const visitationDates = VisitationManager.getDateRange(datetime, moment(datetime).add(visitationDurationInDays, 'days'))
          .map((x) => moment(x).format('MM/DD/yyyy'))
          .filter((x) => x.toString().indexOf(nextYear) === -1)

        // Add to date array
        thirdPeriodArray.push(visitationDates)
      }
    })()

    // Formatted Date Arrays
    const formattedSecondPeriodArray = Manager.getUniqueArray(secondPeriodArray.filter((x) => x !== 'Invalid date'))
      .sort()
      .flat()
    const formattedFirstPeriodArray = Manager.getUniqueArray(firstPeriodArray.filter((x) => x !== 'Invalid date'))
      .sort()
      .flat()
    const formattedThirdPeriodArray = Manager.getUniqueArray(thirdPeriodArray.filter((x) => x !== 'Invalid date')).flat()

    // Combine arrays
    return [...formattedFirstPeriodArray, ...formattedSecondPeriodArray, ...formattedThirdPeriodArray].sort()
  },
  deleteSchedule: async (currentUser, scheduleEvents) => {
    await CalendarManager.deleteMultipleEvents(scheduleEvents, currentUser)
  },
  deleteAllHolidaysForUser: async (currentUser) => {
    const dbPath = `${DB.tables.calendarEvents}/${currentUser.phone}`
    const allEvents = await DB.getTable(dbPath)
    for (let event of allEvents) {
      if (event?.isHoliday && event?.ownerPhone === currentUser.phone) {
        await DB.delete(dbPath, event.id)
      }
    }
  },
  addVisitationSchedule: async (currentUser, vScheduleEvents) => {
    // await CalendarManager.deleteMultipleEvents(vScheduleEvents, currentUser)
    try {
      await CalendarManager.addMultipleCalEvents(currentUser, vScheduleEvents)
    } catch (error) {
      LogManager.log(error.message, LogManager.logTypes.error, error.stack)
    }
  },
}

export default VisitationManager
