// Path: src\managers\manager.js
import DB from '../database/DB'
import CalMapper from '../mappers/calMapper'
import _ from 'lodash'
import StringManager from './stringManager'
import DomManager from './domManager'
import DB_UserScoped from '../database/db_userScoped'

const Manager = {
  invalidInputs: (requiredInputs) => {
    const invalidInputs = requiredInputs.filter((x) => !Manager.isValid(x) || x?.value?.length === 0 || x.length == 0)
    if (invalidInputs.length > 0) {
      return invalidInputs
    }
    return []
  },
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
  contains: (variable, stringToCheckFor) => {
    return _.includes(variable, stringToCheckFor)
  },
  generateHash: (str) => {
    return btoa(str)
  },
  decodeHash: (str) => {
    return atob(str)
  },
  showPageContainer: () => {
    const interval = setInterval(() => {
      const pageContainer = document.querySelector('.page-container')
      const navbar = document.getElementById('navbar')
      const eventsWrapper = document.querySelector('.with-padding')
      const appContentWrapper = document.getElementById('app-content-wrapper')

      if (pageContainer) {
        pageContainer.classList.add('active')
        pageContainer.addEventListener('scroll', () => {
          const scrollDistance = pageContainer.scrollTop
          if (navbar) {
            if (scrollDistance >= 50) {
              navbar.classList.add('hidden')
            } else {
              navbar.classList.remove('hidden')
            }
          }
        })

        if (eventsWrapper) {
          eventsWrapper.addEventListener('scroll', () => {
            const scrollDistance = eventsWrapper.scrollTop
            if (navbar) {
              if (scrollDistance >= 50) {
                navbar.classList.add('hidden')
              } else {
                navbar.classList.remove('hidden')
              }
            }
          })
        }
        Manager.scrollToTopOfPage()
        setTimeout(() => {
          if (appContentWrapper) {
            appContentWrapper.scrollTop = 0
          }
        }, 500)
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
      console.log(input)
      if (Array.isArray(input)) {
        if (!Manager.isValid(input, true)) {
          errors.push(input)
        }
      }
      if (!Manager.isValid(input) || input.value.length === 0) {
        errors.push(input)
      }
    })
    console.log(errors)
    return errors.length
  },
  isValid: (variable, checkStringLength = false) => {
    // Check variable -> do not check for empty string
    if (_.isEmpty(variable) && checkStringLength === false) {
      if (_.isEmpty(variable)) {
        return false
      }
    }
    // Check variable -> including empty string
    else {
      if (_.isEmpty(variable)) {
        return false
      }
    }

    // Date check
    if (typeof variable === 'object') {
      if (variable.hasOwnProperty('_isAMomentObject')) {
        if (variable['_isValid'] === false) {
          return false
        }
      }
    }
    if (typeof variable === 'string' && variable.indexOf('Invalid') > -1) {
      return false
    }
    return !(typeof variable === 'string' && variable.indexOf('Invalid') > -1)
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
      return _.uniqBy(arr, propertyNameForUid.toString())
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
    if (!Manager.isValid(address, true)) {
      return ''
    }
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
    const clickedEl = element
    const checkboxes = clickedEl.parentNode
    const checkboxWrappers = checkboxes.querySelectorAll(`.checkbox-wrapper`)
    const label = clickedEl.dataset['label']

    // CHECK
    if (clickedEl.classList.contains('active')) {
      const label = clickedEl.dataset['label']
      if (canSelectAll === false) {
        checkboxWrappers.forEach((wrapper) => {
          const thisLabel = wrapper.dataset.label
          if (thisLabel !== label) {
            wrapper.classList.remove('active')
          }
        })
      }
      if (onCheck) onCheck(label)
    }
    // UNCHECK
    else {
      if (onCheckRemoval) onCheckRemoval(label)
    }
  },
  buildCheckboxGroup: ({ currentUser, labelType, defaultLabels, customLabelArray, labelProp, uidProp, predefinedType }) => {
    let checkboxLabels = []
    let checkboxGroup = []
    // Predefined Types
    if (Manager.isValid(predefinedType)) {
      if (predefinedType === 'coparents') {
        checkboxLabels = DB_UserScoped.getCoparentObjArray(currentUser)
      }

      for (const label of checkboxLabels) {
        checkboxGroup.push({
          label: label['name'],
          key: label['key'],
        })
      }

      return checkboxGroup
    }

    if (!Manager.isValid(labelProp) && !Manager.isValid(uidProp)) {
      if (labelType && labelType === 'reminder-times') {
        checkboxLabels = CalMapper.allUnformattedTimes()
      }
      if (labelType && labelType === 'children') {
        checkboxLabels = currentUser?.children?.map((x) => x?.general?.name)
      }
      if (labelType && labelType === 'recurring-intervals') {
        checkboxLabels = ['Daily', 'Weekly', 'Biweekly', 'Monthly']
      }
      if (labelType && labelType === 'record-types') {
        checkboxLabels = ['Expenses', 'Chats']
      }
      if (labelType && labelType === 'visitation') {
        checkboxLabels = ['50/50', 'Custom Weekends', 'Every Weekend', 'Every other Weekend']
      }
      if (labelType && labelType === 'expense-payers' && Manager.isValid(currentUser.coparents)) {
        checkboxLabels = [...currentUser.coparents.map((x) => x.name), 'Me']
      }
      if (!labelType && Manager.isValid(customLabelArray)) {
        checkboxLabels = customLabelArray
      }
    }

    // ITERATE THROUGH LABELS
    if (!Manager.isValid(labelProp) && !Manager.isValid(uidProp)) {
      for (let label of checkboxLabels) {
        let isActive = false
        if (Manager.isValid(defaultLabels) && defaultLabels.includes(label)) {
          isActive = true
        }
        if (labelType && labelType === 'reminder-times') {
          label = CalMapper.readableReminderBeforeTimeframes(label)
        }
        checkboxGroup.push({
          label: label,
          key: label.replaceAll(' ', ''),
          isActive,
        })
      }
    }

    // From Object
    else {
      for (const chat of Array.from(customLabelArray)) {
        checkboxGroup.push({
          label: chat[labelProp],
          key: chat[uidProp],
        })
      }
    }

    return checkboxGroup
  },
  handleShareWithSelection: (e, currentUser, shareWith) => {
    const clickedEl = e.currentTarget
    const key = clickedEl.getAttribute('data-key')

    DomManager.toggleActive(clickedEl)

    if (shareWith.includes(key)) {
      shareWith = shareWith.filter((x) => x !== key)
    } else {
      shareWith = [...shareWith, key]
    }

    return shareWith
  },
  setDefaultCheckboxes: (checkboxContainerClass, object, propName, isArray = false, values) => {
    const getRepeatingEvents = async () => {
      const eventTitle = object.title
      let repeatingEvents = await DB.getTable(DB.tables.calendarEvents)
      repeatingEvents = repeatingEvents.filter((x) => x.title === eventTitle)
      const repeatInterval = object['repeatInterval']
      document.querySelector(`[data-label='${StringManager.uppercaseFirstLetterOfAllWords(repeatInterval)}']`).classList.add('active')
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