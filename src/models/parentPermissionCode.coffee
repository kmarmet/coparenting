import moment from "moment"

export default class ParentPermissionCodes
  constructor: (
   @code = ""
   @expiration = moment().add(5, "minutes")
   @parentPhone = ""
   @childPhone = ''
  ) ->
