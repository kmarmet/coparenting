import Manager from "../../managers/manager"
import moment from "moment"
import DatetimeFormats from "../../constants/datetimeFormats"

class Checklist
  constructor: (options = {}) ->
    @id = Manager.GetUid()
    @creationDate = moment().format(DatetimeFormats.dateForDb)
    @items = options?.items ? []
    @fromOrTo = "from"

export default  Checklist