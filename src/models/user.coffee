import Manager from "../managers/manager"
import moment from 'moment'
import DateFormats from '../constants/dateFormats'

export default class User
  constructor: (
    @id = Manager.getUid()
    @key = ''
    @name = ''
    @email = ''
    @phone = ''
    @children = []
    @childAccounts = []
    @coparents = []
    @parentType = ''
    @accountType = ''
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