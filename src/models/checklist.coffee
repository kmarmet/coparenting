import Manager from "/src/managers/manager"

export default class Checklist
  constructor: (@id = Manager.GetUid(), @items = [],  @fromOrTo = "from") ->