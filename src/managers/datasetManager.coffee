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


    return arr
  getValidArray: (arr) ->
    if Manager.isValid(arr)
      arr = Manager.convertToArray(arr)
      arr.filter (x) -> x

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
    uniqueUsers

  getUniqueArrayFromMultiple: (arrOne, arrTwo) ->
    _.uniqBy(_.flattenDeep(arrOne, arrTwo))

  sortByProperty: (arr, prop, direction) ->
#    arr = arr.filter (x) -> x[prop] isnt ""
    if direction is "asc"
      _.sortBy arr, prop
    else
      _.sortBy(arr, prop).reverse()
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