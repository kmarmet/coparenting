import Manager from "../managers/manager"

export default class User
  constructor: (
    @name = ''
    @email = ''
    @phone = ''
    @children = []
    @coparents = []
    @parentType = ''
    @accountType = ''
    @allowNotifications = ''
    @id = Manager.getUid()
    @defaultTransferLocation = ''
    @defaultTransferNavLink = ''
    @notificationsEnabled = true
    @settings = {
      theme: 'light'
    }
    @dailySummaries = {
      morningSentDate: ''
      eveningSentDate: ''
      morningReminderSummaryHour: '10am'
      eveningReminderSummaryHour: '8pm'
    }
  ) ->