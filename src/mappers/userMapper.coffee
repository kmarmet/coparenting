import DB from "../database/DB"
import Manager from "../managers/manager"
import DB_UserScoped from "../database/DB_UserScoped"
UserMapper = {
  childrenToChildAccounts: (authUserEmail) ->
    currentUser = await DB_UserScoped.getCurrentUser(authUserEmail)
    childAccounts = []
    if Manager.isValid(children)
      for child in children
        thisChild = await DB.find(DB.tables.users, ["phone", child?.general?.phone], true)
        if Manager.isValid(thisChild)
          childAccounts.push(thisChild)
    childAccounts

  childAccountToUserRecord: (authUserEmail, childAccountKey) ->
    currentUser = await DB_UserScoped.getCurrentUser(authUserEmail)
    
}

export default UserMapper