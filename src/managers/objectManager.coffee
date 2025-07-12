import ModelNames from "../constants/modelNames"
import CalendarEvent from "../models/new/calendarEvent"
import Expense from "../models/new/expense"
import Memory from "../models/new/memory"
import TransferChangeRequest from "../models/new/transferChangeRequest"
import SwapRequest from "../models/new/swapRequest"
import User from "../models/users/user"
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
import CoParent from "../models/users/coParent"

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
    updated = _.Merge(modelObject, obj)
    afterUpdate  = _.set(updated, updatedPropOrPath, updatedValue)
    updated = _.Merge(afterUpdate, updated)

    for prop of updated
      if obj[prop] is undefined
        delete obj[prop]
      unless keys.includes(prop)
        delete updated[prop]

    return updated

  UpdateAndReturnObject: (obj, path, value) ->
    try
      updated = _.set(obj, path, value)
      return ObjectManager.CleanObject(updated)
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

  CleanObject: (obj) ->
    # If the object is an array, clean each element
    if Array.isArray(obj)
      if !Manager.IsValid(obj)
        return

      return obj
        .map(ObjectManager.CleanObject)
        .filter (item) -> item isnt undefined

    # If the object is an object, clean each property
    else if obj isnt null and obj isnt undefined and typeof obj is 'object'
      return Object.entries(obj).reduce (acc, [key, value]) ->
        cleaned = ObjectManager.CleanObject(value)
        if cleaned isnt undefined
          acc[key] = cleaned
        acc
      , {}

    # Otherwise, return the object
    else
      return obj

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
        Object.keys(new CoParent())
      when ModelNames.chat
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
      when ModelNames.user
        new User()
      when ModelNames.coparent
        new CoParent()
      when ModelNames.chat
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
    returnObject = switch modelName
      when ModelNames.calendarEvent then   new CalendarEvent()
      when ModelNames.expense then  new Expense()
      when ModelNames.memory then  new Memory()
      when ModelNames.transferChangeRequest then  new TransferChangeRequest()
      when ModelNames.swapRequest then  new SwapRequest()
      when ModelNames.user then  new User()
      when ModelNames.coparent then  new CoParent()
      when ModelNames.chat then  new Chat()
      when ModelNames.chatMessage then  new ChatMessage()
      when ModelNames.childUser then  new ChildUser()
      when ModelNames.child then  new Child()
      when ModelNames.parent then  new Parent()
      when ModelNames.doc then  new Doc()


    for prop of returnObject
      if Manager.IsValid(returnObject?[prop])
        if Array.isArray(returnObject?[prop])
          returnObject?[prop] = [] if returnObject?[prop] in [undefined, null]
        else
          returnObject?[prop] = '' if returnObject?[prop] in [undefined, null] or returnObject?[prop]?.toString()?.toLowerCase()?.includes('invalid')
        returnObject?[prop] = returnObject?[prop]

    return returnObject

  Merge: (srcObj,  updatedObj) ->
    result = _.cloneDeep(srcObj)

    for key, newVal of updatedObj
      oldVal = srcObj[key]

      if _.isPlainObject(newVal) and _.isPlainObject(oldVal)
        result[key] = ObjectManager.Merge(oldVal, newVal)

      else if Array.isArray(newVal)
        if newVal.length > 0 and not _.isEqual(oldVal, newVal)
          result[key] = newVal

      else if newVal? and newVal isnt '' and not _.isEqual(oldVal, newVal)
        result[key] = newVal

    return result

  IsEmpty: (obj) ->
      return _.isEmpty(obj)
  }



export default ObjectManager