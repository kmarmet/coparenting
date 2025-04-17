import Manager from "../managers/manager"
import moment from 'moment'
import DateFormats from '../constants/datetimeFormats'

export default class User
  constructor: (
    @id = Manager.getUid()
    @key = ''
    @name = ''
    @email = ''
    @showInitialLoginAlert = true
    @phone = ''
    @children = []
    @coparents = []
    @parentType = ''
    @accountType = ''
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