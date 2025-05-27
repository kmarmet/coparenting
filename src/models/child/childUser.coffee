import Manager from '../../managers/manager.js'
import moment from 'moment'
import DatetimeFormats from "../../constants/datetimeFormats"

class ChildUser
  constructor: (options = {}) ->
    @id = Manager.GetUid()
    @creationDate = moment().format(DatetimeFormats.dateForDb)
    @accountType =  'child'
    @parents = options?.parents ?  []
    @name = options?.name ? ''
    @email =  options?.email ? ''
    @phone = options?.phone ? ''
    @parentAccessGranted = false
    @profilePic =  options?.profilePic ? ''
    @settings =
      theme: 'light'
      notificationsEnabled: true

    @dailySummaries =
      morningSentDate: ''
      eveningSentDate: ''
      morningReminderSummaryHour: '10am'
      eveningReminderSummaryHour: '8pm'

export default ChildUser