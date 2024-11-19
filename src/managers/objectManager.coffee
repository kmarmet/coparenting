import ModelNames from "../models/modelNames"
import CalendarEvent from "../models/calendarEvent"
import Expense from "../models/expense"
import Memory from "../models/memory"
import TransferChangeRequest from "../models/transferChangeRequest"
import SwapRequest from "../models/swapRequest"
import InputSuggestion from "../models/inputSuggestion"
import User from "../models/user"
import Coparent from "../models/coparent"
import ConversationThread from "../models/conversationThread"
import ConversationMessage from "../models/conversationMessage"
import ChildUser from "../models/child/childUser"

ObjectManager = {
  cleanObject: (object, modelName) ->
    returnObject = switch modelName
      when ModelNames.calendarEvent then new CalendarEvent()
      when ModelNames.expense then new Expense()
      when ModelNames.memory then new Memory()
      when ModelNames.transferChangeRequest then new TransferChangeRequest()
      when ModelNames.swapRequest then new SwapRequest()
      when ModelNames.inputSuggestion then new InputSuggestion()
      when ModelNames.user then new User()
      when ModelNames.coparent then new Coparent()
      when ModelNames.conversationThread then new ConversationThread()
      when ModelNames.conversationMessage then new ConversationMessage()
      when ModelNames.childUser then new ChildUser()
    for prop of object
      if Array.isArray(object[prop])
        object[prop] = [] if object[prop] in [undefined, null]
      else
        object[prop] = '' if object[prop] in [undefined, null] or object[prop].toString().toLowerCase().includes('invalid')
      returnObject[prop] = object[prop]
    returnObject
  merge: (objectWithValuesToKeep, objectWithValuesToAdd) ->
    _.assign(objectWithValuesToKeep, objectWithValuesToAdd)
}

export default ObjectManager