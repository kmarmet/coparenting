import Manager from "../managers/manager"

class DocumentHeader
  constructor: (options = {}) ->
    @id = Manager.GetUid()
    @headerText = options?.headerText ? ''
    @ownerKey = options?.ownerKey ? ''

export default DocumentHeader