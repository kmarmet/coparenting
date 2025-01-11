import Manager from "./manager"

DomManager = {
  hasClass: (element, className) ->
    if !element
      return false
    if element.classList.contains(className)
      true
    else
      false

  isMobile: () -> window.screen.width < 800

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
      rect.bottom <= (window.innerHeight or document.documentElement.clientHeight) and # or $(window).height()
      rect.right <= (window.innerWidth or document.documentElement.clientWidth) # or $(window).width()

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