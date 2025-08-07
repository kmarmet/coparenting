import moment from "moment-timezone"
import Apis from "../api/apis"
import DatetimeFormats from "../constants/datetimeFormats"
import DB from "../database/DB"
import Manager from "../managers/manager"
import CalendarEvent from "../models/new/calendarEvent"
import CalendarManager from "./calendarManager.js"
import DatasetManager from "./datasetManager"
import StringManager from "./stringManager"

const DateManager = {
    KnownFormats: [
        moment.ISO_8601,
        "MM/DD/YYYY",
        "DD/MM/YYYY",
        "YYYY-MM-DD",
        "YYYY/MM/DD",
        "YYYY-MM-DDTHH:mm:ssZ",
        "YYYY-MM-DD HH:mm:ss",
        "MM/DD/YYYY h:mm A",
        "HH:mm:ss",
        "HH:mm",
        "MM/DD/yyyy",
        "DD/MM/yyyy",
        "yyyy-MM-DD",
        "yyyy/MM/DD",
        "yyyy-MM-DDTHH:mm:ssZ",
        "yyyy-MM-DD HH:mm:ss",
        "MM/DD/yyyy h:mm A",
        "HH:mm:ss",
        "HH:mm",
        "dddd, MMMM DD, YYYY",
        "ddd, MMM DD (h:mma)",
        "MM/DD/YYYY h:mma",
        "dddd, MMMM Do",
        "MMMM DD, YYYY",
        "MMMM Do",
        "MMMM Do, YYYY",
        "MM/DD",
        "MM/DD/YYYY",
        "yyyy,MM,DD h:mm a",
        "YYYY-MM-DD",
        "h:mma",
        "MM/DD/YYYY",
        "dddd Do",
        "MM/DD/yyyy h:mma",
        "MM",
        "MMMM",
        "ha",
    ],
    GetRepeatingEvents: async (object) => {
        const eventTitle = object.title
        let repeatingEvents = await DB.GetTableData(DB.tables.calendarEvents)
        repeatingEvents = repeatingEvents.filter((event) => event.title === eventTitle)
        const recurringInterval = object.recurringInterval
        const active = document.querySelector(`[data-label=${StringManager.UppercaseFirstLetterOfAllWords(recurringInterval)}]`)
        if (Manager.IsValid(active)) {
            document.querySelector(`[data-label=${StringManager.UppercaseFirstLetterOfAllWords(recurringInterval)}]`).classList.add("active")
        }
        return repeatingEvents
    },
    GetCurrentJavascriptDate: () => {
        const date = new Date()
        let day = date.getDate()
        let month = date.getMonth() + 1
        let year = date.getFullYear()
        let currentDate = `${month}/${day}/${year}`
        return currentDate
    },
    convertTime: (time, sourceTimezone, targetTimezone) => {
        if (!Manager.IsValid(sourceTimezone) || !Manager.IsValid(targetTimezone)) {
            return moment(time).format(DatetimeFormats.timeForDb)
        }
        const momentObj = moment.tz(time, "h:mma", sourceTimezone)
        const convertedMomentObj = momentObj.tz(targetTimezone)
        return moment(convertedMomentObj).format(DatetimeFormats.timeForDb)
    },
    getTimeFromTimezone: (currentUser, date) => {
        const currentDate = moment.tz(date)
        return currentDate.tz(currentUser?.location?.timezone).format(DatetimeFormats.timeForDb)
    },
    SortCalendarEvents: (events, datePropertyName, timePropertyName) => {
        // const sorted = events.SortExpenses((a, b) =>
        //     moment(a.startTime, DatetimeFormats.timeForDb).diff(moment(b.startTime, DatetimeFormats.timeForDb))
        // )
        // console.Log(sorted)
        let nestedSort =
            (prop1, prop2 = null, direction = "asc") =>
            (e1, e2) => {
                const a = prop2 ? e1[prop1][prop2] : e1[prop1],
                    b = prop2 ? e2[prop1][prop2] : e2[prop1],
                    sortOrder = direction === "asc" ? 1 : -1
                return a < b ? -sortOrder : a > b ? sortOrder : 0
            }
        // const sortedByDate = events.sort(nestedSort(datePropertyName, null, 'asc'))
        // const sortedByDateAndTime = events.sort(nestedSort(timePropertyName, null, 'asc'))
        // const combined = DatasetManager.getUniqueArray([...sortedByDate, ...sortedByDateAndTime], true)
        // return sorted
    },
    sortByTime: (events) => {
        const sorted = events.SortExpenses((a, b) => moment(a.startTime).diff(moment(b.startTime)))
        console.log(sorted)
        return []
    },
    getWeeksUntilEndOfYear: () => {
        const endOfYear = moment([moment().format("yyyy")])
            .endOf("year")
            .format(DatetimeFormats.dateForDb)

        const weeksLeftMs = moment(endOfYear, "MM-DD-YYYY", "weeks").diff(moment())
        const mil = weeksLeftMs
        const weeks = Math.floor(mil / (1000 * 7 * 24 * 60 * 60))
        return weeks
    },
    getMomentFormat: (date) => {
        // Date only
        if (date?.indexOf("/") > -1 && date?.indexOf(":") === -1) {
            return DatetimeFormats.dateForDb
        } else if (date?.indexOf("/") === -1 && date?.indexOf(":") > -1) {
            return DatetimeFormats.timeForDb
        }
        if (date?.indexOf("/") > -1 && date?.indexOf(":") > -1) {
            return DatetimeFormats.timestamp
        }
        if (date?.indexOf("-") > -1) {
            return DatetimeFormats.jsDate
        }
    },
    ParseAnyDate: (input) => {
        const knownFormats = [
            moment.ISO_8601,
            "MM/DD/YYYY",
            "DD/MM/YYYY",
            "YYYY-MM-DD",
            "YYYY/MM/DD",
            "YYYY-MM-DDTHH:mm:ssZ",
            "YYYY-MM-DD HH:mm:ss",
            "MM/DD/YYYY h:mm A",
            "HH:mm:ss",
            "HH:mm",
            "MM/DD/yyyy",
            "DD/MM/yyyy",
            "yyyy-MM-DD",
            "yyyy/MM/DD",
            "yyyy-MM-DDTHH:mm:ssZ",
            "yyyy-MM-DD HH:mm:ss",
            "MM/DD/yyyy h:mm A",
            "HH:mm:ss",
            "HH:mm",
            "dddd, MMMM DD, YYYY",
            "ddd, MMM DD (h:mma)",
            "MM/DD/YYYY h:mma",
            "dddd, MMMM Do",
            "MMMM DD, YYYY",
            "MMMM Do",
            "MMMM Do, YYYY",
            "MM/DD",
            "MM/DD/YYYY",
            "yyyy,MM,DD h:mm a",
            "YYYY-MM-DD",
            "h:mma",
            "MM/DD/YYYY",
            "dddd Do",
            "MM/DD/yyyy h:mma",
            "MM",
            "MMMM",
            "ha",
        ]
        for (const fmt of knownFormats) {
            const m = moment(input, fmt, true)
            if (m.isValid()) {
                return {moment: m, format: fmt}
            }
        }

        return {moment: null, format: null}
    },
    GetValidDate: (momentDate, outputFormat = DatetimeFormats.dateForDb) => {
        if (moment.isMoment(momentDate) && momentDate.isValid()) {
            return momentDate
        }
        return null
    },
    HasTime: (datetimeString) => {
        return /T\d{2}:\d{2}/.test(datetimeString) || /\d{2}:\d{2}/.test(datetimeString)
    },
    msToDate: (ms) => {
        return moment(ms, "x").format(DatetimeFormats.dateForDb)
    },
    isValidDate: (date) => {
        if (!Manager.IsValid(date)) {
            return false
        }
        const format = DateManager.getMomentFormat(date)
        const asMoment = moment(date, format).format(format)
        if (Manager.Contains(asMoment, "Invalid")) {
            return false
        }
        return asMoment.length !== 0
    },
    getDaysInRange: (startDate, endDate) => {
        let a = moment(startDate)
        let b = moment(endDate)
        return b.diff(a, "days")
    },
    getMonthsUntilEndOfYear: () => {
        const currentMonth = Number(moment().month()) + 1
        return 12 - currentMonth
    },
    getDaysUntilEndOfYear: () => {
        const endOfYear = moment([moment().format("yyyy")])
            .endOf("year")
            .format(DatetimeFormats.dateForDb)
        const daysLeftMs = moment(endOfYear, "MM-DD-YYYY", "days").diff(moment())
        let duration = moment.duration(daysLeftMs, "milliseconds")
        let daysLeft = duration.asDays()
        return Math.ceil(daysLeft)
    },
    GetDateRangeDates: (startDate, endDate) => {
        const dates = []
        let start = moment(startDate)
        const end = moment(endDate)

        while (start <= end) {
            dates.push(start.format(DatetimeFormats.dateForDb))
            start = start.add(1, "days")
        }

        return dates
    },
    getDailyDates: (startDate, endDate) => {
        const durationInDays = DateManager.getDuration("days", startDate, endDate)
        let dailyEvents = []

        for (let i = 0; i <= durationInDays; i++) {
            let newDay = moment(startDate).add(i, "days")
            const hasReachedEndDate = moment(newDay).isSameOrAfter(endDate)
            if (!hasReachedEndDate) {
                dailyEvents.push(newDay.format(DatetimeFormats.dateForDb))
            }
        }
        return dailyEvents
    },
    getMonthlyDates: (startDate, endDate) => {
        const durationInDays = DateManager.getDuration("days", startDate, endDate)
        let monthlyEvents = []
        for (let i = 1; i <= durationInDays; i++) {
            let newMonth = moment(startDate).add(i, "month")
            const hasReachedEndDate = moment(newMonth).isSameOrAfter(moment(endDate))
            if (!hasReachedEndDate) {
                monthlyEvents.push(moment(newMonth).format("MM/DD/yyyy"))
            }
        }
        return monthlyEvents
    },
    getBiweeklyDates: (startDate, endDate) => {
        let biweeklyEvents = []
        const durationInDays = DateManager.getDuration("days", startDate, endDate)
        const weeksLeft = Math.floor(durationInDays / 7)
        for (let i = 0; i <= weeksLeft; i++) {
            let newWeek = moment(startDate).add(i, "weeks")
            const hasReachedEndDate = moment(newWeek).isAfter(endDate)
            if (i % 2 === 0 && !hasReachedEndDate) {
                biweeklyEvents.push(newWeek.format(DatetimeFormats.dateForDb))
            }
        }
        console.log(biweeklyEvents)
        return biweeklyEvents
    },
    getWeeklyDates: (startDate, endDate) => {
        const durationInDays = DateManager.getDuration("days", startDate, endDate)
        let weeklyEvents = []

        for (let i = 0; i <= durationInDays; i++) {
            let newWeek = moment(startDate).add(i, "week")
            const hasReachedEndDate = moment(newWeek).isAfter(endDate)
            if (!hasReachedEndDate) {
                weeklyEvents.push(moment(newWeek).format(DatetimeFormats.dateForDb))
            }
        }
        return weeklyEvents
    },
    GetEasterDate: (year) => {
        const f = Math.floor,
            G = year % 19,
            C = f(year / 100),
            H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30,
            I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11)),
            J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7,
            L = I - J,
            month = 3 + f((L + 40) / 44),
            day = L + 28 - 31 * f(month / 4)
        return moment({year, month: month - 1, day}).format("YYYY-MM-DD")
    },
    GetNthSunday(year, month, n) {
        let date = moment({year, month, day: 1})
        let count = 0
        while (count < n) {
            if (date.day() === 0) count++
            if (count < n) date.add(1, "day")
        }
        return date.format("YYYY-MM-DD")
    },
    GetHolidays: async () =>
        new Promise(async (resolve) => {
            const holidayArray = await Apis.Dates.GetHolidays()
            const currentYear = moment().year()

            let holidays = DatasetManager.GetUniqueByPropValue(holidayArray, "name").map(({name, ...rest}) => ({
                name: name === "Juneteenth National Independence Day" ? "Juneteenth" : name,
                ...rest,
            }))

            const additionalHolidays = [
                {name: "Patriot's Day", date: `${currentYear}-09-11`},
                {name: "Christmas Eve", date: `${currentYear}-12-24`},
                {name: "New Year's Eve", date: `${currentYear}-12-31`},
                {name: "Halloween", date: `${currentYear}-10-31`},
                {name: "Easter", date: DateManager.GetEasterDate(currentYear)},
                {name: "Mother's Day", date: DateManager.GetNthSunday(currentYear, 4, 2)}, // May = 4
                {name: "Father's Day", date: DateManager.GetNthSunday(currentYear, 5, 3)}, // June = 5
            ]

            holidays.push(...additionalHolidays)

            resolve(holidays)
        }),
    getDuration: (timeInterval, start, end) => {
        if (timeInterval === "days") {
            return moment.duration(moment(end).diff(moment(start))).asDays()
        }
        if (timeInterval === "hours") {
            return moment.duration(moment(end).diff(moment(start))).asHours()
        }
        if (timeInterval === "seconds") {
            return moment.duration(moment(end).diff(moment(start))).asSeconds()
        }
        if (timeInterval === "minutes") {
            return moment.duration(moment(end).diff(moment(start))).asMinutes()
        }
    },
    addDays: (inputDate, numberOfDays) => {
        return moment(new Date(inputDate.callback(inputDate.getDate() + numberOfDays))).format(DatetimeFormats.dateForDb)
    },
    GetHolidaysAsEvents: async () => {
        const holidays = await DateManager.GetHolidays()
        let holidayEvents = []

        const switchCheck = (title, holidayName) => {
            return !!Manager.Contains(title, holidayName)
        }

        // SET EMOJIS / CREATE EVENT SET
        for (const holiday of holidays) {
            let newEvent = new CalendarEvent()

            // Required
            switch (true) {
                case switchCheck(holiday.name, "Halloween"):
                    newEvent.title = holiday.name += " 🎃"
                    break
                case switchCheck(holiday.name, "Christmas"):
                    newEvent.title = holiday.name += " 🎄"
                    break
                case switchCheck(holiday.name, "Thanksgiving"):
                    newEvent.title = holiday.name += " 🦃"
                    break
                case switchCheck(holiday.name, "Memorial"):
                    newEvent.title = holiday.name += " 🎖️"
                    break
                case switchCheck(holiday.name, "New Year"):
                    newEvent.title = holiday.name += " 🥳"
                    break
                case switchCheck(holiday.name, "Easter"):
                    newEvent.title = holiday.name += " 🐇"
                    break
                case switchCheck(holiday.name, "Mother"):
                    newEvent.title = holiday.name += " 👩‍👧‍👦"
                    break
                case switchCheck(holiday.name, "Patriot's Day"):
                    newEvent.title = holiday.name += " 🗽"
                    break
                case switchCheck(holiday.name, "Father"):
                    newEvent.title = holiday.name += " 👨‍👧‍👦"
                    break
                case switchCheck(holiday.name, "Juneteenth"):
                    newEvent.title = holiday.name += " ✨"
                    break
                case switchCheck(holiday.name, "Independence"):
                    newEvent.title = holiday.name += " 🎇"
                    break
                default:
                    newEvent.title = holiday.name
            }
            newEvent.id = Manager.GetUid()
            newEvent.holidayName = holiday.name
            newEvent.startDate = moment(holiday?.date).format(DatetimeFormats.dateForDb)
            newEvent.isHoliday = true
            holidayEvents.push(newEvent)
        }
        return DatasetManager.GetUniqueByPropValue(holidayEvents, "title")
    },
    SetHolidays: async () => {
        const holidays = await DateManager.GetHolidays()
        const patriotDay = new CalendarEvent()
        patriotDay.id = Manager.GetUid()
        patriotDay.holidayName = "Patriot Day 🗽"
        patriotDay.startDate = moment(`9/11/${moment().year()}`).format(DatetimeFormats.dateForDb)
        patriotDay.isHoliday = true
        let holidayEvents = []
        holidayEvents.push(patriotDay)

        const switchCheck = (title, holidayName) => !!Manager.Contains(title, holidayName)

        // SET EMOJIS / CREATE EVENT SET
        for (const holiday of holidays) {
            let newEvent = new CalendarEvent()

            // Required
            switch (true) {
                case switchCheck(holiday.name, "Halloween"):
                    newEvent.title = holiday.name += " 🎃"
                    break
                case switchCheck(holiday.name, "Christmas"):
                    newEvent.title = holiday.name += " 🎄"
                    break
                case switchCheck(holiday.name, "Thanksgiving"):
                    newEvent.title = holiday.name += " 🦃"
                    break
                case switchCheck(holiday.name, "Memorial"):
                    newEvent.title = holiday.name += " 🎖️"
                    break
                case switchCheck(holiday.name, "New Year"):
                    newEvent.title = holiday.name += " 🥳"
                    break
                case switchCheck(holiday.name, "Easter"):
                    newEvent.title = holiday.name += " 🐇"
                    break
                case switchCheck(holiday.name, "Mother"):
                    newEvent.title = holiday.name += " 👩‍👧‍👦"
                    break
                case switchCheck(holiday.name, "Father"):
                    newEvent.title = holiday.name += " 👨‍👧‍👦"
                    break
                case switchCheck(holiday.name, "Juneteenth"):
                    newEvent.title = holiday.name += " ✨"
                    break
                case switchCheck(holiday.name, "Independence"):
                    newEvent.title = holiday.name += " 🎇"
                    break
                default:
                    newEvent.title = holiday.name
            }
            newEvent.id = Manager.GetUid()
            newEvent.holidayName = holiday.name
            newEvent.startDate = moment(holiday?.date).format(DatetimeFormats.dateForDb)
            newEvent.isHoliday = true
            holidayEvents.push(newEvent)
        }
        await CalendarManager.SetHolidays(holidayEvents)
    },
    DateIsValid: (inputDate, format = DatetimeFormats.dateForDb) => {
        return moment(inputDate, format).isValid()
    },
    // DELETE
    deleteAllHolidays: async () => {
        await CalendarManager.deleteAllHolidayEvents()
    },
}

export default DateManager