import Manager from '../../managers/manager.js'

export default class ChildUser
  constructor: (
    @parents = []
    @name = ''
    @email = ''
    @accountType = ''
    @notificationsEnabled = true
    @id = Manager.getUid()
    @dailySummaries = {
      morningSentDate: ''
      eveningSentDate: ''
      morningReminderSummaryHour: '10am'
      eveningReminderSummaryHour: '8pm'
    }
  ) ->