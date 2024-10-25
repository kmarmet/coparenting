import Manager from "../managers/manager"

export default class User
  constructor: (
    _name = 'name'
    _id = ''
    _allowNotifications = 'Yes'
    _email = ''
    _coparents = []
    _children = []
    _phone = ''
    _parentType = ''
    _accountType = 'parent'
    _settings = {
      morningReminderSummaryHour: '10am'
      eveningReminderSummaryHour: '8pm'
    },
    _updatedApp = false
  ) ->
    @updatedApp = _updatedApp
    @name = _name
    @email = _email
    @phone = _phone
    @children = _children
    @coparents = _coparents
    @parentType = _parentType
    @accountType = _accountType
    @allowNotifications = _allowNotifications
    @parentType = _parentType
    @id = Manager.getUid()
    @settings = _settings


