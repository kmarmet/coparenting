import Manager from '@manager'

export default class ChildUser
  constructor: (
    @parents = []
    @name = ''
    @email = ''
    @accountType = ''
    @allowNotifications = ''
    @id = Manager.getUid()
    @dailySummaries = {
      morningSentDate: ''
      eveningSentDate: ''
      morningReminderSummaryHour: '10am'
      eveningReminderSummaryHour: '8pm'
    }
  ) ->