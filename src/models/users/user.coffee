import Manager from "../../managers/manager"
import moment from 'moment'
import DateFormats from '../../constants/datetimeFormats'

class User
  constructor: (options = {}) ->
    @id = Manager.GetUid()
    @creationDate = moment().format(DateFormats.dateForDb)
    @key =  options?.key ? ''
    @name =  options?.name ? ''
    @email = options?.email ? ''
    @phone =  options?.phone ? ''
    @children =   options?.children ?  []
    @coparents = options?.coparents ? []
    @sharedDataUsers = options?.sharedDataUsers ? []
    @parentType = options?.parentType ? ''
    @accountType = options?.accountType ? ''
    @homeAddress = options?.homeAddress ? ''
    @app =
      currentVersion: 1

    @location =
      country: options?.location?.country ? ''
      city: options?.location?.city ? ''
      state:  options?.location?.state ? ''
      latitude:  options?.location?.latitude ? ''
      location: options?.location?.location ? ''
      timezone:  options?.location?.timezone ? ''

    @settings =
      theme:   'light'
      notificationsEnabled: true

    @dailySummaries =
      morningSentDate:moment().format(DateFormats.dateForDb)
      eveningSentDate: moment().format(DateFormats.dateForDb)
      morningReminderSummaryHour: '10am'
      eveningReminderSummaryHour: '8pm'

    @visitation =
      transferAddress: options?.visitation?.transferAddress ? ''
      transferNavLink:  options?.visitation?.transferNavLink ? ''
      schedule:  options?.visitation?.schedule ? ''
      holidays:  options?.visitation?.holidays ? []

export default User