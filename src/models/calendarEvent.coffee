import Manager from "../managers/manager"

export default class CalendarEvent
  constructor: (
    @id = Manager.getUid()
    @multipleDatesId = ''
    @websiteUrl = ''
    @notes = ''
    @shareWith = []
    @endDate = ''
    @startDate = ''
    @staticStartDate = ''
    @startTime = ''
    @ownerKey = ''
    @children = []
    @location = ''
    @title = ''
    @phone = ''
    @createdBy = ''
    @reminderTimes = []
    @coparentsToRemindPhones = []
    @directionsLink = ''
    @endTime = ''
    @fromVisitationSchedule = false
    @recurringInterval = ''
    @sentReminders = []
    @visitationPeriodEndDate = ''
    @visibleToAll = false
    @holidayName = ''
    @visitationSchedule = ''
    @isHoliday = false,
    @isRecurring = false
    @isCloned = false
    @isDateRange = false
  ) ->