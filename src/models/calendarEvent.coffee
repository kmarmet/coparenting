export default class CalendarEvent
  constructor: (
    @id = ''
    @websiteUrl = ''
    @notes = ''
    @shareWith = []
    @endDate = ''
    @startDate = ''
    @startTime = ''
    @ownerPhone = ''
    @children = []
    @location = ''
    @title = ''
    @createdBy = ''
    @reminderTimes = []
    @coparentsToRemindPhones = []
    @directionsLink = ''
    @endTime = ''
    @fromVisitationSchedule = false
    @repeatInterval = ''
    @sentReminders = []
    @visitationPeriodEndDate = ''
    @isHoliday = false,
    @visibleToAll = false
    @holidayName = ''
    @visitationSchedule = ''
    @isRepeating = false
    @isCloned = ''
    @isDateRange = ''
  ) ->