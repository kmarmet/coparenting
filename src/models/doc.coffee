import Manager from "../managers/manager"

class Doc
  constructor: (@name = '', @type = '', @shareWith = [], @url = '', @id = Manager.GetUid(), @ownerKey = '', @docText = '') ->

export default Doc