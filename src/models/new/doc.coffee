import Manager from "../../managers/manager"
import moment from "moment"
import DatetimeFormats from "../../constants/datetimeFormats"

class Doc
  constructor: (options = {}) ->
    @id = Manager.GetUid()
    @creationDate = moment().format(DatetimeFormats.dateForDb)
    @name = options?.name ? ''
    @type = options?.type ? ''
    @shareWith = options?.shareWith ? []
    @url = options?.url ? ''
    @ownerKey = options?.ownerKey ? ''
    @docText = options?.docText ? ''

export default Doc