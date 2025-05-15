import DateFormats from "../constants/datetimeFormats"
import moment from "moment"

Update = null
export default class Update
  constructor: (
    @id = ''
    @creationDate = moment().format(DateFormats.fullDatetime)
    @category = ''
    @recipientKey = ''
    @ownerKey = ''
    @title = ''
    @text = ''


  ) ->