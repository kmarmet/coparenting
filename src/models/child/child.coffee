import Manager from '../../managers/manager'
import DatetimeFormats from "../../constants/datetimeFormats"
import moment from "moment"

class Child
  constructor: (options = {}) ->
    @id = Manager.GetUid()
    @creationDate = moment().format(DatetimeFormats.dateForDb)
    @userKey =  options?.userKey ? ''
    @profilePic =  options?.profilePic ? ''
    @details = options?.details ? []

export default Child