import Manager from "./manager"

DomManager = {
  hasClass: (element, className) ->
    if !element
      return false
    if element.classList.contains(className)
      true
    else
      false
  isInViewport: (el) ->
    if Manager.isValid(el)
      rect = el.getBoundingClientRect()

      rect.top >= 0 and
        rect.left >= 0 and
        rect.bottom <= (window.innerHeight or document.documentElement.clientHeight) and # or $(window).height()
        rect.right <= (window.innerWidth or document.documentElement.clientWidth) # or $(window).width()


}

export default DomManager