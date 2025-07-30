import Manager from "./manager"
import StringManager from "./stringManager"
import CalMapper from "../mappers/calMapper"
import CalendarMapper from "../mappers/calMapper"
import DatasetManager from "./datasetManager"
import ExpenseCategories from "../constants/expenseCategories"
import DB_UserScoped from "../database/db_userScoped"
import Apis from "../api/apis"
import EventCategories from "../constants/eventCategories"

DropdownManager =
# HELPERS
  GetReadableReminderTimes: (reminderTimes) ->
    readableTimes = []
    if Manager.IsValid(reminderTimes)
      for time in reminderTimes
        if Manager.IsValid(time, true)
          readableTimes.push(CalMapper.GetShortenedReadableReminderTime(time))
    return readableTimes

  ToggleHiddenOnInputs: (hideOrShow = 'hide') ->
    activeFormCard = document.querySelector '.active.form-card'

    if not Manager.IsValid(activeFormCard)
      return

    formContainer = activeFormCard.querySelector '.content-wrapper .form-container'
    closeDropdownButton = activeFormCard?.querySelector '.close-dropdown-button'

    if Manager.IsValid(formContainer)
      if hideOrShow is 'hide'
        formContainer.classList.add('hidden')

        if Manager.IsValid(closeDropdownButton)
          closeDropdownButton.classList.add('active')
      else
        if Manager.IsValid(closeDropdownButton)
          closeDropdownButton.classList.remove('active')

        formContainer.classList.remove('hidden')

# MAPPERS
  MappedForDatabase:
    RemindersFromArray: (times) ->
      formatted = []
      if Manager.IsValid(times)
        for time in times
          formatted.push(CalendarMapper.GetReminderTimes(time?.value))

      return DatasetManager.GetValidArray(formatted)

    ShareWithFromArray: (users) ->
      formatted = []
      if Manager.IsValid(users)
        for user in users
          formatted.push(user?.value)

      return DatasetManager.GetValidArray(formatted)

    ChildrenFromArray: (children) ->
      formatted = []
      if Manager.IsValid(children)
        for child in children
          formatted.push(child?.label)
      return DatasetManager.GetValidArray(formatted)

# GET SELECTED
  GetSelected:
    Reminders: (reminders) ->
      options = []
      if Manager.IsValid(reminders)
        for reminder in reminders
          options.push
            label: CalMapper.GetShortenedReadableReminderTime(reminder)
            value: reminder
      return options

    Children: (childNames) ->
      options = []
      if Manager.IsValid(childNames)
        for childName in childNames
          options.push
            label: StringManager.FormatTitle(childName)
            value: childName
      return options

    ExpenseCategory: (category) ->
      if !Manager.IsValid(category)
        return 'Category'
      return [
        {label: category, value: category}
      ]

    View: (view) ->
      if !Manager.IsValid(view)
        return 'Select View'
      return [
        {label: view, value: view}
      ]

    ShareWith: (currentUser) ->
      options = []
      validAccounts = await DB_UserScoped.GetValidAccountsForUser(currentUser)
      if Manager.IsValid(validAccounts)
        for account in validAccounts
          if Manager.IsValid(account) and (Manager.IsValid(account.userKey) or Manager.IsValid(account.key))
            options.push
              value: account.key or account.userKey
              label: account?.name or account?.general?.name

      return options

    ShareWithFromKeys: (accountKeys, users, labelsOnly = false, currentUserKey) ->
      options = []
      accountKeys = accountKeys?.filter (x) -> x != currentUserKey
      if (Manager.IsValid(accountKeys) && Manager.IsValid(users))
        for key in accountKeys
          user = users?.find((x) => x?.key == key)

          if Manager.IsValid(user)
            options.push
              value: user?.key
              label: StringManager.GetFirstNameAndLastInitial(user?.name)

      if labelsOnly
        return options.map((x) => x?.label)

      return options

# GET DEFAULT
  GetDefault:
    EventCategories: () ->
      results = []
      for cat in EventCategories
        for value in cat.types
          results.push(label: value, value: value)
        
      return results

    ExpenseSortByTypes: () ->
      return [
        {label: "Recently Added", value: "recentlyAdded"},
        {label: "Nearest Due Date", value: "nearestDueDate"},
        {label: "Oldest Creation Date", value: "oldestCreationDate"},
        {label: "Amount: High to Low", value: "amountDesc"},
        {label: "Amount: Low to High", value: "amountAsc"},
        {label: "Name (ascending)", value: "nameAsc"},
        {label: "Name (descending)", value: "nameDesc"},
      ]
      
    Holidays: () ->
      apiHolidays = await Apis.Dates.GetHolidays()
      options = []

      if Manager.IsValid(apiHolidays)
        for holiday in apiHolidays
          if Manager.IsValid(options.find((x) => x?.value == holiday?.date))
            continue
            
          if holiday?.name == "Juneteenth National Independence Day"
            holiday?.name = "Juneteenth"
            
          if holiday?.name == "Martin Luther King, Jr. Day"
            holiday?.name = "MLK Jr. Day"
            
          options.push
            label: holiday?.name
            value: holiday?.date

      return options

    ExpenseCategories: () ->
      options = []
      for category in Object.keys(ExpenseCategories)
        options.push
          value: category
          label: category
      return options

    ValueRecordTypes: () ->
      return [{label: "Expenses", value: "expenses"}, {label: "Chats", value: "chats"}]


    Reminders:
      [
        {label: "5 Minutes", value: "fiveMinutes"}
        {label: "30 Minutes", value: "halfHour"}
        {label: "1 Hour", value: "hour"}
        {label: "At Event Time", value: "timeOfEvent"}
      ]

    ShareWith: (children, coParents) ->
      return [] unless Manager.IsValid(children) or Manager.IsValid(coParents)
      options = []
      childAccounts = (children or [])?.filter (x) -> x?.userKey
      coParents = coParents or []

      merged = DatasetManager.CombineArrays(childAccounts, coParents)

      options = merged.map (x) ->
        label: StringManager.GetFirstNameOnly(x?.general?.name) ? StringManager.GetFirstNameAndLastInitial(x?.name)
        value: x?.userKey ? x?.key

      return options

    CoParents: (users) ->
      options = []
      if Manager.IsValid(users)
        for user in users
          options.push
            value: user?.userKey
            label: StringManager?.UppercaseFirstLetterOfAllWords(user?.name)

      return options

    Children: (children) ->
      options = []
      if Manager.IsValid(children)
        for child in children
          options.push
            label: StringManager.FormatTitle(child?.general?.name)
            value: child?.id

      return options

export default DropdownManager