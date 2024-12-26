import DateFormats from "../constants/dateFormats"
import moment from "moment"

export default class ActivitySet
  constructor: (
    @id = ''
    @dateCreated = moment().format(DateFormats.fullDatetime)
    @category = ''
    @recipientPhone = ''
    @creatorPhone = ''
    @title = ''
    @text = ''
  ) ->