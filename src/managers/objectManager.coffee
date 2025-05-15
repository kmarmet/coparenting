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
import Manager from "./manager"
import LogManager from "./logManager"

ObjectManager = {
  SetObjectPropertyByPath: (obj, path, value) ->
    obj[path] = value
    obj = ObjectManager.GetModelValidatedObject(obj, ModelNames.child)
    return obj

  UpdateAndReturnObject: (obj, path, value) ->
    try
      updated = _.set(obj, path, value)
      return ObjectManager.GetValidObject(updated)
    catch e
      LogManager.Log(e.message, LogManager.LogTypes.error, e.stack)

  RecursivelyFindProperty:  (obj, key) ->
    if Manager.IsValid(obj) and typeof obj is 'object'
      if obj.hasOwnProperty(key)
        return obj[key]
      for prop of obj
        result = ObjectManager.RecursivelyFindProperty obj[prop], key
        if result != undefined
          return result
    return undefined

  GetValidObject: (obj) -> Object.fromEntries((Object.entries(obj).filter ([_, value]) -> Manager.IsValid(value)))

  RemoveUnusedProperties: (obj, modelKeys) ->
    console.log(obj, modelKeys);
    for key in obj
      console.log(modelKeys, key);
      if not modelKeys.includes (key)
        delete obj[key]
    return obj

  GetModelKeys: (modelName) ->
    switch modelName
      when ModelNames.calendarEvent
        Object.keys(new CalendarEvent())
      when ModelNames.expense
        Object.keys(new Expense())
      when ModelNames.memory
        Object.keys(new Memory())
      when ModelNames.transferChangeRequest
        Object.keys(new TransferChangeRequest())
      when ModelNames.swapRequest
        Object.keys(new SwapRequest())
      when ModelNames.inputSuggestion
        Object.keys(new InputSuggestion())
      when ModelNames.user
        Object.keys(new User())
      when ModelNames.coparent
        Object.keys(new Coparent())
      when ModelNames.chatThread
        Object.keys(new ChatThread())
      when ModelNames.chatMessage
        Object.keys(new ChatMessage())
      when ModelNames.childUser
        Object.keys(new ChildUser())
      when ModelNames.child
        Object.keys(new Child())
      when ModelNames.parent
        Object.keys(new Parent())
      when ModelNames.doc
        Object.keys(new Doc())

  GetModelValidatedObject: (object, modelName) ->
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

#    returnObject = ObjectManager.GetValidObject(returnObject)
    returnObject

  merge: (objectWithValuesToKeep, objectWithValuesToAdd) ->
    _.assign(objectWithValuesToKeep, objectWithValuesToAdd)

  isEmpty: (obj) ->
    _.isEmpty(obj)
}

export default ObjectManager