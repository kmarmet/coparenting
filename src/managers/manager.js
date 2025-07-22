// Path: src\managers\manager.js
import _ from "lodash"
import validator from "validator"
import AlertManager from "./alertManager"
import LogManager from "./logManager"
import StringManager from "./stringManager"

const Manager = {
      GetPromise: async (callback, delay = 0) =>
            await new Promise((resolve) => {
                  setTimeout(() => {
                        resolve()
                        callback()
                  }, delay)
            }).catch((error) => {
                  LogManager.Log(error.message, LogManager.LogTypes.error, error.stack)
                  // log error
            }),
      ConditionalIntervalWithTimeout: (condition, startTime, successCallback = () => {}, failureCallback = () => {}, timeoutSeconds = 5) => {
            let int = setInterval(() => {
                  const endTime = Date.now()
                  const elapsedTimeMs = endTime - startTime
                  const elapsedTimeSeconds = elapsedTimeMs / 1000

                  console.log("Elapsed time:", Math.floor(elapsedTimeSeconds), "seconds")

                  // If the condition fails and the timer exceeds 5 seconds
                  if (Math.floor(elapsedTimeSeconds) > timeoutSeconds && condition === false) {
                        clearInterval(int)
                        failureCallback()
                  }

                  if (condition === true) {
                        clearInterval(int)
                        successCallback()
                  }
            }, 1000)
      },
      GetInvalidInputsErrorString: (requiredInputs) => {
            const invalidNames = []

            for (const input of requiredInputs) {
                  if (Manager.IsValid(input.name) && !Manager.IsValid(input.value, {minLength: 1})) {
                        invalidNames.push(input.name)
                  }
            }

            if (!invalidNames?.length) return ""

            const isPlural = invalidNames.length > 1
            const last = invalidNames.pop()
            const formattedNames = invalidNames.length ? `${invalidNames.join(", ")} and ${last}` : last

            return `${formattedNames} ${isPlural ? "are" : "is"} required`
      },
      ResetForm: (parentClass) => {
            const inputWrappers = document.querySelectorAll(".input-container")

            const parentClassInputs = document.querySelector(`.${parentClass}`)?.querySelectorAll("input, textarea")
            const toggles = document.querySelectorAll(".react-toggle")
            const checkboxes = document.querySelector(`.${parentClass}`)?.querySelectorAll(".box")

            // Input Wrappers
            if (Manager.IsValid(inputWrappers, true)) {
                  inputWrappers.forEach((wrapper) => {
                        wrapper.classList.remove("active")
                        const input = wrapper.querySelector("input")
                        const textarea = wrapper.querySelector("textarea")
                        if (input) {
                              input.value = ""
                        }
                        if (textarea) {
                              textarea.value = ""
                        }
                  })
            }

            // Inputs/Textareas
            if (Manager.IsValid(parentClassInputs, true)) {
                  parentClassInputs.forEach((input) => {
                        input.value = ""
                        input.classList.remove("active")
                  })
            }

            // Toggles
            if (Manager.IsValid(toggles, true)) {
                  toggles.forEach((toggle) => {
                        toggle.classList.remove("react-toggle--checked")
                        toggle.querySelector("input").value = "off"
                  })
            }

            // Checkboxes
            if (Manager.IsValid(checkboxes, true)) {
                  checkboxes.forEach((checkbox) => checkbox.classList.remove("active"))
            }
      },
      GetUid: () => {
            return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
                  const r = (Math.random() * 16) | 0,
                        v = c == "x" ? r : (r & 0x3) | 0x8
                  return v.toString(16)
            })
      },
      Contains: (variable, stringToCheckFor) => {
            if (Manager.IsValid(variable) && Manager.IsValid(stringToCheckFor)) {
                  return _.includes(variable, stringToCheckFor)
            } else {
                  return false
            }
      },
      GenerateHash: (str) => btoa(str),
      DecodeHash: (str) => atob(str),
      GetURLParam: (urlString, param) => {
            const url = new URL(urlString)
            const params = new URLSearchParams(url.search)

            return params.get(param) || ""
      },
      HideKeyboard: (parentClass) => {
            const parent = document.querySelector(`.${parentClass}`)
            if (parent) {
                  const input = parent.querySelector("input")
                  if (input) {
                        input.setAttribute("readonly", "readonly") // Force keyboard to hide on input field.
                        input.setAttribute("disabled", "true") // Force keyboard to hide on textarea field.
                        setTimeout(function () {
                              input.blur() //actually close the keyboard
                              // Remove readonly attribute after keyboard is hidden.
                              input.removeAttribute("readonly")
                              input.removeAttribute("disabled")
                        }, 100)
                  }
            }
            if ("virtualKeyboard" in navigator) {
                  navigator.virtualKeyboard.hide()
            }
      },
      ValidateFormProperty: (
            variableToCheck,
            variableName = "",
            isString = true,
            errorMessage = `${variableName} is Required`,
            variableType = ""
      ) => {
            if (variableType === "phone") {
                  if (!validator?.isMobilePhone(variableToCheck)) {
                        AlertManager.throwError(errorMessage)
                        throw {silent: true}
                  }
            }
            if (!Manager.IsValid(variableToCheck, isString)) {
                  AlertManager.throwError(errorMessage)
                  throw {silent: true}
            }
            return true
      },
      IsValid: (variable, checkStringLength = false) => {
            // Null or undefined
            if (variable == null) return false

            // Moment.js invalid date
            if (typeof variable === "object" && variable?._isAMomentObject && !variable._isValid) {
                  return false
            }

            if (Number.isInteger(variable)) {
                  return variable >= 0
            }

            // Invalid string (like "Invalid date")
            // String check
            if (typeof variable === "string") {
                  if (!checkStringLength && variable.trim() === "") return false
                  if (variable.includes("Invalid")) return false
            }
            // Empty array or object
            if (_.isEmpty(variable)) return false

            // -1 check (optional - make this explicit if tied to your domain)
            return !(parseInt(variable) === -1 && variable < 1)
      },
      GetDirectionsLink: (address) => {
            let directionsLink
            if (!Manager.IsValid(address, true)) {
                  return ""
            }
            if (
                  (!window?.navigator?.platform.includes("Win") && navigator.platform.indexOf("iPhone") != -1) ||
                  navigator.platform.indexOf("iPod") != -1 ||
                  navigator.platform.indexOf("iPad") != -1
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
                        let shareWithUser = dbUsers?.find((x) => x?.key === key || x?.userKey === key)
                        if (Manager.IsValid(shareWithUser)) {
                              names.push(StringManager.GetFirstNameOnly(shareWithUser?.name))
                        }
                  }
                  shareWithNames.push(names)
            }

            return shareWithNames
      },
}

export default Manager