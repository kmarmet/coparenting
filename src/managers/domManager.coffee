
DomManager = {
  hasClass: (element, className) ->
    if element.classList.contains(className)
      true
    else
      false
}

export default DomManager