import Manager from "../managers/manager"

export default class Doc
  constructor: (@name = '', @type = '', @shareWith = [], @url = '', @id = Manager.getUid(), @ownerKey) ->