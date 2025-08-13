import Manager from "../../managers/manager"

class CalendarEvent
  constructor: (options = {}) ->
  # STRINGS
    @id = Manager.GetUid()
    @websiteUrl = options?.websiteUrl ? ''
    @notes = options?.notes ? ''
    @endDate = options?.endDate ? ''
    @startDate = options?.startDate ? ''
    @startTime = options?.startTime ? ''
    @address = options?.address ? ''
    @title = options?.title ? ''
    @phone = options?.phone ? ''
    @directionsLink = options?.directionsLink ? ''
    @endTime = options?.endTime ? ''
    @recurringInterval = options?.recurringInterval ? ''
    @visitationPeriodEndDate = options?.visitationPeriodEndDate ? ''
    @holidayName = options?.holidayName ? ''

  # OWNER
    @owner =
      name: options?.owner?.name ? ''
      key: options?.owner?.key ? ''

  # ARRAYS
    @reminderTimes = options?.reminderTimes ? []
    @shareWith = options?.shareWith ? []
    @children = options?.children ? []
    @sentReminders = options?.sentReminders ? []
    @categories = options?.categories ? []

  # BOOLEANS
    @fromVisitationSchedule = options?.fromVisitationSchedule ? false
    @isHoliday = options?.isHoliday ? false
    @isRecurring = options?.isRecurring ? false
    @isCloned = options?.isCloned ? false
    @isDateRange = options?.isDateRange ? false

export default CalendarEvent