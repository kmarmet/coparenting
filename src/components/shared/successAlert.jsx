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
            showClass: {
                popup: `
                  animate__animated
                  animate__fadeInDown
                  animate__faster
                `,
            },
            hideClass: {
                popup: `
                  animate__animated
                  animate__fadeOutUp
                  animate__faster
                `,
            },
            position: 'top-end',
            timer: 2000,
            timerProgressBar: true,
            showConfirmButton: false,
            background: '#2ac08a',
            backdrop: false,
            padding: 0,
            borderRadius: '20px',
            allowOutsideClick: true,
            allowEscapeKey: false,
            allowEnterKey: false,
            // transform: 'translateY(70px)',
            // marginTop: '10px',
            customClass: {
                // container: 'sweet-alert-frost',
                // popup: 'sweet-alert-popup',
            },
            color: '#fff',
            didOpen: () => {
                const popup = Swal.getPopup()
                popup.style.marginTop = '150px'
                popup.style.transform = 'translateY(100px)'
            },
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