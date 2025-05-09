import Manager from '../../managers/manager.js'
import moment from 'moment'
import DatetimeFormats from "../../constants/datetimeFormats"

export default class ChildUser
  constructor: (
    @creationDate = moment().format(DatetimeFormats.dateForDb)
    @parents = []
    @name = ''
    @email = ''
    @accountType = 'child'
    @phone = ''
    @id = Manager.GetUid()
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