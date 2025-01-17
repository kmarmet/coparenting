import Manager from "../managers/manager"

export default class User
  constructor: (
    @id = Manager.getUid()
    @name = ''
    @email = ''
    @phone = ''
    @children = []
    @coparents = []
    @parentType = ''
    @accountType = ''
    @allowNotifications = ''
    @settings = {
      theme: 'light'
    }
    @dailySummaries = {
      morningSentDate: ''
      eveningSentDate: ''
      morningReminderSummaryHour: '10am'
      eveningReminderSummaryHour: '8pm'
      notificationsEnabled: true
    }
    @visitation = {
      transferLocation: ''
      transferLocationNavLink: ''
      visitationSchedule: ''
      visitationHolidays: []

    }
  ) ->