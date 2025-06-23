import DB from "../database/DB"
import _ from "lodash"
import moment from "moment"
import Manager from "./manager"
import ObjectManager from "./objectManager"

DatasetManager = {
  GetDatabaseKeyFromArray: (arr,getSingleObjectPropName, getSingleObjectProp) ->
    if getSingleObjectProp
      formatted = Object.entries(arr).map (x) -> x[1]
      console.log(ObjectManager.RecursivelyFindProperty(formatted,getSingleObjectPropName), getSingleObjectProp);
      return formatted.find (x) -> ObjectManager.RecursivelyFindProperty(formatted,getSingleObjectPropName) == getSingleObjectProp

    else
      return Object.entries(arr).flat()

  CombineArrays : (arrOne = [], arrTwo = [], isUnique = true, isFlattened = true) ->
    returnArray = []

    arrOne = DatasetManager.GetValidArray(arrOne)
    arrTwo = DatasetManager.GetValidArray(arrTwo)

    if Manager.IsValid(arrOne)
      returnArray = [arrOne...]


    if Manager.IsValid(arrTwo)
      returnArray = [returnArray..., arrTwo...]

    if isUnique
      returnArray = DatasetManager.getUniqueArray(returnArray)

    if isFlattened
      returnArray = returnArray.flat()

    return returnArray

  AddToArray: (arr, newItem, removeIfExistsAlready = false) =>
    returnArray = []

    if not Manager.IsValid(arr)
      returnArray = [newItem]

    if Manager.IsValid(arr) and Array.isArray(arr) and  arr.length > 0
      returnArray = [arr..., newItem]

    if Manager.IsValid(arr) and Array.isArray(arr) and arr.length == 0
      returnArray = [newItem]

    if Manager.IsValid(arr) and not Array.isArray(arr)
      returnArray = [newItem]


    if removeIfExistsAlready && arr.includes(newItem)
      returnArray = returnArray.filter (x) -> x != newItem

    if Manager.IsValid(returnArray)
       returnArray = DatasetManager.GetValidArray(returnArray)

    return returnArray

  ToggleInArray: (arr, key) ->
    if !Manager.IsValid(arr)
      return [key]
    else
      if arr.includes(key)
        return arr.filter (x) -> x isnt key
      else
        return [arr..., key]

  GetValidArray: (source,  isUnique = true, isFlattened = true, getObjectValuesOnly = false) ->
    returnArray = []

    if not Manager.IsValid(source)
      return []

    asArray = (key) ->
      id: key
      source[key]

    asArray = Object.keys(source).map(asArray)

    returnArray = asArray

    if not Manager.IsValid asArray
      # NOT Array
      if not Array.isArray(source)
        source = [source]

      # Array
      if Array.isArray(source)
        returnArray = returnArray.filter (x) -> x

    if isUnique
      returnArray = DatasetManager.getUniqueArray(returnArray)

    if isFlattened
      returnArray = returnArray.flat()

    return returnArray.filter (x) -> x

  getNestedObject: (table, objectPath) ->
    dataset = await DB.getTable(table)
    _.get(dataset[0], objectPath)
  getUniqueArray: (arr, flatten = false) ->
    if flatten
      return _.flattenDeep(_.uniqBy(arr))
    return _.uniqBy(arr)
  mergeMultiple: (arrayOfArrays) ->
    _.flatten(arrayOfArrays[0].concat(arrayOfArrays[1])).filter (x) -> x?

  getUniqueArrayByProp: (arr, propOne, propTwo, propThree) ->
    uniqueData = _.values(_.keyBy(arr, (item) -> "#{item[propOne]}-#{item[propTwo]}"))
    if propThree
      uniqueData = _.values(_.keyBy(arr, (item) -> "#{item[propOne]}-#{item[propTwo]}-#{item[propThree]}"))
    uniqueData

  getUniqueByPropValue: (arr, propName) ->
    uniqueUsers = _.uniqBy(arr, propName);
    return uniqueUsers

  getUniqueArrayFromMultiple: (arrOne, arrTwo) ->
    _.uniqBy(_.flattenDeep(arrOne, arrTwo))

  sortByProperty: (arr, prop, direction) ->
#    arr = arr.filter (x) -> x[prop] isnt ""
    if direction is "asc"
      return _.sortBy arr, prop
    else
      return _.sortBy(arr, prop).reverse()
  sortDates: (arr, direction = "asc") ->
    _.sortBy arr, (date) -> moment(date).toDate()
  sort: (arr, direction) ->
    if direction == 'asc'
      return arr.sort()
    return arr.sort()
  transformArrayProp: (arr, prop, newType) ->
    for val in arr
      switch newType
        when "js-date"
          val[prop] = moment(val[prop]).toDate() if val[prop]?.length > 0
        when "int"
          val[prop] = _.toNumber(val[prop]) if val[prop]?.length > 0
        when "string"
          val[prop] = _.toString(val[prop]) if val[prop]?.length > 0
    arr
}

export default DatasetManager