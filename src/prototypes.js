//#region Strings
String.prototype.toCamelCase = function () {
  this.toString()
  return this.replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
    return index == 0 ? word.toLowerCase() : word.toUpperCase()
  }).replace(/\s+/g, '')
}

String.prototype.getFirstWord = function () {
  return this.toString().replace(/ .*/, '')
}

String.prototype.formatFileName = function () {
  return this.toString().replace('.docx', '').replace('.doc', '').replace('.pdf', '')
}

String.prototype.isAllUppercase = function () {
  return this.toString() === this.toUpperCase()
}

String.prototype.formatTocHeader = function () {
  return this.toString().replace(/[0-9]/g, '').replace('.', '').replaceAll(' ', '')
}

String.prototype.removeSpacesAndLowerCase = function () {
  this.toString()
  return this.replaceAll(' ', '').toLowerCase()
}

String.prototype.stringHasNumbers = function () {
  var regex = /\d/g
  return regex.test(this.toString())
}

String.prototype.contains = function (itemToCheck) {
  return this.indexOf(itemToCheck) > -1
}

String.prototype.wordCount = function () {
  return this.toString().trim().split(/\s+/).length
}

String.prototype.uppercaseFirstLetterOfAllWords = function () {
  this.toString()
  let words = this
  if (words && words !== undefined) {
    if (words.indexOf('-') > -1) {
      words = this.replaceAll('-', ' ').split(' ')
    } else {
      words = this.split(' ')
    }
    words = words.filter((x) => x.length > 0)
    for (let i = 0; i < words.length; i++) {
      words[i] = words[i][0].toUpperCase() + words[i].substr(1)
    }
    if (words.length > 0) {
      words = words.join(' ')
    }
  }
  return words
}

String.prototype.spaceBetweenWords = function () {
  let returnString = this.toString()
  return returnString.replace(/([a-z])([A-Z])/g, '$1 $2')
}

String.prototype.formatNameFirstNameOnly = function () {
  let returnString = this.toString()
  if (!returnString || returnString === undefined || returnString.length === 0) {
    return returnString
  }
  returnString = returnString.split(' ')[0]
  returnString.uppercaseFirstLetterOfAllWords(returnString)
  return returnString
}

String.prototype.camelCaseToString = function (word) {
  const result = word.replace(/([A-Z])/g, ' $1')
  return result.charAt(0).toUpperCase() + result.slice(1)
}

String.prototype.formatPhone = function () {
  this.toString()
  this.replaceAll('-', '')
  this.replaceAll(' ', '')
  this.replaceAll('(', '')
  this.replaceAll(')', '')
  this.replaceAll('+', '')
  this.replaceAll('+1', '')
  return this.toString()
}

String.prototype.removeFileExtension = function () {
  return this.replace(/\.[^/.]+$/, '')
}

//#endregion

//#region Arrays
Array.prototype.unique = function () {
  return Array.from(new Set(this))
}
//#endregion
