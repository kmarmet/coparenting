import ModelNames from "../models/modelNames"
import CalendarEvent from "../models/calendarEvent"
import Expense from "../models/expense"
import Memory from "../models/memory"
import TransferChangeRequest from "../models/transferChangeRequest"
import SwapRequest from "../models/swapRequest"
import InputSuggestion from "../models/inputSuggestion"
import User from "../models/user"
import Coparent from "../models/coparent"
import ChatThread from "../models/chat/chatThread"
import ChatMessage from "../models/chat/chatMessage"
import ChildUser from "../models/child/childUser"
import Doc from "../models/doc"
import Child from "../models/child/child"
import _ from "lodash"
import Parent from "../models/parent"

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
      when ModelNames.chatThread then new ChatThread()
      when ModelNames.chatMessage then new ChatMessage()
      when ModelNames.childUser then new ChildUser()
      when ModelNames.child then new Child()
      when ModelNames.parent then new Parent()
      when ModelNames.doc then new Doc()
    for prop of object
      if Array.isArray(object[prop])
        object[prop] = [] if object[prop] in [undefined, null]
      else
        object[prop] = '' if object[prop] in [undefined, null] or object[prop].toString().toLowerCase().includes('invalid')
      returnObject[prop] = object[prop]
    returnObject
  merge: (objectWithValuesToKeep, objectWithValuesToAdd) ->
    _.assign(objectWithValuesToKeep, objectWithValuesToAdd)
  isEmpty: (obj) ->
    _.isEmpty(obj)
}

export default ObjectManager