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
    ReminderOptions: (reminders) ->
      options = []
      if Manager.IsValid(reminders)
        for reminder in reminders
          options.push
            label: CalMapper.GetShortenedReadableReminderTime(reminder)
            value: reminder
      return options

    ShareWith: (names) ->
      options = []
      for name in names
        options.push
          value: name
          label: name
      return options

  GetDefault:
     ReminderOptions:
       [
         {label: "5 Minutes Before", value: "fiveMinutes",}
         {label: "30 Minutes Before", value: "halfHour",}
         {label: "1 Hour Before", value: "hour"}
         {label: "At Event Time", value: "timeOfEvent"}
       ]

     ShareWith: (shareWith) ->
       options = []
       if Manager.IsValid(shareWith)
         for user in shareWith
           options.push
             value: user?.key
             label: StringManager?.uppercaseFirstLetterOfAllWords(user?.name)
       return options

     Users: (users) ->
       options = []
       if Manager.IsValid(users)
         for user in users
           if user?.accountType == 'parent'
             options.push
               value:  user?.key
               label: StringManager?.uppercaseFirstLetterOfAllWords(user?.name)


           if user?.accountType == 'child'
             options.push
               value: user?.userKey
               label: StringManager?.uppercaseFirstLetterOfAllWords(user?.general?.name)

       return options

     GetSelectOptions: (optionsArray = [], isUsers = false, isStringsOnly = false, isReminders = false, isFormattedReminders = false) ->
      options = []
      if Manager.IsValid(optionsArray)
        for option in optionsArray
    # Users
          if isUsers
            if option?.accountType == 'parent'
              options.push
                value:  option?.key
                label: StringManager?.uppercaseFirstLetterOfAllWords(option?.name)


            if option?.accountType == 'child'
              options.push
                value: option?.userKey
                label: StringManager?.uppercaseFirstLetterOfAllWords(option?.general?.name)

    # Strings
          else if isStringsOnly
            options.push
              label: StringManager.uppercaseFirstLetterOfAllWords(option)
              value: option

      return options


export default SelectDropdownManager