import Manager from "./manager"

DomManager = {

  toggleActive: (element) ->
    if element.classList.contains("active")
      element.classList.remove("active")
    else
      element.classList.add('active')

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
    if Manager.isValid(el)
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
    if Manager.isValid(el)
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
}

export default DomManager