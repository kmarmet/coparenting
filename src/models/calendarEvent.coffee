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
    @morningSummaryReminderSent = false
    @eveningSummaryReminderSent = false
    @fromVisitationSchedule = false
    @repeatInterval = ''
    @sentReminders = []
    @visitationPeriodEndDate = ''
    @isHoliday = false,
    @visibleToAll = false
    @holidayName = ''
    @visitationSchedule = ''
  ) ->