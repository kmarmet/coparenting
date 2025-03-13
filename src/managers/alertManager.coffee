import Swal from "sweetalert2"
import DomManager from "./domManager"

AlertManager = {
  throwError: (title ,text) ->

    Swal.fire
      title: title
      text: text
      icon: 'error'
      showClass:
        popup: """
            animate__animated
            animate__fadeInUp
            animate__faster
          """
      hideClass:
        popup: """
            animate__animated
            animate__fadeOutDown
            animate__faster
          """
    DomManager.setErrorAlertRed()
    return false
  successAlert : (message, allowOutsideClick = true) ->
    Swal.fire
      text: message
      icon: "success"
      timer: 1500
      showConfirmButton: false
      allowOutsideClick: allowOutsideClick
      showClass:
        popup: """
                animate__animated
                animate__fadeInUp
                animate__faster
              """
      hideClass:
        popup: """
                animate__animated
                animate__fadeOutDown
                animate__faster
              """

  confirmAlert : (title, confirmButtonText = "I'm Sure", showNevermindButton = true, onConfirm, onDeny) ->
    Swal.fire
      showClass:
        popup: """
              animate__animated
              animate__fadeInUp
              animate__faster
            """
      hideClass:
        popup: """
              animate__animated
              animate__fadeOutDown
              animate__faster
            """
      title: title
      showDenyButton: showNevermindButton
      showCancelButton: false
      confirmButtonText: confirmButtonText
      denyButtonText: "Nevermind"
      confirmButtonColor: '#00b389 !important'
    .then (result) ->
      if result.isConfirmed
        if onConfirm then onConfirm(result)
      if result.isDenied
        if onDeny then onDeny(result)
      return result

  oneButtonAlert : (title, subtitle = "", icon ="", onConfirm) ->
    Swal.fire
      showClass:
        popup: """
              animate__animated
              animate__fadeInUp
              animate__faster
            """
      hideClass:
        popup: """
              animate__animated
              animate__fadeOutDown
              animate__faster
            """
      title: title
      text: subtitle
      icon: icon
      showDenyButton: false
      showCancelButton: false
      confirmButtonText: "Okay"
      confirmButtonColor: '#00b389 !important'
      allowOutsideClick: false
    .then (result) ->
      if result.isConfirmed
        if onConfirm then onConfirm(result)

  inputAlert : (title, text, onConfirm, allowOutsideClick = true, showCancelButton = true, inputType = "text") ->
    Swal.fire
      title: title
      text: text
      icon: ''
      input: inputType
      showCancelButton: showCancelButton
      confirmButtonText: "Confirm"
      allowOutsideClick: allowOutsideClick
      showClass:
        popup: """
              animate__animated
              animate__fadeInUp
              animate__faster
            """
      hideClass:
        popup: """
              animate__animated
              animate__fadeOutDown
              animate__faster
            """
    .then (result) ->
      if result.isConfirmed
        if onConfirm then onConfirm(result)
}

export default AlertManager