// Generated by CoffeeScript 2.7.0
var AlertManager;

import Swal from "sweetalert2";

AlertManager = {
  throwError: function(title, text) {
    return Swal.fire({
      title: title,
      text: text,
      icon: 'error',
      showClass: {
        popup: `animate__animated
animate__fadeInUp
animate__faster`
      },
      hideClass: {
        popup: `animate__animated
animate__fadeOutDown
animate__faster`
      }
    });
  },
  successAlert: function(message, allowOutsideClick = true) {
    return Swal.fire({
      text: message,
      icon: "success",
      timer: 1500,
      showConfirmButton: false,
      allowOutsideClick: allowOutsideClick,
      showClass: {
        popup: `animate__animated
animate__fadeInUp
animate__faster`
      },
      hideClass: {
        popup: `animate__animated
animate__fadeOutDown
animate__faster`
      }
    });
  },
  confirmAlert: function(title, confirmButtonText = "I'm Sure", showNevermindButton = true, onConfirm, onDeny) {
    return Swal.fire({
      showClass: {
        popup: `animate__animated
animate__fadeInUp
animate__faster`
      },
      hideClass: {
        popup: `animate__animated
animate__fadeOutDown
animate__faster`
      },
      title: title,
      showDenyButton: showNevermindButton,
      showCancelButton: false,
      confirmButtonText: confirmButtonText,
      denyButtonText: "Nevermind",
      confirmButtonColor: '#00b389 !important'
    }).then(function(result) {
      if (result.isConfirmed) {
        if (onConfirm) {
          onConfirm(result);
        }
      }
      if (result.isDenied) {
        if (onDeny) {
          onDeny(result);
        }
      }
      return result;
    });
  },
  oneButtonAlert: function(title, subtitle = "", icon = "", onConfirm) {
    return Swal.fire({
      showClass: {
        popup: `animate__animated
animate__fadeInUp
animate__faster`
      },
      hideClass: {
        popup: `animate__animated
animate__fadeOutDown
animate__faster`
      },
      title: title,
      text: subtitle,
      icon: icon,
      showDenyButton: false,
      showCancelButton: false,
      confirmButtonText: "Okay",
      confirmButtonColor: '#00b389 !important',
      allowOutsideClick: false
    }).then(function(result) {
      if (result.isConfirmed) {
        if (onConfirm) {
          return onConfirm(result);
        }
      }
    });
  },
  inputAlert: function(title, text, onConfirm, allowOutsideClick = true, showCancelButton = true, inputType = "input") {
    return Swal.fire({
      title: title,
      text: text,
      icon: '',
      input: inputType,
      showCancelButton: showCancelButton,
      confirmButtonText: "Confirm",
      allowOutsideClick: allowOutsideClick,
      showClass: {
        popup: `animate__animated
animate__fadeInUp
animate__faster`
      },
      hideClass: {
        popup: `animate__animated
animate__fadeOutDown
animate__faster`
      }.then(function(result) {
        if (result.isConfirmed) {
          if (onConfirm) {
            return onConfirm(result);
          }
        }
      })
    });
  }
};

export default AlertManager;

//# sourceMappingURL=alertManager.js.map