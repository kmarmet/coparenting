import Manager from "../managers/manager"

export default class InputSuggestion
    constructor: (@ownerKey = '', @formName = '', @suggestion = '', @id = Manager.GetUid()) ->