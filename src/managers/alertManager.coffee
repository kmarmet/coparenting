import Swal from "sweetalert2"
import DomManager from "./domManager"

AlertManager = {
  ThreeButtonAlertConfig: {
    title: "",
    onConfirm: () =>,
    onDeny: () =>,
    onCancel: () =>,
    cancelButtonText: "Cancel",
    confirmButtonText: "Yes",
    denyButtonText: "Nvm",
    showThirdButton: false
  }

  throwError: (title, text) ->
    Swal.fire
      title: title
      text: text
      icon: 'error'
      customClass:
        container: 'sweet-alert-frost',
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
    
  successAlert: (message, allowOutsideClick = true) ->
    Swal.fire
      text: message
      icon: "success"
      timer: 1000
      showConfirmButton: false
      allowOutsideClick: allowOutsideClick
      customClass: 'banner'
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

  confirmAlert: ({title, confirmButtonText = "I'm Sure", denyButtonText = "Nevermind", showDenyButton=true, onConfirm = () =>, onDeny = () =>,bg = 'white', color ='black', html = "", theme = 'light'}={}) ->
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
      html: html
      color: color
      background: bg
      grow: true
      showDenyButton: showDenyButton
      showCancelButton: false
      confirmButtonText: confirmButtonText
      denyButtonText: denyButtonText
      confirmButtonColor: '#00b389'
      customClass:
        container: 'sweet-alert-frost'

    .then (result) ->
      if result.isConfirmed
        if onConfirm then onConfirm(result)
      if result.isDenied
        if onDeny then onDeny(result)
      return result

  oneButtonAlert: (title, subtitle = "", icon = "", onConfirm) ->
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
      customClass:
        container: 'sweet-alert-frost',
      showDenyButton: false
      showCancelButton: false
      confirmButtonText: "Okay"
      confirmButtonColor: '#00b389 !important'
      allowOutsideClick: false

    .then (result) ->
      if result.isConfirmed
        if onConfirm then onConfirm(result)

  inputAlert: (title, text, onConfirm, allowOutsideClick = true, showCancelButton = true, inputType = "text", bg = 'white', color = 'black') ->
    Swal.fire
      title: title
      text: text
      icon: ''
      input: inputType
      showCancelButton: showCancelButton
      confirmButtonText: "Confirm"
      allowOutsideClick: allowOutsideClick
      color:color,
      background: bg
      customClass:
        container: 'sweet-alert-frost',
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

  threeButtonAlert: (config) ->
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
      title: config.title
      showDenyButton: config.showThirdButton
      showCancelButton: true
      confirmButtonText: config.confirmButtonText
      denyButtonText: config.denyButtonText
      cancelButtonText: config.cancelButtonText
      confirmButtonColor: '#00b389 !important'
      customClass:
        container: 'sweet-alert-frost',
      allowOutsideClick: false

      .then (result) ->
        if result.isConfirmed
          if config.onConfirm then config.onConfirm(result)
        if result.isDismissed
          if config.onCancel then config.onCancel(result)
        if result.isDenied
          if config.onDeny then config.onDeny(result)
}

export default AlertManager