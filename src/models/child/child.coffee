import Manager from 'managers/manager'
import General from './general'
import Medical from './medical'
import Schooling from './schooling'
import Behavior from './behavior'

export default class Child
  constructor: (
    @id = Manager.getUid()
    @general = new General()
    @medical = new Medical()
    @schooling = new Schooling()
    @behavior = new Behavior()
    @sharing = []
  ) ->