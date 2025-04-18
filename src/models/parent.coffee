import Manager from "../managers/manager"

export default class Parent
  constructor: (
    @id = Manager.getUid()
    @userKey = ''
    @name = ''
    @email = ''
    @phone = ''
    @address = ''
    @parentType = ''
  ) ->