import lzstring from "lz-string"
import Manager from "./manager"
#if (firstOccurrence) {
#  return str.substring(0, firstIndex + target.length) +
#    str.substring(firstIndex + target.length).replaceAll(target, replacement);
#}
#
#return str.substring(0, firstIndex).replaceAll(target, replacement) +
#  str.substring(firstIndex);
StringManager = {
  ReplaceAllButFirst:  (str, target, replacement, firstOccurrence = true) ->
    firstIndex = str.indexOf target
    returnString = ""
    if firstIndex is -1
      return str # Target string not found

    if firstOccurrence
      substring =  str.substring(0, firstIndex)
      returnString = substring.replace(target, replacement) + str.substring(firstIndex)
      return  returnString

    return str.substring(0, firstIndex).replace(target, replacement) +
      str.substring(firstIndex)

  ContainsOnlyNumbers: (str) ->
    return /^\d+$/.test(str)

  IsNotAllSameNumber: (str) ->
    unless /^\d+$/.test(str)
      return true
    not (new RegExp("^#{str[0]}+$").test(str))

  FormatAsWholeNumber: (number) ->
    asString = number.toString()
    if asString.indexOf('.') > -1
      dotIndex = asString.indexOf('.')
      return parseInt(asString.substring(0, dotIndex))

  GetFirstNameAndLastInitial: (fullName) ->
    if Manager.IsValid(fullName, true)
      names = fullName.split(" ")
      firstName = names[0]
      lastNameInitial = if names?.length > 1 then names?[names?.length - 1]?[0] else ""
      "#{firstName} #{lastNameInitial}"
    else
      fullName

  getReadablePhoneNumber: (phoneNumber) ->
    formattedPhone = phoneNumber;
    # Remove non-digit characters
    cleaned = ('' + phoneNumber).replace /\D/g, ''

    # Format the number with dashes
    match = cleaned.match /^(\d{3})(\d{3})(\d{4})$/
    if match
      return "#{match[1]}-#{match[2]}-#{match[3]}"

    return formattedPhone

  GetFirstNameOnly: (name) ->
    return name if !name
    returnString = name.toString()
    return returnString if !returnString  or returnString.length == 0
    returnString = returnString.split(' ')[0]
    StringManager.UppercaseFirstLetterOfAllWords(returnString)

  RemoveAllLetters: (input) ->
    return input.replace(/[a-zA-Z]/g, '')

  isAllUppercase: (input) ->
    return input == input.toUpperCase()

  FormatPhone: (input) ->
    if !Manager.IsValid(input) or input?.length == 0
      return input

    input = input?.toString()
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
      session_id: Manager.GetUid()
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
     if StringManager.GetWordCount(text) > 10
       return "long-text"
     else
      return ''

  GetFileExtension: (fileName) ->
    fileName.split('.').pop()

  lowercaseShouldBeLowercase: (input) ->
    input.replace('Of', 'of')

  removeFileExtension: (input) ->
    input.replace(/\.[^/.]+$/, '')

  GetWordCount: (input) ->
    if Manager.IsValid input, true
      return input?.trim()?.split(/\s+/)?.length
    else
      return 0

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

  UppercaseFirstLetterOfAllWords: (input) ->
    if !Manager.IsValid(input, true)
      return input
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
      title = StringManager.UppercaseFirstLetterOfAllWords(title)
      title = StringManager.FormatTitle(title)
      return title

  FormatTitle: (title, uppercase = true) ->
    if !title || title?.length == 0
      return title

    if !Manager.IsValid(title, true)
      return title

    if uppercase
      title = StringManager.UppercaseFirstLetterOfAllWords(title)

    title = title.toString()
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
      .replaceAll(" Has ", " has ")
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