// Generated by CoffeeScript 2.7.0
var DropdownManager

import Apis from "../api/apis"

import EventCategories from "../constants/eventCategories"

import ExpenseCategories from "../constants/expenseCategories"

import DB_UserScoped from "../database/db_userScoped"

import CalMapper from "../mappers/calMapper"
import CalendarMapper from "../mappers/calMapper"

import DatasetManager from "./datasetManager"
import Manager from "./manager"

import StringManager from "./stringManager"

DropdownManager = {
    // HELPERS
    GetReadableReminderTimes: function (reminderTimes) {
        var i, len, readableTimes, time
        readableTimes = []
        if (Manager.IsValid(reminderTimes)) {
            for (i = 0, len = reminderTimes.length; i < len; i++) {
                time = reminderTimes[i]
                if (Manager.IsValid(time, true)) {
                    readableTimes.push(CalMapper.GetShortenedReadableReminderTime(time))
                }
            }
        }
        return readableTimes
    },
    ToggleHiddenOnInputs: function (hideOrShow = "hide") {
        var activeFormCard, closeDropdownButton, formContainer
        activeFormCard = document.querySelector(".active.form-card")
        if (!Manager.IsValid(activeFormCard)) {
            return
        }
        formContainer = activeFormCard.querySelector(".content-wrapper .form-container")
        closeDropdownButton = activeFormCard != null ? activeFormCard.querySelector(".close-dropdown-button") : void 0
        if (Manager.IsValid(formContainer)) {
            if (hideOrShow === "hide") {
                formContainer.classList.add("hidden")
                if (Manager.IsValid(closeDropdownButton)) {
                    return closeDropdownButton.classList.add("active")
                }
            } else {
                if (Manager.IsValid(closeDropdownButton)) {
                    closeDropdownButton.classList.remove("active")
                }
                return formContainer.classList.remove("hidden")
            }
        }
    },
    // MAPPERS
    MappedForDatabase: {
        RemindersFromArray: function (times) {
            var formatted, i, len, time
            formatted = []
            if (Manager.IsValid(times)) {
                for (i = 0, len = times.length; i < len; i++) {
                    time = times[i]
                    formatted.push(CalendarMapper.GetReminderTimes(time != null ? time.value : void 0))
                }
            }
            return DatasetManager.GetValidArray(formatted)
        },
        ShareWithFromArray: function (users) {
            var formatted, i, len, user
            formatted = []
            if (Manager.IsValid(users)) {
                for (i = 0, len = users.length; i < len; i++) {
                    user = users[i]
                    formatted.push(user != null ? user.value : void 0)
                }
            }
            return DatasetManager.GetValidArray(formatted)
        },
        ChildrenFromArray: function (children) {
            var child, formatted, i, len
            formatted = []
            if (Manager.IsValid(children)) {
                for (i = 0, len = children.length; i < len; i++) {
                    child = children[i]
                    formatted.push(child != null ? child.label : void 0)
                }
            }
            return DatasetManager.GetValidArray(formatted)
        },
    },
    // GET SELECTED
    GetSelected: {
        Reminders: function (reminders) {
            var i, len, options, reminder
            options = []
            if (Manager.IsValid(reminders)) {
                for (i = 0, len = reminders.length; i < len; i++) {
                    reminder = reminders[i]
                    options.push({
                        label: CalMapper.GetShortenedReadableReminderTime(reminder),
                        value: reminder,
                    })
                }
            }
            return options
        },
        Children: function (childNames) {
            var childName, i, len, options
            options = []
            if (Manager.IsValid(childNames)) {
                for (i = 0, len = childNames.length; i < len; i++) {
                    childName = childNames[i]
                    options.push({
                        label: StringManager.FormatTitle(childName),
                        value: childName,
                    })
                }
            }
            return options
        },
        ExpenseCategory: function (category) {
            if (!Manager.IsValid(category)) {
                return "Category"
            }
            return [
                {
                    label: category,
                    value: category,
                },
            ]
        },
        View: function (view) {
            if (!Manager.IsValid(view)) {
                return "Select View"
            }
            return [
                {
                    label: view,
                    value: view,
                },
            ]
        },
        ShareWith: async function (currentUser) {
            var account, i, len, options, ref, validAccounts
            options = []
            validAccounts = await DB_UserScoped.GetValidAccountsForUser(currentUser)
            if (Manager.IsValid(validAccounts)) {
                for (i = 0, len = validAccounts.length; i < len; i++) {
                    account = validAccounts[i]
                    if (Manager.IsValid(account) && (Manager.IsValid(account.userKey) || Manager.IsValid(account.key))) {
                        options.push({
                            value: account.key || account.userKey,
                            label:
                                (account != null ? account.name : void 0) ||
                                (account != null ? ((ref = account.general) != null ? ref.name : void 0) : void 0),
                        })
                    }
                }
            }
            return options
        },
        ShareWithFromKeys: function (accountKeys, users, labelsOnly = false, currentUserKey) {
            var i, key, len, options, user
            options = []
            accountKeys =
                accountKeys != null
                    ? accountKeys.filter(function (x) {
                          return x !== currentUserKey
                      })
                    : void 0
            if (Manager.IsValid(accountKeys) && Manager.IsValid(users)) {
                for (i = 0, len = accountKeys.length; i < len; i++) {
                    key = accountKeys[i]
                    user =
                        users != null
                            ? users.find((x) => {
                                  return (x != null ? x.key : void 0) === key
                              })
                            : void 0
                    if (Manager.IsValid(user)) {
                        options.push({
                            value: user != null ? user.key : void 0,
                            label: StringManager.GetFirstNameAndLastInitial(user != null ? user.name : void 0),
                        })
                    }
                }
            }
            if (labelsOnly) {
                return options.map((x) => {
                    return x != null ? x.label : void 0
                })
            }
            return options
        },
    },
    // GET DEFAULT
    GetDefault: {
        EventCategories: function () {
            var cat, i, j, len, len1, ref, results, value
            results = []
            for (i = 0, len = EventCategories.length; i < len; i++) {
                cat = EventCategories[i]
                ref = cat.types
                for (j = 0, len1 = ref.length; j < len1; j++) {
                    value = ref[j]
                    results.push({
                        label: value,
                        value: value,
                    })
                }
            }
            return results
        },
        ExpenseSortByTypes: function () {
            return [
                {
                    label: "Recently Added",
                    value: "recentlyAdded",
                },
                {
                    label: "Nearest Due Date",
                    value: "nearestDueDate",
                },
                {
                    label: "Oldest Creation Date",
                    value: "oldestCreationDate",
                },
                {
                    label: "Amount: High to Low",
                    value: "amountDesc",
                },
                {
                    label: "Amount: Low to High",
                    value: "amountAsc",
                },
                {
                    label: "Name (ascending)",
                    value: "nameAsc",
                },
                {
                    label: "Name (descending)",
                    value: "nameDesc",
                },
            ]
        },
        Holidays: async function () {
            var apiHolidays, holiday, i, len, options
            apiHolidays = await Apis.Dates.GetHolidays()
            options = []
            if (Manager.IsValid(apiHolidays)) {
                for (i = 0, len = apiHolidays.length; i < len; i++) {
                    holiday = apiHolidays[i]
                    if (
                        Manager.IsValid(
                            options.find((x) => {
                                return (x != null ? x.value : void 0) === (holiday != null ? holiday.date : void 0)
                            })
                        )
                    ) {
                        continue
                    }
                    if ((holiday != null ? holiday.name : void 0) === "Juneteenth National Independence Day") {
                        if (holiday != null) {
                            holiday.name = "Juneteenth"
                        }
                    }
                    if ((holiday != null ? holiday.name : void 0) === "Martin Luther King, Jr. Day") {
                        if (holiday != null) {
                            holiday.name = "MLK Jr. Day"
                        }
                    }
                    options.push({
                        label: holiday != null ? holiday.name : void 0,
                        value: holiday != null ? holiday.date : void 0,
                    })
                }
            }
            return options
        },
        ExpenseCategories: function () {
            var category, i, len, options, ref
            options = []
            ref = Object.keys(ExpenseCategories)
            for (i = 0, len = ref.length; i < len; i++) {
                category = ref[i]
                options.push({
                    value: category,
                    label: category,
                })
            }
            return options
        },
        ValueRecordTypes: function () {
            return [
                {
                    label: "Expenses",
                    value: "expenses",
                },
                {
                    label: "Chats",
                    value: "chats",
                },
            ]
        },
        Reminders: [
            {
                label: "5 Minutes",
                value: "fiveMinutes",
            },
            {
                label: "30 Minutes",
                value: "halfHour",
            },
            {
                label: "1 Hour",
                value: "hour",
            },
            {
                label: "At Event Time",
                value: "timeOfEvent",
            },
        ],
        ShareWith: function (children, coParents) {
            var childAccounts, merged, options, ref
            if (!(Manager.IsValid(children) || Manager.IsValid(coParents))) {
                return []
            }
            options = []
            childAccounts =
                (ref = children || []) != null
                    ? ref.filter(function (x) {
                          return x != null ? x.userKey : void 0
                      })
                    : void 0
            coParents = coParents || []
            merged = DatasetManager.CombineArrays(childAccounts, coParents)
            options = merged.map(function (x) {
                var ref1, ref2, ref3
                return {
                    label:
                        (ref1 = StringManager.GetFirstNameOnly(x != null ? ((ref2 = x.general) != null ? ref2.name : void 0) : void 0)) != null
                            ? ref1
                            : StringManager.GetFirstNameAndLastInitial(x != null ? x.name : void 0),
                    value: (ref3 = x != null ? x.userKey : void 0) != null ? ref3 : x != null ? x.key : void 0,
                }
            })
            return options
        },
        CoParents: function (users) {
            var i, len, options, user
            options = []
            if (Manager.IsValid(users)) {
                for (i = 0, len = users.length; i < len; i++) {
                    user = users[i]
                    options.push({
                        value: user != null ? user.userKey : void 0,
                        label: StringManager != null ? StringManager.UppercaseFirstLetterOfAllWords(user != null ? user.name : void 0) : void 0,
                    })
                }
            }
            return options
        },
        Children: function (children) {
            var child, i, len, options, ref
            options = []
            if (Manager.IsValid(children)) {
                for (i = 0, len = children.length; i < len; i++) {
                    child = children[i]
                    options.push({
                        label: StringManager.FormatTitle(child != null ? ((ref = child.general) != null ? ref.name : void 0) : void 0),
                        value: child != null ? child.id : void 0,
                    })
                }
            }
            return options
        },
    },
}

export default DropdownManager

//# sourceMappingURL=dropdownManager.js.map