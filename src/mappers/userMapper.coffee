import DB from "../database/DB"
import Manager from "../managers/manager"

UserMapper = {
  childrenToChildAccounts: (children) ->
    childAccounts = []
    if Manager.isValid(children)
      for child in children
        thisChild = await DB.find(DB.tables.users, ["phone", child?.general?.phone], true)
        if Manager.isValid(thisChild)
          childAccounts.push(thisChild)
    childAccounts
}

export default UserMapper