import Manager from "./manager"
import DatasetManager from "./datasetManager"
import DB_UserScoped from "../database/db_userScoped"
import CalMapper from "../mappers/calMapper"
import DateManager from "./dateManager"

DomManager = {
  Animate:
    RemoveAnimationClasses: (classOfElementsToAnimate, classToRemove) ->
      if Manager.IsValid(classOfElementsToAnimate)
        classOfElementsToAnimate = document.querySelectorAll("#{classOfElementsToAnimate}")
        for element in classOfElementsToAnimate
          element.classList.remove(classToRemove)

    FadeInRight: (variableToCheck,  fastSlowOrDefault = "") ->
      if typeof variableToCheck == 'boolean'
        if (variableToCheck == true)
          return "animate__animated animate__fadeInRight #{Manager.IsValid(fastSlowOrDefault, true) ?  "animate__#{fastSlowOrDefault}" : ''}"
        else
          return 'animate__animated animate__fadeOut'
      if Manager.IsValid(variableToCheck)
        return "animate__animated animate__fadeInRight #{Manager.IsValid(fastSlowOrDefault, true) ?  "animate__#{fastSlowOrDefault}" : ''}"
      else
        return 'animate__animated animate__fadeOut'

    FadeInUp: (variableToCheck,  fastSlowOrDefault = "") ->
      if typeof variableToCheck == 'boolean'
        if (variableToCheck == true)
          return "animate__animated animate__fadeInUp #{Manager.IsValid(fastSlowOrDefault, true) ?  "animate__#{fastSlowOrDefault}" : ''}"
        else
          return 'animate__animated animate__fadeOutDown'
      if Manager.IsValid(variableToCheck)
        return "animate__animated animate__fadeInUp #{Manager.IsValid(fastSlowOrDefault, true) ?  "animate__#{fastSlowOrDefault}" : ''}"
      else
        return 'animate__animated animate__fadeOutDown'

    FadeInDown: (variableToCheck,  fastSlowOrDefault = "") ->
      if typeof variableToCheck == 'boolean'
        if (variableToCheck == true)
          return "animate__animated animate__fadeInDown #{Manager.IsValid(fastSlowOrDefault, true) ?  "animate__#{fastSlowOrDefault}" : ''}"
        else
          return 'animate__animated animate__fadeOutDown'
      if Manager.IsValid(variableToCheck)
        return "animate__animated animate__fadeInDown #{Manager.IsValid(fastSlowOrDefault, true) ?  "animate__#{fastSlowOrDefault}" : ''}"
      else
        return 'animate__animated animate__fadeOutDown'

    ZoomIn: (variableToCheck,  fastSlowOrDefault = "") ->
      if typeof variableToCheck == 'boolean'
        if (variableToCheck == true)
          return "animate__animated animate__zoomIn #{Manager.IsValid(fastSlowOrDefault, true) ?  "animate__#{fastSlowOrDefault}" : ''}"
        else
          return 'animate__animated animate__zoomOut'
      if Manager.IsValid(variableToCheck)
        return "animate__animated animate__zoomIn #{Manager.IsValid(fastSlowOrDefault, true) ?  "animate__#{fastSlowOrDefault}" : ''}"
      else
        return 'animate__animated animate__zoomOut'

    ZoomInDown: (variableToCheck,  fastSlowOrDefault = "") ->
      if typeof variableToCheck == 'boolean'
        if (variableToCheck == true)
          return "animate__animated animate__zoomInDown #{Manager.IsValid(fastSlowOrDefault, true) ?  "animate__#{fastSlowOrDefault}" : ''}"
        else
          return 'animate__animated animate__zoomOutDown'
      if Manager.IsValid(variableToCheck)
        return "animate__animated animate__zoomInDown #{Manager.IsValid(fastSlowOrDefault, true) ?  "animate__#{fastSlowOrDefault}" : ''}"
      else
        return 'animate__animated animate__zoomOutDown'

    FadeIn: (variableToCheck, fastSlowOrDefault = "") ->
      if Manager.IsValid(variableToCheck)
        return "animate__animated animate__fadeIn animate__#{fastSlowOrDefault}"
      else
        return 'animate__animated animate__fadeOut'

  AnimateDelayStyle: (index, delay = .2) ->
    return {animationDelay: "#{index * delay}s"}

  AnimateClasses:
    names:
      fadeInUp: 'fadeInUp'
      fadeInDown: 'fadeInDown'
      fadeInRight: 'fadeInRight'
      slideInLeft: 'slideInLeft'
      slideInRight: 'slideInRight'
      fadeIn: 'fadeIn'
      zoomIn: 'zoomIn'
      default: 'animate__animated'
      slow: 'animate__slow'
      faster: 'animate__faster'
      slower: 'animate__slower'
      zoomInDown: 'zoomInDown'

    zoomIn:
      enter: 'animate__zoomIn',
      exit: 'animate__zoomOut'

    zoomInDown:
      enter: 'animate__zoomInDown',
      exit: 'animate__zoomOutDown'

    fadeIn:
      enter: 'animate__fadeIn',
      exit: 'animate__fadeOut'

    slideInLeft:
      enter: 'animate__slideInLeft',
      exit: 'animate__slideOutLeft'

    slideInRight:
      enter: 'animate__slideInRight',
      exit: 'animate__slideOutRight'

    fadeInUp:
      enter: 'animate__fadeInUp',
      exit: 'animate__fadeOutDown'

    fadeInDown:
      enter: 'animate__fadeInDown',
      exit: 'animate__fadeOutUp'

    fadeInRight:
      enter: 'animate__fadeInRight',
      exit: 'animate__fadeOut'

  AddThemeToDatePickers: (currentUser) ->
    setTimeout ->
      datetimeParent = document.querySelector('.MuiDialog-root.MuiModal-root')
      if Manager.IsValid(datetimeParent)
        datetimeParent.classList.add(currentUser?.settings?.theme)
    , 100

  ToggleAnimation:(addOrRemove, itemsClass, animateName, delay = 80, slower=false) ->
    allMenuItems = document.querySelectorAll(".#{itemsClass}")

    AddClasses = (item) ->
      if addOrRemove is 'add' && Manager.IsValid(item)
        item.classList.add(DomManager.AnimateClasses[animateName].enter)
        if slower
          item.classList.add(DomManager.AnimateClasses.names.slow)
      else
        item.classList.add(DomManager.AnimateClasses[animateName].exit)

    if Manager.IsValid(allMenuItems)
      allMenuItems.forEach (item) ->
        item.classList.add('animate__animated')
        item.classList.remove(DomManager.AnimateClasses[animateName].exit)
        item.classList.remove(DomManager.AnimateClasses[animateName].enter)

      allMenuItems.forEach (item, index) ->
        if index == 0
          item.classList.add(DomManager.AnimateClasses[animateName].enter)
        else
          setTimeout ->
            AddClasses(item)
          , index * delay

  SetDefaultCheckboxes: (checkboxContainerClass, object, propName, isArray = false, values) ->
    # Share With
    if checkboxContainerClass == 'share-with'
      if Manager.IsValid(values)
        for phone in values
          document.querySelector(".#{checkboxContainerClass} [data-phone='#{phone}'] .box").classList.add('active')

    # Repeating
    if checkboxContainerClass == 'repeating'
      return await DateManager.GetRepeatingEvents(object)

    # Reminder Times
    if checkboxContainerClass == 'reminder-times'
      reminderIsValid = Manager.IsValid(values, true)
      reminderTimes = values
      if reminderIsValid
        for timeframe in reminderTimes
          box = document.querySelector("[data-label='#{CalMapper.readableReminderBeforeTimeframes(timeframe)}'] .box")
          if Manager.IsValid(box)
            box.classList.add('active')

  HandleCheckboxSelection: (element, onCheck, onCheckRemoval, canSelectAll = false) ->
    clickedEl = element
    checkboxes = clickedEl.parentNode
    checkboxWrappers = checkboxes.querySelectorAll('.checkbox-wrapper')
    label = clickedEl.dataset.label

    # CHECK
    if clickedEl.classList.contains('active')
      label = clickedEl.dataset.label

      # UNCHECK OTHERS
      unless canSelectAll
        for wrapper in checkboxWrappers
          thisLabel = wrapper.dataset.label
          if thisLabel isnt label
            wrapper.classList.remove('active')

      # CHECK
      if onCheck? then onCheck(label)

    # UNCHECK
    else if onCheckRemoval? then onCheckRemoval(label)

  HandleShareWithSelection: (e, currentUser, shareWith, refToUpdate) ->
    clickedEl = e.currentTarget
    key = e.currentTarget.dataset['key']
    updated = DatasetManager.ToggleInArray(refToUpdate?.current?.shareWith, key)
    DomManager.toggleActive(clickedEl)

    return DatasetManager.GetValidArray(updated)

  BuildCheckboxGroup: ({currentUser, labelType, defaultLabels = [], customLabelArray = [], labelProp, uidProp, predefinedType}) ->
    checkboxLabels = []
    checkboxGroup = []

    # PREDEFINED TYPES
    if Manager.IsValid(predefinedType)
      if predefinedType is 'coparents' and Manager.IsValid(currentUser?.coparents)
        checkboxLabels = DB_UserScoped.getCoparentObjArray(currentUser, currentUser?.coparents)

      if Manager.IsValid(checkboxLabels)
        for label in checkboxLabels
          checkboxGroup.push
            label: label['name']
            key: label['key']

        return checkboxGroup

    # CUSTOM LABELS
    if not Manager.IsValid(labelProp) and not Manager.IsValid(uidProp)
      if labelType and labelType is 'reminder-times'
        checkboxLabels = CalMapper.allUnformattedTimes()

      if labelType and labelType is 'children'
        checkboxLabels = currentUser?.children?.map (x) -> x?.general?.name

      if labelType and labelType is 'recurring-intervals'
        checkboxLabels = ['Daily', 'Weekly', 'Biweekly', 'Monthly']

      if labelType and labelType is 'record-types'
        checkboxLabels = ['Expenses', 'Chats']

      if labelType and labelType is 'visitation'
        checkboxLabels = ['50/50', 'Custom Weekends', 'Every Weekend', 'Every other Weekend']

      if labelType and labelType is 'expense-payers' and Manager.IsValid(currentUser.coparents)
        checkboxLabels = DatasetManager.GetValidArray ([...currentUser.coparents.map (x) -> x.name 'Me'])

      if not labelType and Manager.IsValid(customLabelArray)
        checkboxLabels = customLabelArray

    # ITERATE THROUGH LABELS
    if not Manager.IsValid(labelProp) and not Manager.IsValid(uidProp)
      if Manager.IsValid(checkboxLabels)
        for label in checkboxLabels
          isActive = false
          if Manager.IsValid(defaultLabels) and defaultLabels.includes(label)
            isActive = true
          if labelType and labelType is 'reminder-times'
            label = CalMapper.readableReminderBeforeTimeframes(label)
          if Manager.IsValid(label)
            checkboxGroup.push
              label: label
              key: label?.replaceAll(' ', '')
              isActive: isActive

    # ITERATE THROUGH OBJECTS
    else
      for obj in customLabelArray
        if Manager.IsValid(obj[labelProp]) and Manager.IsValid(obj[uidProp])
          checkboxGroup.push
            label: obj[labelProp]
            key: obj[uidProp]

    return DatasetManager.GetValidArray(checkboxGroup)

  setDefaultView: () ->
    activeModal = document.querySelector('#modal-wrapper.active')
    if activeModal
      allViews = activeModal.querySelectorAll('.view')
      if Manager.IsValid(allViews[0])
        allViews[0].click()
        allViews[0].classList.add('active')

  ScrollToTopOfPage: () ->
    window.scrollTo(0, 0)

  toggleActive: (element) ->
    element.classList.toggle("active")

  toggleAnimateClass: (element) ->
    if element.classList.contains("animate")
      element.classList.remove("animate")
    else
      element.classList.add('animate')

  hasClass: (element, className) ->
    if !element
      return false
    if element.classList.contains(className)
      true
    else
      false

  setErrorAlertRed: () ->
    text = document.getElementById('swal2-html-container')
    if text
      text.style.color = 'white'

  autoExpandingHeight: (e) ->
    textarea = e.target
    if Manager.IsValid textarea
      textarea?.style?.height = ''
      textarea?.style?.height = Math.min(textarea?.scrollHeight, 300) + 'px'

  unsetHeight: (e) ->
    element = e.target
    if Manager.IsValid element
      element?.style?.height = 'unset'

  isMobile: () -> window.screen.width < 801

  tapOrClick: (isUppercase = false) ->
    if !isUppercase
      if DomManager.isMobile() then return "tap"
      return "click"
    else
      if DomManager.isMobile() then return "Tap"
      return "Click"
  debounce: (callback, delay) ->
    timeout = null

    executedFunction = ->
      later = ->
        clearTimeout(timeout)
        callback()

      clearTimeout(timeout)
      timeout = setTimeout(later, delay)

    executedFunction

  isInViewport: (el) ->
    if Manager.IsValid(el)
      rect = el.getBoundingClientRect()
      rect.top >= 0 and rect.left >= 0 and
        rect.bottom <= (window.innerHeight or document.documentElement.clientHeight) and
        rect.right <= (window.innerWidth or document.documentElement.clientWidth)

  showInputLabels: (wrapperClass) ->
    inputs = wrapperClass.querySelectorAll('input,textarea')
    for input in inputs
      if (input)
        if input.value.length > 0 || input?.textContent.length > 0
          if !input.classList.contains("react-toggle-screenreader-only")
            if !input.classList.contains("MuiBase-input")
              parent = input.parentNode
              if parent
                parent.classList.add('active')
                labelWrapper = parent.querySelector("#label-wrapper")
                if labelWrapper
                  labelWrapper.classList.add("active")

  mostIsInViewport: (scrollWrapper, el) ->
    if Manager.IsValid(el)
      rect = el.getBoundingClientRect()
      scrollWrapperHeight = scrollWrapper.getBoundingClientRect().height
      pxCloseToEl =rect.top - scrollWrapperHeight;

      pxCloseToEl <= -170

  addScrollListener: (scrollableElement, callback, delay) ->
    scrollableElement.addEventListener 'scroll', DomManager.debounce  ->
      callback()
    , delay

  getSelectionText: ->
    text = ""
    if window.getSelection?
      text = window.getSelection().toString()
    else if document.selection? and document.selection.type != "Control"
      text = document.selection.createRange().text
    return text

  clearTextSelection: ->
    if window.getSelection
# Chrome
      if window.getSelection().empty
        window.getSelection().empty()
      else if window.getSelection().removeAllRanges
# Firefox
        window.getSelection().removeAllRanges()
    else if document.selection
# IE?
      document.selection.empty()

}

export default DomManager