// Path: src\managers\manager.js
import _ from 'lodash'
import StringManager from './stringManager'

const Manager = {
  GetInvalidInputsErrorString: (requiredInputs) => {
    let invalidInputNames = []
    let areOrIs = 'are'
    if (Manager.IsValid(requiredInputs)) {
      for (let input of requiredInputs) {
        if (Manager.IsValid(input.name) && !Manager.IsValid(input.value, true)) {
          invalidInputNames.push(input?.name)
        }
      }

      if (invalidInputNames.length > 1) {
        invalidInputNames.splice(invalidInputNames.length - 1, 0, 'and')
      }
      invalidInputNames = invalidInputNames.filter((x) => Manager.IsValid(x))

      if (invalidInputNames.length === 1) {
        areOrIs = 'is'
      }
      invalidInputNames = invalidInputNames.join(', ')
      invalidInputNames = invalidInputNames.replace('and,', 'and')

      if (Manager.IsValid(invalidInputNames, true)) {
        return `${invalidInputNames} ${areOrIs} required`
      }
    }
    return ''
  },
  ResetForm: (parentClass) => {
    const inputWrappers = document.querySelectorAll('.input-container')

    const parentClassInputs = document.querySelector(`.${parentClass}`)?.querySelectorAll('input, textarea')
    const toggles = document.querySelectorAll('.react-toggle')
    const checkboxes = document.querySelector(`.${parentClass}`)?.querySelectorAll('.box')

    // Input Wrappers
    if (Manager.IsValid(inputWrappers, true)) {
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
    if (Manager.IsValid(parentClassInputs, true)) {
      parentClassInputs.forEach((input) => {
        input.value = ''
        input.classList.remove('active')
      })
    }

    // Toggles
    if (Manager.IsValid(toggles, true)) {
      toggles.forEach((toggle) => {
        toggle.classList.remove('react-toggle--checked')
        toggle.querySelector('input').value = 'off'
      })
    }

    // Checkboxes
    if (Manager.IsValid(checkboxes, true)) {
      checkboxes.forEach((checkbox) => checkbox.classList.remove('active'))
    }
  },
  GetUid: () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0,
        v = c == 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  },
  Contains: (variable, stringToCheckFor) => _.includes(variable, stringToCheckFor),
  GenerateHash: (str) => btoa(str),
  DecodeHash: (str) => atob(str),
  GetURLParam: (urlString, param) => {
    const url = new URL(urlString)
    const params = new URLSearchParams(url.search)

    return params.get(param) || ''
  },
  HideKeyboard: (parentClass) => {
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
    if ('virtualKeyboard' in navigator) {
      navigator.virtualKeyboard.hide()
    }
  },
  IsValid: (variable, checkStringLength = false) => {
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
  GetDirectionsLink: (address) => {
    let directionsLink
    if (!Manager.IsValid(address, true)) {
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
  MapKeysToUsers: (keys, dbUsers) => {
    let shareWithNames = []
    if (Manager.IsValid(keys)) {
      let names = []
      for (let key of keys) {
        let shareWithUser = dbUsers.find((x) => x?.key === key || x?.userKey === key)
        if (Manager.IsValid(shareWithUser)) {
          names.push(StringManager.getFirstNameOnly(shareWithUser?.name))
        }
      }
      shareWithNames.push(names)
    }

    return shareWithNames
  },
}

export default Manager