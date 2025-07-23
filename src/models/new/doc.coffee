import Manager from "../../managers/manager"
import moment from "moment"
import DatetimeFormats from "../../constants/datetimeFormats"

class Doc
  constructor: (options = {}) ->
    @id = Manager.GetUid()
    @creationDate = moment().format(DatetimeFormats.dateForDb)
    @documentName = options?.documentName ? ''
    @type = options?.type ? ''
    @shareWith = options?.shareWith ? []
    @url = options?.url ? ''
    @docText = options?.docText ? ''
    
    @owner =
      name: options?.owner?.name ? ''
      key: options?.owner?.key ? ''

export default Doc