import Manager from "../../managers/manager"
import DateFormats from "../../constants/dateFormats"
import moment from "moment"

export default class ChatThread
  constructor: (
    @id = Manager.getUid(), @members = [], @creationTimestamp = moment().format(DateFormats.dateForDb), @hideFrom = [],  @ownerPhone = '', @isMuted = false
  ) ->