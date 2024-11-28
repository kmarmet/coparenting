
DomManager = {
  hasClass: (element, className) ->
    if !element
      return false
    if element.classList.contains(className)
      true
    else
      false
}

export default DomManager