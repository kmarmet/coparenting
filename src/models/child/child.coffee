import Manager from '@manager'
import General from './general'
import Medical from './medical'
import Schooling from './schooling'
import Behavior from './behavior'

export default class Child
  constructor: (id, general, profilePic, medical, schooling, behavior) ->
    @id = Manager.getUid()
    @general = new General()
    @medical = new Medical()
    @schooling = new Schooling()
    @behavior = new Behavior()
    @profilePic = ''

