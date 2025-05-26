import Manager from "../../managers/manager"

class Coparent
  constructor: (options = {}) ->
    @id = options.id ? Manager.GetUid()
    @name = options.name ? ''
    @parentType = options.parentType ? ''
    @phone = options.phone ? ''
    @userKey = options.userKey ? ''
    @address = options.address ? ''
    @relationshipToMe = options.relationshipToMe ? ''
    @email = options.email ? ''

export default Coparent