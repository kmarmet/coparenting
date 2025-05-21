import Manager from '../../managers/manager'
import General from './general'
import Medical from './medical'
import Schooling from './schooling'
import Behavior from './behavior'

class Child
  constructor: (
    @id = Manager.GetUid()
    @general = new General()
    @medical = new Medical()
    @schooling = new Schooling()
    @behavior = new Behavior()
    @checklists = []
    @userKey = ''
  ) ->

export default Child