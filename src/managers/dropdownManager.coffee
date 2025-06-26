import Manager from "./manager"
import StringManager from "./stringManager"
import CalMapper from "../mappers/calMapper"
import CalendarMapper from "../mappers/calMapper"
import DatasetManager from "./datasetManager"
import ExpenseCategories from "../constants/expenseCategories"
import ExpenseSortByTypes from "../constants/expenseSortByTypes"
import DB_UserScoped from "../database/db_userScoped"

DropdownManager =
# HELPERS
  GetReadableReminderTimes: (reminderTimes) ->
    readableTimes = []
    if Manager.IsValid(reminderTimes)
      for time in reminderTimes
        if Manager.IsValid(time, true)
          readableTimes.push(CalMapper.GetShortenedReadableReminderTime(time))
    return readableTimes

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
      validAccounts = await DB_UserScoped.getValidAccountsForUser(currentUser)
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
              value:  user?.key
              label: StringManager.GetFirstNameAndLastInitial(user?.name)

      if labelsOnly
        return options.map((x) => x?.label)

      return options

# GET DEFAULT
  GetDefault:
    ExpenseCategories: () ->
      options = []
      for category in Object.keys(ExpenseCategories)
        options.push
          value: category
          label: category
      return options

    ExpenseSortByTypes : () ->
      options = []
      if Manager.IsValid(ExpenseSortByTypes)
        for category in Object.keys(ExpenseSortByTypes)
          options.push

            value: category
            label: category
      return options

    Reminders:
      [
        {label: "5 Minutes Before", value: "fiveMinutes"}
        {label: "30 Minutes Before", value: "halfHour"}
        {label: "1 Hour Before", value: "hour"}
        {label: "At Event Time", value: "timeOfEvent"}
      ]


    ShareWith: (children, coParents) ->
      if Manager.IsValid(children) and Manager.IsValid(coParents)
        childAccounts = children.filter (x) -> x?.userKey
        merged = DatasetManager.CombineArrays(childAccounts, coParents)
        options = merged.map (x) -> {label: x?.general?.name or x?.name, value: x?.userKey or x?.key}

      return options

    CoParents: (users) ->
      options = []
      if Manager.IsValid(users)
        for user in users
          options.push
            value:  user?.userKey
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