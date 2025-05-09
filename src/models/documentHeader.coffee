import Manager from "../managers/manager"

export default class DocumentHeader
  constructor: (
    @id = Manager.GetUid()
    @headerText = ''
    @ownerKey = ''
  ) ->