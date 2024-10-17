import moment from 'moment'
// @ts-ignore
import ReminderTimes from 'constants/reminderTimes'
import DB from '@db'
import '../prototypes'

const Manager = {
  resetForm: (parentClass) => {
    const inputs = document.querySelector(`.${parentClass}`).querySelectorAll('input, textarea')
    const toggles = document.querySelector(`.${parentClass}`).querySelectorAll('.react-toggle--checked')
    const checkboxes = document.querySelector(`.${parentClass}`).querySelectorAll('.box')
    // Inputs/Textareas
    if (Manager.isValid(inputs, true)) {
      inputs.forEach((input) => {
        input.value = ''
      })
    }

    // Toggles
    if (Manager.isValid(toggles, true)) {
      toggles.forEach((toggle) => toggle.classList.remove('react-toggle--checked'))
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
  toCamelCase: (str) => {
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
  createVerificationCode: () => {
    return Math.floor(100000 + Math.random() * 900000)
  },
  scrollToTopOfPage: () => {
    window.scrollTo(0, 0)
  },
  // ON PAGE LOAD
  toggleForModalOrNewForm: (hideOrShow = 'show') => {
    Manager.centerDatepicker()
    if (hideOrShow === 'show') {
      Manager.showPageContainer()
      Manager.scrollToTopOfPage()
    }
  },
  showPageContainer: () => {
    const interval = setInterval(() => {
      const pageContainer = document.querySelector('.page-container')
      if (pageContainer) {
        pageContainer.classList.add('active')
        clearInterval(interval)
      }
    }, 200)
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
      if (!variable || variable === undefined) {
        return false
      }
      if (Object.keys(variable).length === 0) {
        return false
      }
      for (let prop in variable) {
        if (!prop || prop === undefined) {
          return false
        }
        if (!variable[prop] || variable[prop] === undefined) {
          return false
        }
      }
    } else {
      if (!variable || variable === undefined) {
        return false
      } else {
        if (checkArrayLength && variable.length <= 0) {
          return false
        }
        if (checkStringLength && variable.length === 0) {
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
  formatPhoneNumber(phoneNumberString) {
    let input = phoneNumberString.replace('(', '').replace(')', '').replace(' ', '').substring(0, 10)

    const areaCode = input.substring(0, 3)
    const middle = input.substring(3, 6)
    const last = input.substring(6, 10)

    if (input.length > 6) {
      input = `${areaCode}-${middle}-${last}`
    } else if (input.length > 3) {
      input = `(${areaCode}) ${middle}`
    } else if (input.length > 0) {
      input = `(${areaCode}`
    }

    return input
  },
  getUniqueArrayOfObjects: (arr, key) => {
    let setObj = new Set(arr.map(JSON.stringify))
    let output = Array.from(setObj).map(JSON.parse)
    // [...new Map(arr.map((item) => [item[key], item])).values()];
    return output
  },
  handleCheckboxSelection: (element, checkCallback, uncheckCallback, canSelectAll = false) => {
    const clickedEl = element.currentTarget
    const checkbox = clickedEl.querySelector('.box')

    if (checkbox.classList.contains('active')) {
      const label = clickedEl.dataset['label']
      checkbox.classList.remove('active')
      if (uncheckCallback) uncheckCallback(label)
    } else {
      const label = clickedEl.dataset['label']
      const notActiveLabels = clickedEl.parentNode.querySelectorAll(`[data-label]:not([data-label="${label}"])`)
      if (!canSelectAll) {
        notActiveLabels.forEach((labelEl) => {
          labelEl.querySelector('.box').classList.remove('active')
        })
      }
      clickedEl.querySelector('.box').classList.add('active')
      if (checkCallback) checkCallback(label)
    }
  },
  handleShareWithSelection: async (e, currentUser, theme, shareWith) => {
    console.log(shareWith)
    let returnValue = []
    const clickedEl = e.currentTarget
    const checkbox = clickedEl.querySelector('.share-with-container .box')
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
      if (currentUser.accountType === 'parent') {
        currentUser.coparents.forEach((coparent) => {
          if (coparent.phone == selectedValue) {
            if (shareWith.length === 0) {
              shareWith = [coparent.phone]
            } else {
              shareWith = [...shareWith, coparent.phone]
            }
          }
        })
      } else {
        currentUser.parents.forEach((parent) => {
          if (parent.phone == selectedValue) {
            if (shareWith.length === 0) {
              shareWith = [parent.phone]
            } else {
              shareWith = [...shareWith, parent.phone]
            }
          }
        })
      }
      checkbox.classList.add('active')
    }
    return shareWith
  },
  setDefaultCheckboxes: (checkboxGroupName, object, propName, isArray = false) => {
    const getRepeatingEvents = async () => {
      const eventTitle = object.title
      let repeatingEvents = await DB.getTable(DB.tables.calendarEvents)
      repeatingEvents = repeatingEvents.filter((x) => x.title === eventTitle)
      const repeatInterval = object['repeatInterval']
      document.querySelector(`[data-label='${repeatInterval.uppercaseFirstLetterOfAllWords()}']`).querySelector('.box').classList.add('active')
      return repeatingEvents
    }
    if (checkboxGroupName === 'repeating') {
      const repeatingEvents = getRepeatingEvents()
      return repeatingEvents
    }
    // Reminder Times
    if (checkboxGroupName === 'reminderTimes') {
      const reminderIsValid = Manager.isValid(object[propName], isArray ? true : false)
      let reminderTimes = []
      if (reminderIsValid) {
        if (object.reminderTimes.includes(ReminderTimes.hour)) {
          document.querySelector(`[data-label='1 hour before']`).querySelector('.box').classList.add('active')
          reminderTimes.push(ReminderTimes.hour)
        }
        if (object.reminderTimes.includes(ReminderTimes.halfHour)) {
          document.querySelector(`[data-label='30 minutes before']`).querySelector('.box').classList.add('active')
          reminderTimes.push(ReminderTimes.halfHour)
        }
        if (object.reminderTimes.includes(ReminderTimes.fiveMinutes)) {
          document.querySelector(`[data-label='5 minutes before']`).querySelector('.box').classList.add('active')
          reminderTimes.push(ReminderTimes.fiveMinutes)
        }
        if (object.reminderTimes.includes(ReminderTimes.timeOfEvent)) {
          document.querySelector(`[data-label='At time of event']`).querySelector('.box').classList.add('active')
          reminderTimes.push(ReminderTimes.timeOfEvent)
        }
      }
      return reminderTimes
    }
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
  sortAlpha: (arr, prop) => {
    return arr.sort(function (a, b) {
      var textA = a[prop].toUpperCase()
      var textB = b[prop].toUpperCase()
      return textA < textB ? -1 : textA > textB ? 1 : 0
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
    return word.uppercaseFirstLetterOfAllWords(word.replace(/([a-z])([A-Z])/, '$1 $2')).replace(/([a-z])([A-Z])/, '$1 $2')
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
