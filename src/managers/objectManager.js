// Generated by CoffeeScript 2.7.0
var ObjectManager,
      indexOf = [].indexOf

import _ from "lodash"
import ModelNames from "../constants/modelNames"

import ChatThread from "../models/chat/chat"
import Chat from "../models/chat/chat"

import ChatMessage from "../models/chat/chatMessage"

import Child from "../models/child/child"

import ChildUser from "../models/child/childUser"

import CalendarEvent from "../models/new/calendarEvent"

import Doc from "../models/new/doc"

import Expense from "../models/new/expense"

import HandoffChangeRequest from "../models/new/handoffChangeRequest"

import Memory from "../models/new/memory"

import CoParent from "../models/users/coParent"

import Parent from "../models/users/parent"

import User from "../models/users/user"

import LogManager from "./logManager"

import Manager from "./manager"

import StringManager from "./stringManager"

ObjectManager = {
      SetObjectPropertyByPath: function (obj, path, value) {
            obj[path] = value
            obj = ObjectManager.GetModelValidatedObject(obj, ModelNames.child)
            return obj
      },
      RemoveUndefinedValues: function (obj) {
            var i, len, prop
            for (i = 0, len = obj.length; i < len; i++) {
                  prop = obj[i]
                  if (obj[prop] === void 0) {
                        delete obj[prop]
                  }
            }
            return obj
      },
      UpdateObjectByModel: function (obj, updatedPropOrPath, updatedValue, modelObject) {
            var afterUpdate, keys, prop, updated
            console.log(modelObject)
            for (prop in modelObject) {
                  if (modelObject[prop] === void 0) {
                        delete modelObject[prop]
                  }
                  if (modelObject[prop] === null) {
                        delete modelObject[prop]
                  }
            }
            keys = Object.keys(modelObject)
            updated = _.Merge(modelObject, obj)
            afterUpdate = _.set(updated, updatedPropOrPath, updatedValue)
            updated = _.Merge(afterUpdate, updated)
            for (prop in updated) {
                  if (obj[prop] === void 0) {
                        delete obj[prop]
                  }
                  if (!keys.includes(prop)) {
                        delete updated[prop]
                  }
            }
            return updated
      },
      UpdateAndReturnObject: function (obj, path, value) {
            var e, updated
            try {
                  updated = _.set(obj, path, value)
                  return ObjectManager.CleanObject(updated)
            } catch (error) {
                  e = error
                  return LogManager.Log(e.message, LogManager.LogTypes.error, e.stack)
            }
      },
      RecursivelyFindProperty: function (obj, key) {
            var prop, result
            if (Manager.IsValid(obj) && typeof obj === "object") {
                  if (obj.hasOwnProperty(key)) {
                        return obj[key]
                  }
                  for (prop in obj) {
                        result = ObjectManager.RecursivelyFindProperty(obj[prop], key)
                        if (result !== void 0) {
                              return result
                        }
                  }
            }
            return void 0
      },
      RecursivelyFlattenObjects: function (obj, prefix, result = {}) {
            var key, newKey, value
            for (key in obj) {
                  value = obj[key]
                  newKey = ""
                  if (value != null && typeof value === "object" && !Array.isArray(value)) {
                        if (indexOf.call(value, "name") >= 0 && indexOf.call(value, "url") >= 0 && Object.keys(value).length === 2) {
                              // Case: { name, url }
                              result[value.name] = value.url
                        } else {
                              // Continue recursion
                              ObjectManager.RecursivelyFlattenObjects(value, newKey, result)
                        }
                  } else {
                        // Primitive value (e.g., string)
                        result[newKey] = value
                  }
                  return result
            }
      },
      CleanObject: function (obj) {
            // If the object is an array, clean each element
            if (Array.isArray(obj)) {
                  if (!Manager.IsValid(obj)) {
                        return
                  }
                  return obj.map(ObjectManager.CleanObject).filter(function (item) {
                        return item !== void 0
                  })
                  // If the object is an object, clean each property
            } else if (obj !== null && obj !== void 0 && typeof obj === "object") {
                  return Object.entries(obj).reduce(function (acc, [key, value]) {
                        var cleaned
                        cleaned = ObjectManager.CleanObject(value)
                        if (cleaned !== void 0) {
                              acc[key] = cleaned
                        }
                        return acc
                  }, {})
            }
            if (typeof obj === "string") {
                  return StringManager.SanitizeString(obj)
            } else {
                  // Otherwise, return the object
                  return obj
            }
      },
      RemoveUnusedProperties: function (obj, modelKeys) {
            var i, key, len
            console.log(obj, modelKeys)
            for (i = 0, len = obj.length; i < len; i++) {
                  key = obj[i]
                  console.log(modelKeys, key)
                  if (!modelKeys.includes(key)) {
                        delete obj[key]
                  }
            }
            return obj
      },
      GetModelKeys: function (modelName) {
            switch (modelName) {
                  case ModelNames.calendarEvent:
                        return Object.keys(new CalendarEvent())
                  case ModelNames.expense:
                        return Object.keys(new Expense())
                  case ModelNames.memory:
                        return Object.keys(new Memory())
                  case ModelNames.transferChangeRequest:
                        return Object.keys(new HandoffChangeRequest())
                  case ModelNames.visitationChangeRequest:
                        return Object.keys(new VisitationChangeRequest())
                  case ModelNames.user:
                        return Object.keys(new User())
                  case ModelNames.coparent:
                        return Object.keys(new CoParent())
                  case ModelNames.chat:
                        return Object.keys(new ChatThread())
                  case ModelNames.chatMessage:
                        return Object.keys(new ChatMessage())
                  case ModelNames.childUser:
                        return Object.keys(new ChildUser())
                  case ModelNames.child:
                        return Object.keys(new Child())
                  case ModelNames.parent:
                        return Object.keys(new Parent())
                  case ModelNames.doc:
                        return Object.keys(new Doc())
            }
      },
      GetModel: function (modelName) {
            switch (modelName) {
                  case ModelNames.calendarEvent:
                        return new CalendarEvent()
                  case ModelNames.expense:
                        return new Expense()
                  case ModelNames.memory:
                        return new Memory()
                  case ModelNames.transferChangeRequest:
                        return new HandoffChangeRequest()
                  case ModelNames.visitationChangeRequest:
                        return new VisitationChangeRequest()
                  case ModelNames.user:
                        return new User()
                  case ModelNames.coparent:
                        return new CoParent()
                  case ModelNames.chat:
                        return new ChatThread()
                  case ModelNames.chatMessage:
                        return new ChatMessage()
                  case ModelNames.childUser:
                        return new ChildUser()
                  case ModelNames.child:
                        return new Child()
                  case ModelNames.parent:
                        return new Parent()
                  case ModelNames.doc:
                        return new Doc()
            }
      },
      GetModelValidatedObject: function (obj, modelName) {
            var prop, ref, ref1, ref2, ref3, ref4, returnObject
            returnObject = (function () {
                  switch (modelName) {
                        case ModelNames.calendarEvent:
                              return new CalendarEvent()
                        case ModelNames.expense:
                              return new Expense()
                        case ModelNames.memory:
                              return new Memory()
                        case ModelNames.transferChangeRequest:
                              return new HandoffChangeRequest()
                        case ModelNames.visitationChangeRequest:
                              return new VisitationChangeRequest()
                        case ModelNames.user:
                              return new User()
                        case ModelNames.coparent:
                              return new CoParent()
                        case ModelNames.chat:
                              return new Chat()
                        case ModelNames.chatMessage:
                              return new ChatMessage()
                        case ModelNames.childUser:
                              return new ChildUser()
                        case ModelNames.child:
                              return new Child()
                        case ModelNames.parent:
                              return new Parent()
                        case ModelNames.doc:
                              return new Doc()
                  }
            })()
            for (prop in returnObject) {
                  if (Manager.IsValid(returnObject != null ? returnObject[prop] : void 0)) {
                        if (Array.isArray(returnObject != null ? returnObject[prop] : void 0)) {
                              if ((ref = returnObject != null ? returnObject[prop] : void 0) === void 0 || ref === null) {
                                    if (returnObject != null) {
                                          returnObject[prop] = []
                                    }
                              }
                        } else {
                              if (
                                    (ref1 = returnObject != null ? returnObject[prop] : void 0) === void 0 ||
                                    ref1 === null ||
                                    (returnObject != null
                                          ? (ref2 = returnObject[prop]) != null
                                                ? (ref3 = ref2.toString()) != null
                                                      ? (ref4 = ref3.toLowerCase()) != null
                                                            ? ref4.includes("invalid")
                                                            : void 0
                                                      : void 0
                                                : void 0
                                          : void 0)
                              ) {
                                    if (returnObject != null) {
                                          returnObject[prop] = ""
                                    }
                              }
                        }
                        if (returnObject != null) {
                              returnObject[prop] = returnObject != null ? returnObject[prop] : void 0
                        }
                  }
            }
            return returnObject
      },
      Merge: function (srcObj, updatedObj) {
            var key, newVal, oldVal, result
            result = _.cloneDeep(srcObj)
            for (key in updatedObj) {
                  newVal = updatedObj[key]
                  oldVal = srcObj[key]
                  if (_.isPlainObject(newVal) && _.isPlainObject(oldVal)) {
                        result[key] = ObjectManager.Merge(oldVal, newVal)
                  } else if (Array.isArray(newVal)) {
                        if (newVal.length > 0 && !_.isEqual(oldVal, newVal)) {
                              result[key] = newVal
                        }
                  } else if (newVal != null && newVal !== "" && !_.isEqual(oldVal, newVal)) {
                        result[key] = newVal
                  }
            }
            return result
      },
      IsEmpty: function (obj) {
            return _.isEmpty(obj)
      },
}

export default ObjectManager

//# sourceMappingURL=objectManager.js.map