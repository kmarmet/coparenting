import Manager from "../managers/manager"

export default class CalendarEvent
  constructor: (
    @id = Manager.getUid()
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
    @phone = ''
    @createdBy = ''
    @reminderTimes = []
    @coparentsToRemindPhones = []
    @directionsLink = ''
    @endTime = ''
    @fromVisitationSchedule = false
    @repeatInterval = ''
    @sentReminders = []
    @visitationPeriodEndDate = ''
    @visibleToAll = false
    @holidayName = ''
    @visitationSchedule = ''
    @isHoliday = false,
    @isRepeating = false
    @isCloned = false
    @isDateRange = false
  ) ->