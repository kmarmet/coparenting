import Manager from "../../managers/manager"
import StringManager from "../../managers/stringManager"

class SharedCustomInfoEntry
    constructor: (options = {}) ->
        @id = Manager.GetUid()
        @userFriendlyLabel = options?.userFriendlyLabel ? ''
        @dbFormattedLabel= StringManager.formatDbProp(options?.userFriendlyLabel) ? ''
        @value = options?.value ? ''
        @dataType = options?.dataType ? ''
        @sharedByName = options?.sharedByName ? ''
        @sharedByKey = options?.sharedByKey ? ''
        @parentCategory = options?.parentCategory ? ''
        @category = options?.category ? ''
        
export default SharedCustomInfoEntry