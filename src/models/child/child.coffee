import Manager from '../../managers/manager'
import General from './general'
import Medical from './medical'
import Schooling from './schooling'
import Behavior from './behavior'
import DatetimeFormats from "../../constants/datetimeFormats"

class Child
  constructor: (options = {}) ->
    @id = Manager.GetUid()
    @creationDate = moment().format(DatetimeFormats.dateForDb)
    @general = new General()
    @medical = new Medical()
    @schooling = new Schooling()
    @behavior = new Behavior()
    @checklists = []
    @userKey =  options?.userKey ? ''
    @profilePic =  options?.profilePic ? ''

export default Child