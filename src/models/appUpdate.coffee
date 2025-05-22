import Manager from "../managers/manager"
import DatetimeFormats from "../constants/datetimeFormats"
import moment from "moment"

class AppUpdate
  constructor: (options = {}) ->
    @id = Manager.GetUid()
    @timestamp = moment(options.timestamp).format(DatetimeFormats.dateForDb) ? moment().format(DatetimeFormats.dateForDb)
    @currentVersion = options.currentVersion ? 1

export default AppUpdate