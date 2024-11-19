// @ts-ignore
import DB from '@db'
import '../prototypes'
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
import CalMapper from '../mappers/calMapper'
import _ from 'lodash'

const Manager = {
  resetForm: (parentClass) => {
    const inputWrappers = document.querySelectorAll('.input-container')
    const parentClassInputs = document.querySelector(`.${parentClass}`)?.querySelectorAll('input, textarea')
    const toggles = document.querySelectorAll('.react-toggle')
    const checkboxes = document.querySelector(`.${parentClass}`)?.querySelectorAll('.box')

    // Input Wrappers
    if (Manager.isValid(inputWrappers, true)) {
      inputWrappers.forEach((wrapper) => {
        wrapper.classList.remove('active')
        const input = wrapper.querySelector('input')
        const textarea = wrapper.querySelector('textarea')
        if (input) {
          input.value = ''
        }
        if (textarea) {
          textarea.value = ''
        }
      })
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
  getUid: () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0,
        v = c == 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
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
  showPageContainer: () => {
    const interval = setInterval(() => {
      const pageContainer = document.querySelector('.page-container')
      if (pageContainer) {
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
  getUniqueArray: (arr, propertyNameForUid) => {
    let outputArray = Array.from(new Set(arr))

    if (Manager.isValid(propertyNameForUid)) {
      return _.uniqueBy(arr, propertyNameForUid.toString())
    }
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
  handleCheckboxSelection: (element, onCheck, onCheckRemoval, canSelectAll = false) => {
    const clickedEl = element.currentTarget
    const checkbox = clickedEl.querySelector('.box')
    const labels = clickedEl.closest('#checkbox-group').querySelectorAll(`[data-label]`)

    if (hasClass(checkbox, 'active')) {
      const label = clickedEl.dataset['label']
      checkbox.classList.remove('active')
      if (onCheckRemoval) onCheckRemoval(label)
    } else {
      const label = clickedEl.dataset['label']
      if (canSelectAll === false) {
        labels.forEach((labelEl) => {
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
}

export default Manager