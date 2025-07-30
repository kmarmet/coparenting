import Manager from "../../managers/manager"

class CoParent
  constructor: (options = {}) ->
    @id = options?.id ? Manager.GetUid()
    @name = options?.name ? ''
    @parentType = options?.parentType ? ''
    @phone = options?.phone ? ''
    @userKey = options?.userKey ? Manager.GetUid()
    @address = options?.address ? ''
    @relationship = options?.relationship ? ''
    @email = options?.email ? ''
    @notificationsEnabled = options?.notificationsEnabled ? true

export default CoParent