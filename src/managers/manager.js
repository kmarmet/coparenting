// Path: src\managers\manager.js
import _ from "lodash"
import AlertManager from "./alertManager"
import LogManager from "./logManager"
import StringManager from "./stringManager"

const Manager = {
    Validate: ({value, title, errorMessage = "", isString = false}) => {
        if (!Manager.IsValid(value, isString)) {
            AlertManager.throwError(title, errorMessage)
            return false
        }
        return true
    },
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
    ValidateFields: (validationFields) => {
        const errors = []

        const isMoment = (val) => val && typeof val === "object" && typeof val.isValid === "function" && val._isAMomentObject

        const isEmpty = (val) =>
            val === null || val === undefined || (typeof val === "string" && val.trim() === "") || (Array.isArray(val) && val.length === 0)

        validationFields.forEach(({name, value, required = true, type, errorMessage}) => {
            // 1️⃣ Required check
            if (required && isEmpty(value)) {
                errors.push(`${name} is required`)
                return // move to next
            }

            // 2️⃣ Type check
            if (type && value != null) {
                let validType = true

                switch (type.toLowerCase()) {
                    case "string":
                        validType = typeof value === "string"
                        break
                    case "number":
                        validType = typeof value === "number" && !isNaN(value)
                        break
                    case "boolean":
                        validType = typeof value === "boolean"
                        break
                    case "array":
                        validType = Array.isArray(value)
                        break
                    case "object":
                        validType = typeof value === "object" && !Array.isArray(value) && true
                        break
                    case "date":
                        validType = value instanceof Date && !isNaN(value.getTime())
                        break
                    case "moment":
                        validType = isMoment(value) && value.isValid()
                        break
                    default:
                        validType = true // unknown type, skip
                }

                if (!validType) errors.push(`${name} must be a valid ${type}`)
            }
        })

        return errors
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
    IsValid: (variable, checkStringLength = false, checkFile = false) => {
        switch (true) {
            // Null or undefined
            case variable == null:
                return false

            // Invalid number
            case typeof variable === "number" && variable < 0:
                return false

            // Moment.js invalid date
            case typeof variable === "object" && variable?._isAMomentObject && !variable._isValid:
                return false

            // Invalid string (like "Invalid date")
            case typeof variable === "string" && checkStringLength && variable.trim() === "":
                return false
            case typeof variable === "string" && variable.includes("Invalid"):
                return false

            // File with no size
            case checkFile && variable instanceof File && variable?.size <= 0:
                return false

            // Empty object or array using Object.entries or lodash
            case typeof variable === "object" && Object.entries(variable).length === 0:
                return false

            // Generic empty check
            case _.isEmpty(variable):
                return false

            // Explicit empty array check
            case Array.isArray(variable) && (variable.length === 0 || variable.filter(Boolean).length === 0):
                return false

            // Everything else is valid
            default:
                return true
        }
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