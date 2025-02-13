import Manager from "../managers/manager"

export default class User
  constructor: (
    @id = Manager.getUid()
    @name = ''
    @email = ''
    @phone = ''
    @children = []
    @childAccounts = []
    @coparents = []
    @parentType = ''
    @accountType = ''
    @notificationsEnabled = ''
    @settings = {
      theme: 'light'
    }
    @dailySummaries = {
      morningSentDate: ''
      eveningSentDate: ''
      morningReminderSummaryHour: '10am'
      eveningReminderSummaryHour: '8pm'
    }
    @visitation = {
      transferLocation: ''
      transferLocationNavLink: ''
      visitationSchedule: ''
      visitationHolidays: []
    }
  ) ->