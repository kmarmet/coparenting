import Swal from "sweetalert2"

# Strings
export toCamelCase = (str) ->
  return str.replace /(?:^\w|[A-Z]|\b\w)/g, (word, index) ->
    if index == 0 then word.toLowerCase() else word.toUpperCase()
  str =  str.replace(/\s+/g, '').replaceAll(" ",  "")
  return str

export capitalizeFirstWord = (str) ->
  firstWord = str.split(' ')[0];
  capitalizedFirstWord = firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
  return capitalizedFirstWord + str.slice(firstWord.length);

export hasClass = (element, className) ->
  if element.classList.contains(className)
    true
  else
    false

export formatTitleWords = (str) ->
  str = str.replaceAll("To", "to").replaceAll("Vs", "vs").replaceAll("With", "with").replaceAll("At", "at").replaceAll("From", "from").replaceAll("The", "the").replaceAll("And", "and").replaceAll("Is", "is").replaceAll("Not", "not")

export getFirstWord = (input) ->
  input.toString().replace(/ .*/, '')

export formatFileName = (input)->
  input.replace('.docx', '').replace('.doc', '').replace('.pdf', '')

export getFileExtension = (fileName) ->
  fileName.split('.').pop()

export isAllUppercase = (input)->
  input == input.toUpperCase()

export formatTocHeader = (header) ->
  header.replace(/[0-9]/g, '').replace('.', '').replace(/\s+/g, '')

export removeSpacesAndLowerCase = (input)->
  input.replace(/\s+/g, '').toLowerCase()

export stringHasNumbers = (input) ->
  /\d/.test(input)

export contains = (itemToCheck, searchValue) ->
  if !itemToCheck then return false
  itemToCheck.indexOf(searchValue) > -1

export wordCount = (input) ->
  input.trim().split(/\s+/).length

export getPositionOfWordInText = (word, text) ->
  index = text.indexOf(word)
  textLength = text.length
  startOfTextToWord = text.substring(0, index)
  indexAfterStartOfText = startOfTextToWord.length
  endIndex = indexAfterStartOfText + textLength
  returnObj =
    start: indexAfterStartOfText
    end: endIndex
  returnObj

export uppercaseFirstLetterOfAllWords = (input) ->
  words = input?.toString()
  if words and words != undefined
    if words?.indexOf('-') > -1
      words = input.replace(/-/g, ' ').split(' ')
    else
      words = words?.split(' ')
    words = words?.filter (x) -> x.length > 0
    words = words?.map (word) -> word[0].toUpperCase() + word.substr(1)
    words = words?.join(' ') if words?.length > 0
  words

export spaceBetweenWords = (input) ->
  input.toString().replace(/([a-z])([A-Z])/g, '$1 $2')

export formatNameFirstNameOnly = (input)->
  return input if !input
  returnString = input.toString()
  return returnString if !returnString  or returnString.length == 0
  returnString = returnString.split(' ')[0]
  uppercaseFirstLetterOfAllWords(returnString)

export camelCaseToString = (word) ->
  result = word.replace(/([A-Z])/g, ' $1')
  result.charAt(0).toUpperCase() + result.slice(1)

export formatPhone =  (input)->
  input = input.toString()
    .replace(/-/g, '')
    .replace(/\s+/g, '')
    .replace(/\(/g, '')
    .replace(/\)/g, '')
    .replace(/\+/g, '')
    .replace(/\+1/g, '')
  input

export formatDbProp = (prop) ->
  prop = toCamelCase(prop).replaceAll(" ", "")
  prop

export lowercaseShouldBeLowercase = (input) ->
  input.replace("Of", "of")

export removeFileExtension = (input) ->
  input.replace(/\.[^/.]+$/, '')

# Arrays
export uniqueArray = (array) ->
  Array.from(new Set(array))

export displayAlert = (type, title, text = '', onConfirm) ->
  switch (true)
    when type is "input"
      Swal.fire
        title: title
        text: text
        icon: ''
        input: 'text'
        showCancelButton: true
        confirmButtonText: "Confirm"
        showClass:
          popup: """
            animate__animated
            animate__fadeInUp
            animate__faster
          """
        hideClass:
          popup: """
            animate__animated
            animate__fadeOutDown
            animate__faster
          """
      .then (result) ->
        if result.isConfirmed
          if onConfirm then onConfirm(result)
    when type is "error"
      Swal.fire
        title: title
        text: text
        icon: 'error'
        showClass:
          popup: """
            animate__animated
            animate__fadeInUp
            animate__faster
          """
        hideClass:
          popup: """
            animate__animated
            animate__fadeOutDown
            animate__faster
          """