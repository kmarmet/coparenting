import lzstring from "lz-string"
import Manager from "./manager"

StringManager = {
  FormatAsWholeNumber: (number) ->
    asString = number.toString()
    if asString.indexOf('.') > -1
      dotIndex = asString.indexOf('.')
      return parseInt(asString.substring(0, dotIndex))

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

  RemoveAllLetters: (input) ->
    return input.replace(/[a-zA-Z]/g, '')

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

  formatPhoneWithDashes: (phone) ->
    cleaned = ('' + phone).replace /\D/g, ''
    match = cleaned.match /^(\d{3})(\d{3})(\d{4})$/
    if match
      return "#{match[1]}-#{match[2]}-#{match[3]}"
    return phone

  compressString: (string) ->
    # Import the lz-string library dependency
    compressed = lzstring.compress(string)

    console.log 'Original:', string.length, 'bytes'
    console.log 'Compressed:', compressed.length, 'bytes'
    return compressed

  deCompressString: (string) ->
# Import the lz-string library dependency
    console.log(string)
    decompressed = lzstring.decompress(string)
    console.log(decompressed)
    return decompressed

  typoCorrection: (text) ->
    fixedText = ''
    myHeaders = new Headers()
    myHeaders.append "Content-Type", "application/json"

    raw = JSON.stringify
      key: process.env.REACT_APP_SAPLER_TONE_API_KEY
      text: text
      session_id: Manager.getUid()
      auto_apply: true
      lang: 'en'
      variety: 'us-variety'

    requestOptions =
      method: "POST"
      headers: myHeaders
      body: raw
      redirect: "follow"

    try
      response = await fetch "https://api.sapling.ai/api/v1/spellcheck", requestOptions
      result = await response.json()
      fixedText = result.applied_text
      console.log result
    catch error
      console.error error

    return fixedText

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
    firstWord = str.split(" ")[0].toUpperCase()
    capitalizedFirstWord = firstWord.charAt(0).toUpperCase() + firstWord.slice(1)
    return firstWord + str.slice(str[1], str.length)

  toCamelCase: (str) ->
    str =  str.replace /(?:^\w|[A-Z]|\b\w)/g, (word, index) ->
      if index == 0 then word.toLowerCase() else word.toUpperCase()
    str =  str.replace(/\s+/g, '').replaceAll(" ",  "")
    return str

  removeSpecialChars: (str) ->
    return str.replaceAll("~", "")
      .replaceAll("#", "")
      .replaceAll("^", "")
      .replaceAll("`", "")
      .replaceAll("`", "")


  formatDbProp: (prop) ->
    prop = StringManager.toCamelCase(prop).replaceAll(' ', '')
    StringManager.removeSpecialChars(prop)

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
      title = StringManager.formatTitle(title)
      return title

  formatTitle: (title, uppercase = true) ->
    if uppercase
      title = StringManager.uppercaseFirstLetterOfAllWords(title).trim()

    title = title
      .replaceAll(" To ", " to ")
      .replaceAll(" A ", " a ")
      .replaceAll(" An ", " an ")
      .replaceAll(" Or ", " or ")
      .replaceAll(" Vs ", " vs ")
      .replaceAll(" With ", " with ")
      .replaceAll(" At ", " at ")
      .replaceAll(" About ", " about ")
      .replaceAll(" From ", " from ")
      .replaceAll(" The ", " the ")
      .replaceAll(" For ", " for ")
      .replaceAll(" Thru ", " thru ")
      .replaceAll(" And ", " and ")
      .replaceAll(" Is ", " is ")
      .replaceAll(" Not ", " not ")
      .replaceAll(" Off ", " off ")
      .replaceAll(" But ", " but ")
      .replaceAll(" By ", " by ")
      .replaceAll(" In ", " in ")
      .replaceAll(" Of ", " of ")
      .replaceAll(" On ", " on ")
      .replaceAll(" Per ", " per ")
      .replaceAll(" Up ", " up ")
      .replaceAll(" Via ", " via ")

    title = StringManager.removeSpecialChars(title)

    return title

}

export default StringManager