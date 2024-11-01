export default class CalendarEvent
  constructor: (
    @id = ''
    @websiteUrl = ''
    @notes = ''
    @shareWith = []
    @toDate = ''
    @fromDate = ''
    @startTime = ''
    @ownerPhone = ''
    @children = []
    @location = ''
    @title = ''
    @createdBy = ''
    @reminderTimes = []
    @directionsLink = ''
    @endTime = ''
    @morningSummaryReminderSent = false
    @eveningSummaryReminderSent = false
    @fromVisitationSchedule = false
    @repeatInterval = ''
    @sentReminders = []
    @visitationPeriodEndDate = ''
    @isHoliday = false
  ) ->