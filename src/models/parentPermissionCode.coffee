import moment from "moment"

export default class ParentPermissionCodes
  constructor: (
   _code = ""
   _expiration = moment().add(5, "minutes")
   _parentPhone = ""
   _childPhone = ''
  ) ->
    @childPhone = _childPhone
    @code = _code
    @expiration =  moment().add(5, "minutes")
    @parentPhone = _parentPhone
