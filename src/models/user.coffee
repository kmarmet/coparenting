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
    @emailVerified = false
    @defaultTransferLocation = ''
    @defaultTransferNavLink = ''
    @dailySummaries = {
      morningSentDate: ''
      eveningSentDate: ''
      morningReminderSummaryHour: '10am'
      eveningReminderSummaryHour: '8pm'
    }
  ) ->