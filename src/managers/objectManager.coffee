import ModelNames from "../constants/modelNames"
import CalendarEvent from "../models/new/calendarEvent"
import Expense from "../models/new/expense"
import Memory from "../models/new/memory"
import TransferChangeRequest from "../models/new/transferChangeRequest"
import SwapRequest from "../models/new/swapRequest"
import User from "../models/users/user"
import Coparent from "../models/users/coParent"
import ChatThread from "../models/chat/chat"
import Chat from "../models/chat/chat"
import ChatMessage from "../models/chat/chatMessage"
import ChildUser from "../models/child/childUser"
import Doc from "../models/new/doc"
import Child from "../models/child/child"
import _ from "lodash"
import Parent from "../models/users/parent"
import Manager from "./manager"
import LogManager from "./logManager"

ObjectManager = {
  SetObjectPropertyByPath: (obj, path, value) ->
    obj[path] = value
    obj = ObjectManager.GetModelValidatedObject(obj, ModelNames.child)
    return obj

  RemoveUndefinedValues: (obj) ->
    for prop in obj
      if obj[prop] is undefined
        delete obj[prop]
    return obj

  UpdateObjectByModel: (obj, updatedPropOrPath, updatedValue, modelObject) ->
    console.log(modelObject);
    for prop of modelObject
      if modelObject[prop] is undefined
        delete modelObject[prop]
      if modelObject[prop] is null
        delete modelObject[prop]

    keys = Object.keys(modelObject)
    updated = _.merge(modelObject, obj)
    afterUpdate  = _.set(updated, updatedPropOrPath, updatedValue)
    updated = _.merge(afterUpdate, updated)

    for prop of updated
      if obj[prop] is undefined
        delete obj[prop]
      unless keys.includes(prop)
        delete updated[prop]

    return updated

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

  GetModel: (modelName) ->
    switch modelName
      when ModelNames.calendarEvent
        new CalendarEvent()
      when ModelNames.expense
        new Expense()
      when ModelNames.memory
        new Memory()
      when ModelNames.transferChangeRequest
        new TransferChangeRequest()
      when ModelNames.swapRequest
        new SwapRequest()
      when ModelNames.inputSuggestion
        new InputSuggestion()
      when ModelNames.user
        new User()
      when ModelNames.coparent
        new Coparent()
      when ModelNames.chatThread
        new ChatThread()
      when ModelNames.chatMessage
        new ChatMessage()
      when ModelNames.childUser
        new ChildUser()
      when ModelNames.child
        new Child()
      when ModelNames.parent
        new Parent()
      when ModelNames.doc
        new Doc()

  GetModelValidatedObject: (obj, modelName) ->
    returnObject = {}
    console.log(true)
    switch modelName
      when ModelNames.calendarEvent then returnObject =  new CalendarEvent()
      when ModelNames.expense then returnObject = new Expense()
      when ModelNames.memory then returnObject = new Memory()
      when ModelNames.transferChangeRequest then returnObject = new TransferChangeRequest()
      when ModelNames.swapRequest then returnObject = new SwapRequest()
      when ModelNames.user then returnObject = new User()
      when ModelNames.coparent then returnObject = new Coparent()
      when ModelNames.chat then returnObject = new Chat()
      when ModelNames.chatMessage then returnObject = new ChatMessage()
      when ModelNames.childUser then returnObject = new ChildUser()
      when ModelNames.child then returnObject = new Child()
      when ModelNames.parent then returnObject = new Parent()
      when ModelNames.doc then returnObject = new Doc()

    console.log(returnObject)

    if Manager.IsValid(returnObject)
      for prop of returnObject
        console.log(prop, returnObject)
        if Manager.IsValid(returnObject?[prop])
          if Array.isArray(returnObject?[prop])
            returnObject?[prop] = [] if returnObject?[prop] in [undefined, null]
          else
            returnObject?[prop] = '' if returnObject?[prop] in [undefined, null] or returnObject?[prop]?.toString()?.toLowerCase()?.includes('invalid')
          returnObject?[prop] = returnObject?[prop]

#    returnObject = ObjectManager.GetValidObject(returnObject)
    returnObject

  merge: (objectWithValuesToKeep, objectWithValuesToAdd) ->
    _.assign(objectWithValuesToKeep, objectWithValuesToAdd)

  isEmpty: (obj) ->
    _.isEmpty(obj)
}

export default ObjectManager