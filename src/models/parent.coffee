import Manager from "../managers/manager"

class Parent
  constructor: (
    @id = Manager.GetUid()
    @userKey = ''
    @name = ''
    @email = ''
    @phone = ''
    @address = ''
    @parentType = ''
  ) ->

export default Parent