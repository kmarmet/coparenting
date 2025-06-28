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
  ReplaceAllButFirst: (str, target, replacement, firstOccurrence = true) ->
    firstIndex = str.indexOf target
    returnString = ""
    if firstIndex is -1
      return str # Target string not found

    if firstOccurrence
      substring = str.substring(0, firstIndex)
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

  IncrementPatchVersion: (version) ->
    parts = version.split('.').map(Number)
    parts[2] += 1
    return parts.join('.')

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
      return "#{firstName} #{lastNameInitial}"
    else
      return fullName

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
    return returnString if !returnString or returnString.length == 0
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

  formatFileName: (fileName) ->
    fileName.replaceAll(' ', '-').replaceAll('(', '').replaceAll(')', '')

  SpaceBetweenWords: (input) ->
    return input.toString().replace(/([a-z])([A-Z])/g, '$1 $2')

  addLongTextClass: (text) ->
    if StringManager.GetWordCount(text) > 10
      return "long-text"
    else
      return ''

  GetFileExtension: (fileName) ->
    return fileName.split('.').pop()

  lowercaseShouldBeLowercase: (input) ->
    return input.replace('Of', 'of')

  removeFileExtension: (input) ->
    return input.replace(/\.[^/.]+$/, '')

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
    str = str.replace /(?:^\w|[A-Z]|\b\w)/g, (word, index) ->
      if index == 0 then word.toLowerCase() else word.toUpperCase()
    str = str.replace(/\s+/g, '').replaceAll(" ", "")
    return str

  removeSpecialChars: (str) ->
    return str.replaceAll("~", "")
      .replaceAll("#", "")
      .replaceAll("^", "")
      .replaceAll("`", "")
      .replaceAll("`", "")


  formatDbProp: (prop) ->
    prop = StringManager.toCamelCase(prop).replaceAll(' ', '')
    return StringManager.removeSpecialChars(prop)

  addSpaceBetweenWords: (str) ->
    str = str.replace(/([a-z])([A-Z])/, '$1 $2')
    return str

  GetFirstWord: (input) ->
    return input.toString().replace(/ .*/, '')

  UppercaseFirstLetterOfAllWords: (input) ->
    if !Manager.IsValid(input, true)
      return input
    words = input?.toString()
    if words and words != undefined
      words = words?.split(' ')
      words = words?.filter (x) -> x.length > 0
      words = words?.map (word) -> word[0].toUpperCase() + word.substr(1)
      words = words?.join(' ') if words?.length > 0
    return words

  FormatEventTitle: (title) ->
    if title and title.length > 0
      title = StringManager.UppercaseFirstLetterOfAllWords(title)
      title = StringManager.FormatTitle(title)
      return title

  FixCamelCaseWord: (word) ->
    return word
      .replace /([A-Z])/g, ' $1'
      .trim()
      .split(' ')
      .map (w) -> w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
      .join ''

  FixCamelCaseSentence: (str) ->
    return str
      .split(' ')
      .map (word) -> StringManager.FixCamelCaseWord(word)
      .join ' '

  RemoveLeadingAndTrailingSpaces: (str) ->
# Remove first character if it's a space
    if str[0] is ' '
      str = str.slice 1

    # Remove trailing whitespace
    return str.replace /\s+$/, ''

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
    title = StringManager.RemoveLeadingAndTrailingSpaces(title)
    title = StringManager.FixCamelCaseSentence(title)


    return title

}

export default StringManager