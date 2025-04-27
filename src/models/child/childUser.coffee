import Manager from '../../managers/manager.js'

export default class ChildUser
  constructor: (
    @parents = []
    @name = ''
    @email = ''
    @accountType = 'child'
    @phone = ''
    @id = Manager.getUid()
    @settings = {
      theme: 'light'
      notificationsEnabled: true
    }
    @dailySummaries = {
      morningSentDate: ''
      eveningSentDate: ''
      morningReminderSummaryHour: '10am'
      eveningReminderSummaryHour: '8pm'
    }
    @parentAccessGranted = false
  ) ->