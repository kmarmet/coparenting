StringManager = {
  getReadablePhoneNumber: (phoneNumber) ->
    formattedPhone = phoneNumber;
    # Remove non-digit characters
    cleaned = ('' + phoneNumber).replace /\D/g, ''

    # Format the number with dashes
    match = cleaned.match /^(\d{3})(\d{3})(\d{4})$/
    if match
      return "#{match[1]}-#{match[2]}-#{match[3]}"

    return formattedPhone

  getFirstNameOnly: (name) ->
    return name if !name
    returnString = name.toString()
    return returnString if !returnString  or returnString.length == 0
    returnString = returnString.split(' ')[0]
    StringManager.uppercaseFirstLetterOfAllWords(returnString)

  isAllUppercase: (input) ->
    return input == input.toUpperCase()

  formatPhone: (input) ->
    input = input.toString()
      .replace(/-/g, '')
      .replace(/\s+/g, '')
      .replace(/\(/g, '')
      .replace(/\)/g, '')
      .replace(/\+/g, '')
      .replace(/\+1/g, '')
    input

  formatFileName: (fileName) ->
    fileName.replaceAll(' ', '-').replaceAll('(', '').replaceAll(')', '')

  spaceBetweenWords: (input) ->
    input.toString().replace(/([a-z])([A-Z])/g, '$1 $2')

  addLongTextClass: (text) ->
     if StringManager.wordCount(text) > 10
       return "long-text"
     else
      return ''

  getFileExtension: (fileName) ->
    fileName.split('.').pop()

  lowercaseShouldBeLowercase: (input) ->
    input.replace('Of', 'of')

  removeFileExtension: (input) ->
    input.replace(/\.[^/.]+$/, '')

  wordCount: (input) ->
    input?.trim()?.split(/\s+/)?.length

  stringHasNumbers: (input) ->
    return /\d/.test(input)

  capitalizeFirstWord: (str) ->
    firstWord = str.split(' ')[0]
    capitalizedFirstWord = firstWord.charAt(0).toUpperCase() + firstWord.slice(1)
    return capitalizedFirstWord + str.slice(firstWord.length)

  toCamelCase: (str) ->
    str =  str.replace /(?:^\w|[A-Z]|\b\w)/g, (word, index) ->
      if index == 0 then word.toLowerCase() else word.toUpperCase()
    str =  str.replace(/\s+/g, '').replaceAll(" ",  "")
    return str

  formatDbProp: (prop) ->
    prop = StringManager.toCamelCase(prop).replaceAll(' ', '')
    prop

  addSpaceBetweenWords: (str) ->
    str = str.replace(/([a-z])([A-Z])/, '$1 $2')
    str

  getFirstWord: (input) ->
    input.toString().replace(/ .*/, '')

  uppercaseFirstLetterOfAllWords: (input) ->
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

  formatEventTitle: (title) ->
    if title and title.length > 0
      title = StringManager.uppercaseFirstLetterOfAllWords(title)
      title = StringManager.formatTitleWords(title)
      return title

  formatTitleWords: (title) ->
    title = title.replaceAll("To", "to").replaceAll("Vs", "vs").replaceAll("With", "with").replaceAll("At", "at").replaceAll("From", "from").replaceAll("The", "the").replaceAll("And", "and").replaceAll("Is", "is").replaceAll("Not", "not")

}

export default StringManager