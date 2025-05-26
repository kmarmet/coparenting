import Manager from "../../managers/manager"

class Parent
  constructor: (options = {} ) ->
    @id = Manager.GetUid()
    @userKey = options?.userKey ? ''
    @name =  options?.name ? ''
    @email = options?.email ? ''
    @phone = options?.phone ? ''
    @address = options?.address ? ''
    @parentType = options?.parentType ? ''

export default Parent