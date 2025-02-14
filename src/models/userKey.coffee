import Manager from "../managers/manager"

export default class UserKey
  constructor: (
    @id = Manager.getUid()
    @key = ''
    @email = ''
  ) ->