import moment from 'moment'
// @ts-ignore
import DB from '@db'
import '../prototypes'
import ModelNames from '../models/modelNames'
import {
  contains,
  displayAlert,
  formatFileName,
  formatNameFirstNameOnly,
  getFileExtension,
  getFirstWord,
  hasClass,
  isAllUppercase,
  removeFileExtension,
  removeSpacesAndLowerCase,
  spaceBetweenWords,
  stringHasNumbers,
  toCamelCase,
  uniqueArray,
  uppercaseFirstLetterOfAllWords,
  wordCount,
} from '../globalFunctions'
import CalendarEvent from '../models/calendarEvent'
import Expense from '../models/expense'
import Memory from '../models/memory'
import SwapRequest from '../models/swapRequest'
import TransferChangeRequest from '../models/transferChangeRequest'
import User from '../models/user'
import TitleSuggestion from '../models/titleSuggestion'
import Coparent from '../models/coparent'
import ConversationMessage from '../models/conversationMessage'
import ConversationThread from '../models/conversationThread'
import ChildUser from '../models/child/childUser'
import CalMapper from '../mappers/calMapper'

const Manager = {
  cleanObject: (object, modelName) => {
    let returnObject
    switch (true) {
      case modelName === ModelNames.calendarEvent:
        returnObject = new CalendarEvent()
        break
      case modelName === ModelNames.expense:
        returnObject = new Expense()
        break
      case modelName === ModelNames.memory:
        returnObject = new Memory()
        break
      case modelName === ModelNames.transferChangeRequest:
        returnObject = new TransferChangeRequest()
        break
      case modelName === ModelNames.swapRequest:
        returnObject = new SwapRequest()
        break
      case modelName === ModelNames.titleSuggestion:
        returnObject = new TitleSuggestion()
        break
      case modelName === ModelNames.user:
        returnObject = new User()
        break
      case modelName === ModelNames.coparent:
        returnObject = new Coparent()
        break
      case modelName === ModelNames.conversationThread:
        returnObject = new ConversationThread()
        break
      case modelName === ModelNames.conversationMessage:
        returnObject = new ConversationMessage()
        break
      case modelName === ModelNames.childUser:
        returnObject = new ChildUser()
        break
      default:
    }

    for (let prop in object) {
      if (Array.isArray(object[prop])) {
        if (object[prop] === undefined || object[prop] === null) {
          object[prop] = []
        }
      } else {
        if (object[prop] === undefined || object[prop] === null || object[prop].toString().toLowerCase().includes('invalid')) {
          object[prop] = ''
        }
      }
      returnObject[prop] = object[prop]
    }
    return returnObject
  },
  resetForm: (parentClass) => {
    const inputWrappers = document.querySelectorAll('.input-container')
    const parentClassInputs = document.querySelector(`.${parentClass}`)?.querySelectorAll('input, textarea')
    const toggles = document.querySelectorAll('.react-toggle')
    const checkboxes = document.querySelector(`.${parentClass}`)?.querySelectorAll('.box')

    // Input Wrappers
    if (Manager.isValid(inputWrappers, true)) {
      inputWrappers.forEach((wrapper) => wrapper.classList.remove('active'))
    }

    // Inputs/Textareas
    if (Manager.isValid(parentClassInputs, true)) {
      parentClassInputs.forEach((input) => {
        input.value = ''
        input.classList.remove('active')
      })
    }

    // Toggles
    if (Manager.isValid(toggles, true)) {
      toggles.forEach((toggle) => {
        toggle.classList.remove('react-toggle--checked')
        toggle.querySelector('input').value = 'off'
      })
    }

    // Checkboxes
    if (Manager.isValid(checkboxes, true)) {
      checkboxes.forEach((checkbox) => checkbox.classList.remove('active'))
    }
  },
  phoneNumberIsValid: (phone) => {
    const expr = /^(1[ -]?)?\d{3}[ -]?\d{3}[ -]?\d{4}$/
    return expr.test(phone)
  },
  toggleSparkleAnimation: (element) => {
    element.classList.add('animate', 'sparkle')
    setTimeout(() => {
      element.classList.remove('animate')
    }, 200)
  },
  getUid: () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0,
        v = c == 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  },
  toCamelCase(str) {
    // Using replace method with regEx
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
        return index == 0 ? word.toLowerCase() : word.toUpperCase()
      })
      .replace(/\s+/g, '')
  },
  centerDatepicker: () => {
    // Run again if another picker is opened
    // document.querySelector('.page-container').addEventListener('click', function () {
    //   Manager.centerDatepicker()
    // })
    let interval = setInterval(() => {
      const datePicker = document.querySelector('[data-testid="picker-popup"]')
      if (datePicker) {
        datePicker.style.cssText = 'top: 50% !important;left: 50% !important;right: 50% !important;transform: translate(-50%, -50%);'
        Manager.hideKeyboard()
        clearInterval(interval)
      }
    }, 200)
  },
  getCurrentDate: () => {
    const date = new Date()
    let day = date.getDate()
    let month = date.getMonth() + 1
    let year = date.getFullYear()
    let currentDate = `${month}/${day}/${year}`
    return currentDate
  },
  scrollToTopOfPage: () => {
    window.scrollTo(0, 0)
  },
  scrollIntoView(selector, position = 'start') {
    const element = document.querySelector(selector)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: position })
    }
  },
  getNamesFromPhone: async (phones) => {
    let userObjectsToReturn = []
    if (Manager.isValid(phones, true)) {
      const users = await DB.getTable(DB.tables.users)
      for (let user of users) {
        if (phones.includes(user.phone)) {
          userObjectsToReturn.push({
            name: user.name,
            phone: user.phone,
          })
        }
      }
    }
    return userObjectsToReturn.flat()
  },
  // ON PAGE LOAD
  showPageContainer: () => {
    const interval = setInterval(() => {
      const pageContainer = document.querySelector('.page-container')
      if (pageContainer) {
        Manager.centerDatepicker()
        // pageContainer.style.maxHeight = `${window.screen.height - 90}px`
        pageContainer.classList.add('active')
        Manager.scrollToTopOfPage()
        clearInterval(interval)
      }
    }, 200)
  },
  getURLParam: (urlString, param) => {
    const url = new URL(urlString)
    const params = new URLSearchParams(url.search)

    return params.get(param) || ''
  },
  hideKeyboard: (parentClass) => {
    const parent = document.querySelector(`.${parentClass}`)
    if (parent) {
      const input = parent.querySelector('input')
      if (input) {
        input.setAttribute('readonly', 'readonly') // Force keyboard to hide on input field.
        input.setAttribute('disabled', 'true') // Force keyboard to hide on textarea field.
        setTimeout(function () {
          input.blur() //actually close the keyboard
          // Remove readonly attribute after keyboard is hidden.
          input.removeAttribute('readonly')
          input.removeAttribute('disabled')
        }, 100)
      }
    }
  },
  validation: (inputs) => {
    let errors = []
    inputs.forEach((input) => {
      if (!Manager.isValid(input, Array.isArray(input) ? true : false)) {
        errors.push(input)
      }
    })
    return errors.length
  },
  isValid: (variable, checkArrayLength, validateObject, checkStringLength) => {
    if (validateObject && typeof variable === 'object') {
      if (!variable) {
        return false
      }
      if (Object.keys(variable).length === 0) {
        return false
      }
      for (let prop in variable) {
        if (!prop) {
          return false
        }

        if (variable[prop].length === 0) {
          return false
        }
        // if (!variable[prop] || variable[prop] === undefined) {
        //   console.log(variable, prop)
        //   return false
        // }
      }
    } else {
      if (!variable) {
        return false
      } else {
        if ((checkArrayLength && variable.length <= 0) || (checkArrayLength && variable.length === 0)) {
          return false
        }
      }
    }
    return true
  },
  isIos: () => {
    return (
      ['iPad Simulator', 'iPhone Simulator', 'iPod Simulator', 'iPad', 'iPhone', 'iPod'].includes(navigator.platform) ||
      // iPad on iOS 13 detection
      (navigator.userAgent.includes('Mac') && 'ontouchend' in document)
    )
  },
  getUniqueArray: (arr) => {
    let outputArray = Array.from(new Set(arr))
    return outputArray
  },
  convertToArray: (object) => {
    if (!Array.isArray(object)) {
      object = DB.convertKeyObjectToArray(object)
    }

    return object
  },
  getDirectionsLink: (address) => {
    let directionsLink
    if (
      (!window?.navigator?.platform.includes('Win') && navigator.platform.indexOf('iPhone') != -1) ||
      navigator.platform.indexOf('iPod') != -1 ||
      navigator.platform.indexOf('iPad') != -1
    ) {
      directionsLink = `https://maps.apple.com/?daddr=${encodeURIComponent(address)}`
    } else {
      directionsLink = `https://www.google.com/maps?daddr=${encodeURIComponent(address)}`
    }

    return directionsLink
  },
  getUniqueArrayOfObjects: (arr, key) => {
    let setObj = new Set(arr.map(JSON.stringify))
    let output = Array.from(setObj).map(JSON.parse)
    // [...new Map(arr.map((item) => [item[key], item])).values()];
    return output
  },
  handleCheckboxSelection: (element, onCheck, onCheckRemoval, canSelectAll = false) => {
    const clickedEl = element.currentTarget
    const checkbox = clickedEl.querySelector('.box')

    if (checkbox.classList.contains('active')) {
      const label = clickedEl.dataset['label']
      checkbox.classList.remove('active')
      if (onCheckRemoval) onCheckRemoval(label)
    } else {
      const label = clickedEl.dataset['label']
      const notActiveLabels = clickedEl.parentNode.querySelectorAll(`[data-label]:not([data-label="${label}"])`)
      if (!canSelectAll) {
        notActiveLabels.forEach((labelEl) => {
          labelEl.querySelector('.box').classList.remove('active')
        })
      }
      clickedEl.querySelector('.box').classList.add('active')
      if (onCheck) onCheck(label)
    }
  },
  handleShareWithSelection: (e, currentUser, shareWith) => {
    const clickedEl = e.currentTarget
    const checkbox = clickedEl.querySelector('#share-with-checkbox-container .box')
    const selectedValue = clickedEl.getAttribute('data-phone')
    // Uncheck
    if (checkbox.classList.contains('active')) {
      checkbox.classList.remove('active')
      if (shareWith.length > 0) {
        shareWith = shareWith.filter((x) => x !== selectedValue)
      }
    }
    // On check
    else {
      if (currentUser?.accountType === 'parent') {
        currentUser?.coparents.forEach((coparent) => {
          if (coparent.phone === selectedValue) {
            if (shareWith?.length === 0) {
              shareWith = [coparent.phone]
            } else {
              if (shareWith?.length > 0) {
                shareWith = [...shareWith, coparent.phone]
              }
            }
          }
        })
      } else {
        if (currentUser.accountType === 'child') {
          currentUser?.parents.forEach((parent) => {
            if (parent.phone === selectedValue) {
              if (shareWith.length === 0) {
                shareWith = [parent.phone]
              } else {
                shareWith = [...shareWith, parent.phone]
              }
            }
          })
        }
      }
      checkbox.classList.add('active')
    }
    return shareWith
  },
  setDefaultCheckboxes: (checkboxContainerClass, object, propName, isArray = false, values) => {
    const getRepeatingEvents = async () => {
      const eventTitle = object.title
      let repeatingEvents = await DB.getTable(DB.tables.calendarEvents)
      repeatingEvents = repeatingEvents.filter((x) => x.title === eventTitle)
      const repeatInterval = object['repeatInterval']
      document
        .querySelector(`[data-label='${uppercaseFirstLetterOfAllWords(repeatInterval)}']`)
        .querySelector('.box')
        .classList.add('active')
      return repeatingEvents
    }
    // Share With
    if (checkboxContainerClass === 'share-with') {
      for (let phone of values) {
        console.log(`.${checkboxContainerClass} [data-phone='${phone}'] .box`)
        document.querySelector(`.${checkboxContainerClass} [data-phone='${phone}'] .box`).classList.add('active')
      }
    }

    // Repeating
    if (checkboxContainerClass === 'repeating') {
      const repeatingEvents = getRepeatingEvents()
      return repeatingEvents
    }

    // Reminder Times
    if (checkboxContainerClass === 'reminder-times') {
      const reminderIsValid = Manager.isValid(values, true)
      let reminderTimes = values
      if (reminderIsValid) {
        for (let timeframe of reminderTimes) {
          document.querySelector(`[data-label='${CalMapper.readableReminderBeforeTimeframes(timeframe)}'] .box`).classList.add('active')
        }
      }
    }
  },
  dateIsValid: (date) => {
    if (!Manager.isValid(date)) {
      return false
    }
    if (moment(date).toString().toLowerCase().includes('invalid')) {
      return false
    }
    return true
  },

  // TODO Remove any unused below
  getArraySortedByDate: (arr, prop, dateTitle = 'dateAdded') => {
    if (prop) {
      return arr.sort(function (a, b) {
        return new Date(a[prop]) - new Date(b[prop])
      })
    } else {
      return arr.sort(function (a, b) {
        return new Date(b[dateTitle]) - new Date(a[dateTitle])
      })
    }
  },
  sortArrayOfObjectsByProp: (arr, prop, direction = 'asc', valueType = 'string') => {
    return arr.sort(function (a, b) {
      let textA = a[prop]
      let textB = b[prop]

      if (valueType === 'string') {
        textA = a[prop].toUpperCase()
        textB = b[prop].toUpperCase()
      }
      if (direction === 'asc') {
        return textA < textB ? -1 : textA > textB ? 1 : 0
      } else {
        return textB < textA ? -1 : textB > textA ? 1 : 0
      }
    })
  },
  validateEmail: (email) => {
    var re = /\S+@\S+\.\S+/
    return re.test(email)
  },
  addDashesToPhoneNumber: (phone) => {
    return phone.replace(/^(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
  },
  formatScreenTitle: (word) => {
    return uppercaseFirstLetterOfAllWords(word.replace(/([a-z])([A-Z])/, '$1 $2')).replace(/([a-z])([A-Z])/, '$1 $2')
  },
  convertObjectToArray: (obj) => {
    return obj[0]
  },
  hasNumber: (string) => {
    return /\d/.test(string)
  },
  stringToDate: (str) => {
    console.log(moment(new Date(str)).format('MM/DD/yyyy'))
    console.log()
    return moment(str).format('MM/DD/yyyy')
  },
  toggleInfoSection: (e) => {
    // e.stopPropagation();
    const section = e.currentTarget.closest('.section')
    const allSections = document.querySelectorAll('.info-section.section')
    if (section.classList.contains('active')) {
      section.classList.remove('active')
    } else {
      allSections.forEach((x) => x.classList.remove('active'))
      section.classList.add('active')
    }
  },
  createAndAppendElement: (elementType, elementText, elementClass, appendContainer, callback) => {
    const el = document.createElement(elementType)
    el.innerText = elementText
    el.classList.add(elementClass)
    appendContainer.appendChild(el)

    if (callback) {
      callback(el)
    }
  },
  removeUndefinedFromArray: (arr) => {
    return arr.filter((item) => item)
  },
  isValidPassword: (password) => {
    return password.length >= 6 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password) && /[#.?!@$%^&*-]/.test(password)
  },
  returnValidPropFromObject: (prop, propName, object, propType = 'string') => {
    let validated = Manager.isValid(prop) ? object[propName] : ''
    if (Manager.isValid(propType) && propType === 'array') {
      validated = Manager.isValid(prop) ? prop : object[propName] || []
    }
    return validated
  },
  createImage: (id = '', src = '') => {
    var img = document.createElement('img')
    img.src = `${src}`
    img.id = `${id}`

    return img
  },
}

export default Manager
