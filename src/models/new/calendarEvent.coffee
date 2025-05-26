import Manager from "../../managers/manager"

class CalendarEvent
  constructor: (options = {}) ->
  # STRINGS
    @id = Manager.GetUid()
    @multipleDatesId = options.multipleDatesId ? ''
    @websiteUrl = options.websiteUrl ? ''
    @notes = options.notes ? ''
    @endDate = options.endDate ? ''
    @startDate = options.startDate ? ''
    @staticStartDate = options.staticStartDate ? ''
    @startTime = options.startTime ? ''
    @ownerKey = options.ownerKey ? ''
    @address = options.address ? ''
    @title = options.title ? ''
    @phone = options.phone ? ''
    @createdBy = options.createdBy ? ''
    @directionsLink = options.directionsLink ? ''
    @endTime = options.endTime ? ''
    @recurringInterval = options.recurringInterval ? ''
    @visitationPeriodEndDate = options.visitationPeriodEndDate ? ''
    @holidayName = options.holidayName ? ''
    @visitationSchedule = options.visitationSchedule ? ''

  # ARRAYS
    @reminderTimes = options.reminderTimes ? []
    @shareWith = options.shareWith ? []
    @children = options.children ? []
    @sentReminders = options.sentReminders ? []

  # BOOLEANS
    @fromVisitationSchedule = false
    @isHoliday = false
    @isRecurring = false
    @isCloned = false
    @isDateRange = false

export default CalendarEvent