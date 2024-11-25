import DB from "../database/DB"
import Manager from "../managers/manager"

UserMapper = {
  childrenToChildAccounts: (children) ->
    childAccounts = []
    users = await DB.getTable(DB.tables.users)
    for child in children
      thisChild = await DB.find(users, ["phone", child?.phone], true)
      if Manager.isValid(thisChild)
        childAccounts.push(thisChild)
    childAccounts
}

export default UserMapper