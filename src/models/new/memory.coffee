import DateFormats from "../../constants/datetimeFormats"
import moment from "moment"
import Manager from "../../managers/manager"

class Memory
  constructor: (options = {}) ->
    @id = Manager.GetUid()
    @creationDate = moment().format(DateFormats.dateForDb)
    @name = options?.name ? ''
    @captureDate = options?.captureDate ? ''
    @notes =  options?.notes ? ''
    @shareWith = options?.shareWith ? []
    @title =  options?.title ? ''
    @url =  options?.url ? ''
    @ownerKey =  options?.ownerKey ? ''

export default Memory