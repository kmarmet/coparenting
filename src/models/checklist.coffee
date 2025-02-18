import Manager from "/src/managers/manager"

export default class Checklist
  constructor: (@id = Manager.getUid(), @checklistItems = [], @ownerKey = '', @fromOrTo = "from") ->