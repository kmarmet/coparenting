import Manager from '@manager'
import General from "./general"
import Medical from "./medical"
import Schooling from "./schooling"
import Behavior from "./behavior"

export default class ChildUser
  constructor: (
    _name = 'name'
    _id = ''
    _allowNotifications = 'Yes'
    _email = ''
    _phone = ''
    _accountType = 'child'
    _parents = []
    _settings = {
      morningReminderSummaryHour: '10am'
      eveningReminderSummaryHour: '8pm'
    }
    general=  new General()
    medical = new Medical()
    behavior = new Behavior()
    schooling = new Schooling()
  ) ->
    @parents = _parents
    @name = _name
    @email = _email
    @phone = _phone
    @accountType = _accountType
    @allowNotifications = _allowNotifications
    @id = Manager.getUid()
    @settings = _settings
    @general = general
    @medical = medical
    @schooling = schooling
    @behavior = behavior


