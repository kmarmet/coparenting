import Manager from "/src/managers/manager"

class Checklist
  constructor: (@id = Manager.GetUid(), @items = [],  @fromOrTo = "from") ->

export default  Checklist