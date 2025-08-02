import StringManager from "../../managers/stringManager"
import Manager from "../../managers/manager"

class CustomInfoEntry
  constructor: (options = {}) ->
    @id = Manager.GetUid()
    @label =StringManager.FormatTitle( options?.label, true) ? ''
    @dbFormattedLabel= StringManager.formatDbProp(options?.label) ? ''
    @value = options?.value ? ''
    @dataType = options?.dataType ? ''
    @category = options?.category ? ''

export default CustomInfoEntry