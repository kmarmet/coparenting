import Manager from "../managers/manager"
import moment from 'moment'
import DateFormats from '../constants/datetimeFormats'

class User
  constructor: (
    @id = Manager.GetUid()
    @creationDate = moment().format(DateFormats.dateForDb)
    @key = ''
    @name = ''
    @email = ''
    @phone = ''
    @children = []
    @coparents = []
    @sharedDataUsers = []
    @parentType = ''
    @accountType = ''
    @homeAddress = ''
    @app = {
      currentVersion: 1
    }
    @location = {
      country: ''
      city: ''
      state: ''
      latitude: ''
      location: ''
      timezone: ''
    }
    @settings = {
      theme: 'light'
      notificationsEnabled: true
    }
    @dailySummaries = {
      morningSentDate:moment().format(DateFormats.dateForDb)
      eveningSentDate: moment().format(DateFormats.dateForDb)
      morningReminderSummaryHour: '10am'
      eveningReminderSummaryHour: '8pm'
    }
    @visitation = {
      transferAddress: ''
      transferNavLink: ''
      visitationSchedule: ''
      visitationHolidays: []
    }
  ) ->

export default User