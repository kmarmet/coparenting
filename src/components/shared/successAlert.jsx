import React, {useContext, useEffect} from 'react'
import {IoClose} from 'react-icons/io5'
import Swal from 'sweetalert2'
import globalState from '../../context'
import Manager from '../../managers/manager'

const SuccessAlert = () => {
  const {state, setState} = useContext(globalState)
  const {successAlertMessage, authUser, currentScreen} = state

  useEffect(() => {
    if (!Manager.IsValid(successAlertMessage, true)) return
    let timerInterval
    Swal.fire({
      title: successAlertMessage,
      // html: successAlertMessage,
      position: 'top',
      timer: 2000,
      timerProgressBar: true,
      showConfirmButton: false,
      background: '#2ac08a',
      backdrop: false,
      padding: 0,
      allowOutsideClick: true,
      allowEscapeKey: false,
      allowEnterKey: false,
      customClass: {
        container: 'sweet-alert-frost',
      },
      color: '#fff',
      didOpen: () => {},
      willClose: () => {
        clearInterval(timerInterval)
      },
    }).then((result) => {
      /* Read more about handling dismissals below */
      if (result.dismiss === Swal.DismissReason.timer) {
      }
    })
    setTimeout(() => {
      setState({...state, successAlertMessage: ''})
    }, 2000)
  }, [successAlertMessage])

  return (
    <div id="success-alert-wrapper" className={`success-alert`}>
      <p className="success-alert-text">{successAlertMessage}</p>
      <IoClose className={'alert-close-icon'} />
    </div>
  )
}

export default SuccessAlert