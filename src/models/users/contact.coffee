import Manager from "/src/managers/manager"
import moment from "moment"
import DatetimeFormats from "../../constants/datetimeFormats"

class Contact
  constructor: (options = {}) ->
    @id = Manager.GetUid()
    @name = options?.name ? ''
    @creationDate = moment().format(DatetimeFormats.dateForDb)
    @email = options?.email ? ''
    @phone = options?.phone ? ''
    @address  = options?.address ? ''
    @accountType = options?.accountType ? ''
    @parentType = options?.parentType ? ''
    @relationshipToMe = options?.relationshipToMe ? ''
    @profilePic =  options?.profilePic ? ''
    @userKey =  options?.userKey ? ''

export default Contact