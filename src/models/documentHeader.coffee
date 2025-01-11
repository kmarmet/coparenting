import Manager from "managers/manager"

export default class DocumentHeader
  constructor: (
    @id = Manager.getUid()
    @headerText = ''
    @ownerPhone = ''
  ) ->