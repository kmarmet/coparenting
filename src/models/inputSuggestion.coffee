import Manager from "../managers/manager"

export default class InputSuggestion
    constructor: (@ownerPhone = '', @formName = '', @suggestion = '', @id = Manager.getUid()) ->