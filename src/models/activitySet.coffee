import DateFormats from "../constants/dateFormats"
import moment from "moment"
import ActivityPriority from "../models/activityPriority"

export default class ActivitySet
  constructor: (
    @id = ''
    @dateCreated = moment().format(DateFormats.fullDatetime)
    @category = ''
    @recipientPhone = ''
    @creatorPhone = ''
    @priority = ActivityPriority.Normal
    @title = ''
    @text = ''
  ) ->