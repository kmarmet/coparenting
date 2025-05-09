import Manager from "../managers/manager"

export default class Parent
  constructor: (
    @id = Manager.GetUid()
    @userKey = ''
    @name = ''
    @email = ''
    @phone = ''
    @address = ''
    @parentType = ''
  ) ->