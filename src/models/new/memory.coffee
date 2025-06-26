import DateFormats from "../../constants/datetimeFormats"
import moment from "moment"
import Manager from "../../managers/manager"

class Memory
  constructor: (options = {}) ->
    @id = Manager.GetUid()
    @creationDate = moment().format(DateFormats.dateForDb)
    @captureDate = options?.captureDate ? ''
    @notes =  options?.notes ? ''
    @title =  options?.title ? ''
    @url =  options?.url ? ''

    # ARRAYS
    @shareWith = options?.shareWith ? []

    # OWNER
    @owner =
      name: options?.owner?.name ? ''
      key: options?.owner?.key ? ''

export default Memory