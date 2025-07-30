import Manager from "../managers/manager"
import StringManager from "../managers/stringManager"

AccountsMapper =
  GetShareWithNames: (currentUser,users, shareWith) ->
    filtered = shareWith?.filter (x) -> x != currentUser?.key && currentUser?.sharedDataUserKeys.includes x

    if not Manager.IsValid(filtered)
      return false
    mappedShareWithNames = Manager.MapKeysToUsers(filtered, users)
    mappedShareWithNames = mappedShareWithNames.filter (x) -> x?.name != StringManager.GetFirstNameOnly(currentUser?.name)

    return mappedShareWithNames

export default AccountsMapper