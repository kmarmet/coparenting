import Manager from "../managers/manager"

export default class User
  constructor: (
    @updatedApp = ''
    @name = ''
    @email = ''
    @phone = ''
    @children = []
    @coparents = []
    @parentType = ''
    @accountType = ''
    @allowNotifications = ''
    @id = Manager.getUid()
    @settings = {
      morningReminderSummaryHour: '10am'
      eveningReminderSummaryHour: '8pm'
    },
  ) ->



