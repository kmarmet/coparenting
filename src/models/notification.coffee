import DateFormats from "../constants/datetimeFormats"
import moment from "moment"

export default class Notification
  constructor: (
    @id = ''
    @creationDate = moment().format(DateFormats.fullDatetime)
    @category = ''
    @recipientKey = ''
    @ownerKey = ''
    @title = ''
    @text = ''


  ) ->