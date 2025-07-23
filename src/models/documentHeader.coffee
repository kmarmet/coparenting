import Manager from "../managers/manager"

class DocumentHeader
  constructor: (options = {}) ->
    @id = Manager.GetUid()
    @headerText = options?.headerText ? ''
    @owner =
        key: options?.owner?.key ? ''
        name: options?.owner?.name ? ''

export default DocumentHeader