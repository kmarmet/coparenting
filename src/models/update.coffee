import DateFormats from "../constants/datetimeFormats"
import moment from "moment"

Update = null
class Update
  constructor: (
    @id = ''
    @timestamp = moment().format(DateFormats.fullDatetime)
    @category = ''
    @recipientKey = ''
    @ownerKey = ''
    @title = ''
    @text = ''


  ) ->

export default Update