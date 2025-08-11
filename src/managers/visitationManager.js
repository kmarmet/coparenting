// Path: src\managers\visitationManager.js
import moment from "moment"
import DatetimeFormats from "../constants/datetimeFormats"
import DB from "../database/DB"
import CalendarManager from "./calendarManager.js"
import DatasetManager from "./datasetManager"
import DateManager from "./dateManager"
import LogManager from "./logManager"

const VisitationManager = {
    weekendMapper: (input) => {
        let returnVal
        switch (true) {
            case input.indexOf("1st") > -1:
                returnVal = 0
                break
            case input.indexOf("2nd") > -1:
                returnVal = 1
                break
            case input.indexOf("3rd") > -1:
                returnVal = 2
                break
            case input.indexOf("4th") > -1:
                returnVal = 3
                break
            case input.indexOf("5th") > -1:
                returnVal = 4
                break
            default:
                returnVal = input
        }

        return returnVal
    },
    getDateRange: (firstDate, lastDate) => {
        if (moment(firstDate, "MM/DD/yyyy").isSame(moment(lastDate, "MM/DD/yyyy"), "day")) return [lastDate]
        let date = firstDate
        const dates = [date]
        do {
            date = moment(date).add(1, "day")
            dates.push(date.format("MM/DD/yyyy"))
        } while (moment(date).isBefore(lastDate))
        return dates
    },
    getSpecificWeekends: (scheduleType, endDate, selectedWeekends, fifthWeekendSelection) => {
        let formattedWeekends = selectedWeekends.map((x) => VisitationManager.weekendMapper(x))

        let iterationMonth = moment().startOf("month").format("MM")
        let readableMonths = []
        const monthsLeftInYear = 12 - moment().month() - 1
        const lastDayOfYear = moment([moment().year()]).endOf("year").format("MM-DD-YYYY")

        // Get readable months until end of year
        for (let counter = 0; counter <= monthsLeftInYear; counter++) {
            readableMonths.push(iterationMonth)
            iterationMonth = moment(moment(iterationMonth).add(1, "month")).format("MM")
        }

        const dateArray = []
        // Loop fridays in month
        for (let i = 0; i <= readableMonths.length; i++) {
            const thisMonth = readableMonths[i]
            let daysInMonth = moment(readableMonths[i]).daysInMonth()
            let fridayInMonthNumber = 0
            for (let x = 1; x <= daysInMonth; x++) {
                let thisDay = moment(`${thisMonth} ${x} ${moment().year()}`).format("MM/DD/yyyy")
                // Do not go past end of year
                if (moment(thisDay).isSameOrAfter(moment(lastDayOfYear))) {
                    break
                }
                let dayOfTheWeek = moment(thisDay, "MM DD").format("dddd")

                // Add to dates array
                if (dayOfTheWeek === "Friday") {
                    // First friday
                    if (formattedWeekends.includes(fridayInMonthNumber) && fridayInMonthNumber === 0) {
                        const range = VisitationManager.getDateRange(thisDay, moment(thisDay).add(2, "days"))
                        dateArray.push(range.flat())
                    }

                    // Second Weekend
                    if (formattedWeekends.includes(fridayInMonthNumber) && fridayInMonthNumber === 1) {
                        const range = VisitationManager.getDateRange(thisDay, moment(thisDay).add(2, "days"))
                        dateArray.push(range.flat())
                    }

                    // // Third Weekend
                    if (formattedWeekends.includes(fridayInMonthNumber) && fridayInMonthNumber === 2) {
                        const range = VisitationManager.getDateRange(thisDay, moment(thisDay).add(2, "days"))
                        dateArray.push(range.flat())
                    }

                    // Fourth Weekend
                    if (formattedWeekends.includes(fridayInMonthNumber) && fridayInMonthNumber === 3) {
                        const range = VisitationManager.getDateRange(thisDay, moment(thisDay).add(2, "days"))
                        dateArray.push(range.flat())
                    }

                    // Fifth Weekend
                    if (fridayInMonthNumber === 4) {
                        if (VisitationManager.weekendMapper(fifthWeekendSelection) === 4) {
                            const range = VisitationManager.getDateRange(thisDay, moment(thisDay).add(2, "days"))
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
        const firstWeekendDate = moment(firstWeekend).format(DatetimeFormats.dateForDb)
        let iterationMonth = moment().startOf("month").format("MM")
        let readableMonths = []
        const monthsLeftInYear = 12 - moment().month() - 1
        const lastDayOfYear = moment([moment().year()]).endOf("year").format("MM-DD-YYYY")
        let fridayToAddTo = firstWeekendDate
        // Get readable months until end of year
        for (let counter = 0; counter <= monthsLeftInYear; counter++) {
            readableMonths.push(iterationMonth)
            iterationMonth = moment(moment(iterationMonth).add(1, "month")).format("MM")
        }
        const dateArray = []
        // Loop fridays in month
        for (let i = 0; i <= readableMonths.length; i++) {
            const thisMonth = readableMonths[i]
            let daysInMonth = moment(readableMonths[i]).daysInMonth()
            for (let x = 1; x <= daysInMonth; x++) {
                let thisDay = moment(`${thisMonth} ${x} ${moment().year()}`).format("MM/DD/yyyy")
                // Do not go past end of year
                if (moment(thisDay).isSameOrAfter(moment(lastDayOfYear))) {
                    break
                }
                let dayOfTheWeek = moment(thisDay, "MM DD").format("dddd")

                // Add to dates array
                if (dayOfTheWeek === "Friday") {
                    const thisFridayDate = moment(thisDay).format(DatetimeFormats.dateForDb)
                    if (thisFridayDate === fridayToAddTo) {
                        const range = VisitationManager.getDateRange(
                            moment(fridayToAddTo).format(DatetimeFormats.dateForDb),
                            moment(thisDay).add(2, "days")
                        )
                        const fridayPlusTwoWeeks = moment(thisDay).add(2, "weeks")
                        fridayToAddTo = moment(fridayPlusTwoWeeks).format(DatetimeFormats.dateForDb)
                        dateArray.push(range.flat())
                    }
                }
            }
        }
        return dateArray
    },
    getEveryWeekend: () => {
        let iterationMonth = moment().startOf("month").format("MM")
        let readableMonths = []
        const monthsLeftInYear = 12 - moment().month() - 1
        const lastDayOfYear = moment([moment().year()]).endOf("year").format("MM-DD-YYYY")
        // Get readable months until end of year
        for (let counter = 0; counter <= monthsLeftInYear; counter++) {
            readableMonths.push(iterationMonth)
            iterationMonth = moment(moment(iterationMonth).add(1, "month")).format("MM")
        }
        const dateArray = []
        // Loop fridays in month
        for (let i = 0; i <= readableMonths.length; i++) {
            const thisMonth = readableMonths[i]
            let daysInMonth = moment(readableMonths[i]).daysInMonth()
            for (let x = 1; x <= daysInMonth; x++) {
                let thisDay = moment(`${thisMonth} ${x} ${moment().year()}`).format("MM/DD/yyyy")
                // Do not go past end of year
                if (moment(thisDay).isSameOrAfter(moment(lastDayOfYear))) {
                    break
                }
                let dayOfTheWeek = moment(thisDay, "MM DD").format("dddd")

                // Add to dates array
                if (dayOfTheWeek === "Friday") {
                    const range = VisitationManager.getDateRange(thisDay, moment(thisDay).add(2, "days"))
                    dateArray.push(range.flat())
                }
            }
        }
        return dateArray
    },
    getVisitationHolidays: async (currentUser) => {
        const holidays = await DateManager.GetHolidays()
        const currentUserEvents = await DB.GetTableData(`${DB.tables.calendarEvents}/${currentUser?.key}`)

        const userHolidays = currentUserEvents.filter((x) => x?.isHoliday && x?.owner?.key === currentUser?.key && x?.fromVisitationSchedule === true)

        return DatasetManager.GetValidArray(userHolidays, true)
    },
    setVisitationHolidays: async (currentUser, holidays) => {
        await VisitationManager.DeleteAllHolidaysForUser(currentUser)
        try {
            await CalendarManager.AddMultipleCalEvents(currentUser, holidays)
        } catch (error) {
            LogManager.Log(error.message, LogManager.LogTypes.error, error.stack)
        }
    },
    getSchedule: async (currentUser) => {
        return new Promise((resolve) => {
            DB.GetTableData(`${DB.tables.calendarEvents}/${currentUser?.key}`).then((events) => {
                let scheduleEvents = events.filter((x) => x.fromVisitationSchedule === true && x.ownerKey === currentUser?.key)
                resolve(scheduleEvents)
            })
        })
    },
    addWeeks: (datetime, howManyWeeks) => {
        return new Date(datetime.callback(datetime.getDate() + howManyWeeks * 7))
    },
    GetFiftyFifty: (dates) => {
        const {firstFFPeriodStart, firstFFPeriodEnd, secondFFPeriodStart, secondFFPeriodEnd, thirdFFPeriodStart, thirdFFPeriodEnd} = dates

        const year = new Date().getFullYear()
        const nextYear = year + 1

        function generatePeriodDates(start, end) {
            const result = []
            const durationInDays = DateManager.getDuration("days", start, end)
            const day = moment(start).format("DD")
            const month = new Date().getMonth() + 1

            for (let index = 0; index <= 12; index++) {
                const baseDate = new Date(`${year},${month},${day}`)
                const incrementedDate = VisitationManager.addWeeks(baseDate, index * 2)
                const visitationDates = VisitationManager.getDateRange(incrementedDate, moment(incrementedDate).add(durationInDays, "days"))
                    .map((x) => moment(x).format("MM/DD/yyyy"))
                    .filter((x) => !x.includes(nextYear.toString()) && x !== "Invalid date")

                result.push(...visitationDates)
            }

            return DatasetManager.getUniqueArray(result)
        }

        const firstPeriodDates = generatePeriodDates(firstFFPeriodStart, firstFFPeriodEnd)
        const secondPeriodDates = generatePeriodDates(secondFFPeriodStart, secondFFPeriodEnd)
        const thirdPeriodDates = generatePeriodDates(thirdFFPeriodStart, thirdFFPeriodEnd)

        return [...firstPeriodDates, ...secondPeriodDates, ...thirdPeriodDates].sort()
    },
    deleteSchedule: async (currentUser, scheduleEvents) => {
        await CalendarManager.deleteMultipleEvents(scheduleEvents, currentUser)
    },
    DeleteAllHolidaysForUser: async (currentUser) => {
        const dbPath = `${DB.tables.calendarEvents}/${currentUser?.key}`
        const allEvents = await DB.GetTableData(dbPath)
        const holidays = allEvents.filter((x) => x?.isHoliday && x?.owner?.key === currentUser?.key)
        await CalendarManager.deleteMultipleEvents(holidays, currentUser)
    },
    AddVisitationSchedule: async (currentUser, vScheduleEvents) => {
        // await CalendarManager.deleteMultipleEvents(vScheduleEvents, currentUser)
        try {
            await CalendarManager.AddMultipleCalEvents(currentUser, vScheduleEvents)
        } catch (error) {
            LogManager.Log(error.message, LogManager.LogTypes.error, error.stack)
        }
    },
}

export default VisitationManager