import DateFormats from "../constants/dateFormats"
import moment from "moment"

export default class Activity
  constructor: (
    @id = ''
    @dateCreated = moment().format(DateFormats.fullDatetime)
    @category = ''
    @recipientKey = ''
    @ownerKey = ''
    @title = ''
    @text = ''
  

  ) ->
  