import Manager from "../managers/manager"
import DatetimeFormats from "../constants/datetimeFormats"
import moment from "moment"

class Changelog
  constructor: (options = {}) ->
    @id = Manager.GetUid()
    @releaseDate = moment().format(DatetimeFormats.dateForDb)
    @updatedVersion = options.updatedVersion ? 1
    @html = options.html ? ''

export default Changelog