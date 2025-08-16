import DB from "../database/DB"
import _ from "lodash"
import moment from "moment"
import Manager from "./manager"
import ObjectManager from "./objectManager"

DatasetManager = {
    GetDatabaseKeyFromArray: (arr, getSingleObjectPropName, getSingleObjectProp) ->
        if getSingleObjectProp
            formatted = Object.entries(arr).map (x) -> x[1]
            console.log(ObjectManager.RecursivelyFindProperty(formatted, getSingleObjectPropName), getSingleObjectProp);
            return formatted.find (x) -> ObjectManager.RecursivelyFindProperty(formatted, getSingleObjectPropName) == getSingleObjectProp
        
        else
            return Object.entries(arr).flat()
    
    CombineArrays: (arrOne = [], arrTwo = [], isUnique = true, isFlattened = true) ->
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
        
        if Manager.IsValid(arr) and Array.isArray(arr) and arr.length > 0
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
    
    AddRemoveOrSkipFromArray: (arr, newItem, skipIfAlreadyExists = true, removeIfExistsAlready = false) ->
        if not Manager.IsValid(arr)
            return [newItem]
        
        if skipIfAlreadyExists and arr.includes(newItem)
            return arr
        
        if !skipIfAlreadyExists and removeIfExistsAlready and arr.includes(newItem)
            return arr.filter (x) -> x != newItem
        
        if !skipIfAlreadyExists and arr.includes(newItem)
            return arr.filter (x) -> x != newItem
        
        if !skipIfAlreadyExists and !arr.includes(newItem) !removeIfExistsAlready
            return arr.push newItem
    
    ToggleInArray: (arr, key) ->
        if !Manager.IsValid(arr)
            return [key]
        else
            if arr.includes(key)
                return arr.filter (x) -> x isnt key
            else
                return [arr..., key]
    
    GetValidArray: (source, isUnique = true, isFlattened = true, getObjectValuesOnly = false) ->
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
            returnArray = DatasetManager.getUniqueArray(returnArray, true)
        
        if isFlattened
            returnArray = returnArray.flat()
        
        return returnArray.filter (x) -> x
    
    GetLastItemInArray: (arr) ->
        if Manager.IsValid arr
            return arr[-1]
    
    getNestedObject: (table, objectPath) ->
        dataset = await DB.GetTableData(table)
        _.get(dataset[0], objectPath)
    getUniqueArray: (arr, flatten = false) ->
        if flatten
            return _.flattenDeep(_.uniqBy(arr))
        return _.uniqBy(arr, "id")
    mergeMultiple: (arrayOfArrays) ->
        _.flatten(arrayOfArrays[0].concat(arrayOfArrays[1])).filter (x) -> x?
    
    getUniqueArrayByProp: (arr, propOne, propTwo, propThree) ->
        uniqueData = _.values(_.keyBy(arr, (item) -> "#{item[propOne]}-#{item[propTwo]}"))
        if propThree
            uniqueData = _.values(_.keyBy(arr, (item) -> "#{item[propOne]}-#{item[propTwo]}-#{item[propThree]}"))
        uniqueData
    
    GetUniqueByPropValue: (arr, propName) ->
        uniqueUsers = _.uniqBy(arr, propName);
        return uniqueUsers
    
    getUniqueArrayFromMultiple: (arrOne, arrTwo) ->
        _.uniqBy(_.flattenDeep(arrOne, arrTwo))
    
    SortByProperty: (arr, prop, direction) ->
        if Manager.IsValid(arr)
            if direction is "asc"
                return _.sortBy arr, prop
            else
                return _.sortBy(arr, prop).reverse()
        
        return arr
    
    sortDates: (arr, direction = "asc") ->
        _.sortBy arr, (date) -> moment(date).toDate()
    
    ConvertToObject: (arr) ->
        return Object.assign({}, arr)
    
    SortByTime: (arr, direction = "asc") ->
        if direction is "asc"
            return arr.sort (a, b) ->
                timeA = moment(a.startTime, 'h:mma')
                timeB = moment(b.startTime, 'h:mma')
                timeA - timeB
        else
            return arr.sort (a, b) ->
                timeA = moment(a.startTime, 'h:mma')
                timeB = moment(b.startTime, 'h:mma')
                timeB - timeA
    
    SortByDateAndTime: (arr, direction = "asc") ->
        if direction is "asc"
            return arr.sort (a, b) ->
                datetimeA = moment("#{a?.startDate} #{a?.startTime}", 'MM/DD/YYYY h:mma')
                datetimeB = moment("#{b.startDate} #{b.startTime}", 'MM/DD/YYYY h:mma')
                datetimeA - datetimeB
        else
            return arr.sort (a, b) ->
                datetimeA = moment("#{a?.startDate} #{a?.startTime}", 'MM/DD/YYYY h:mma')
                datetimeB = moment("#{b.startDate} #{b.startTime}", 'MM/DD/YYYY h:mma')
                datetimeB - datetimeA
    
    SortByDate: (arr, direction = "asc", customDateProp = "startDate") ->
        if direction is "asc"
            return arr.sort (a, b) -> moment(a[customDateProp], 'MM/DD/YYYY') - moment(b[customDateProp], 'MM/DD/YYYY')
        else
            return arr.sort (a, b) -> moment(b[customDateProp], 'MM/DD/YYYY') - moment(a[customDateProp], 'MM/DD/YYYY')
    
    SortExpenses: (arr, dataType = "string", direction) ->
        if direction == 'asc'
            if dataType == 'int'
                return arr.sort (a, b) -> a.amount - b.amount
            else
                return arr.sort (a, b) -> a.name.localeCompare b.name, undefined, sensitivity: 'base'
        
        else if direction == 'desc'
            if dataType == 'int'
                return arr.sort (a, b) -> b.amount - a.amount
            else
                return arr.sort (a, b) -> b.name.localeCompare a.name, undefined, sensitivity: 'base'
    
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