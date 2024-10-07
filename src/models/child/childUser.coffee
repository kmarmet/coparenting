import Manager from '@manager'

export default class ChildUser
  constructor: (
    _name = 'name'
    _id = ''
    _allowNotifications = 'Yes'
    _email = 'email'
    _password = 'password'
    _phone = 'phone'
    _accountType = 'child'
    _parents = []
    _settings = {
      morningReminderSummaryHour: '10am'
      eveningReminderSummaryHour: '8pm'
    }
  ) ->
    @parents = _parents
    @name = _name
    @email = _email
    @phone = _phone
    @accountType = _accountType
    @password = _password
    @allowNotifications = _allowNotifications
    @id = Manager.getUid()
    @settings = _settings


