import Manager from "../managers/manager"

class DocumentHeader
  constructor: (
    @id = Manager.GetUid()
    @headerText = ''
    @ownerKey = ''
  ) ->

export default DocumentHeader