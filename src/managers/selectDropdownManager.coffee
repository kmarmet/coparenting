import Manager from "./manager"
import StringManager from "./stringManager"
import CalMapper from "../mappers/calMapper"

SelectDropdownManager =
  GetReadableReminderTimes: (reminderTimes) ->
    readableTimes = []
    if Manager.IsValid(reminderTimes)
      for time in reminderTimes
        if Manager.IsValid(time, true)
          readableTimes.push(CalMapper.GetShortenedReadableReminderTime(time))
    return readableTimes

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

    ShareWith: (accountsFromKeys) ->
      options = []
      if Manager.IsValid(accountsFromKeys)
        for user in accountsFromKeys
          options.push
            value:  user?.key
            label: StringManager.GetFirstNameAndLastInitial(user?.name)
      return options

    ShareWithFromKeys: (accountKeys, users, labelsOnly = false) ->
      options = []

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

  GetDefault:
     Reminders:
       [
         {label: "5 Minutes Before", value: "fiveMinutes"}
         {label: "30 Minutes Before", value: "halfHour"}
         {label: "1 Hour Before", value: "hour"}
         {label: "At Event Time", value: "timeOfEvent"}
       ]

     ShareWith: (shareWith) ->
       options = []
       if Manager.IsValid(shareWith)
         for user in shareWith
           options.push
             value: user?.key
             label: StringManager?.UppercaseFirstLetterOfAllWords(user?.name)
       return options

     CoParents: (users) ->
       options = []
       if Manager.IsValid(users)
         for user in users
           options.push
             value:  user?.key
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

export default SelectDropdownManager