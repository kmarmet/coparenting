import React, { useContext, useEffect } from 'react'
import ScreenNames from '@screenNames'
import globalState from '../../../context'
import FirebaseStorage from '../../../database/firebaseStorage'
import UploadInputs from '@shared/uploadInputs'
export default function UploadLegalDoc() {
  const { state, setState } = useContext(globalState)
  const { currentUser } = state

  const upload = async () => {
    const imgs = document.querySelector('#upload-input').files
    if (imgs.length === 0) {
      setState({ ...state, showAlert: true, alertMessage: 'Please choose an image', alertType: 'error' })
    } else {
      if (Object.entries(imgs).map((x) => x[1].name.includes('.doc'))[0] === true) {
        setState({ ...state, showAlert: true, alertMessage: 'Uploaded file MUST be an image', alertType: 'error' })
      } else {
        await FirebaseStorage.uploadMultiple(`${FirebaseStorage.directories.documents}/`, currentUser.id, imgs).then(() => {
          setState({ ...state, currentScreenTitle: 'Legal Documents', currentScreen: ScreenNames.legalDocs })
        })
      }
    }
  }

  useEffect(() => {
    setState({ ...state, currentScreenTitle: 'Upload Agreement', previousScreen: ScreenNames.documents })
    if (document.querySelector('.page-container')) {
      setTimeout(() => {
        document.querySelector('.page-container').classList.add('active')
      }, 100)
    }
  }, [])

  return (
    <div id="upload-legal-doc-container" className={`${currentUser?.settings?.theme} page-container form`}>
      <p>
        Upload documents (.pdf, .doc, .docx, etc.) , or images of dissolution/divorce/separation agreement documents you would like to save or share
        with a coparent.
      </p>

      <p>If you have documents as images, please visit the link below to convert them to images for free.</p>
      <a href="https://convertio.co/doc-jpg/" target="_blank">
        Convert pdf/doc to image <span className="material-icons-round">open_in_new</span>
      </a>
      <br />
      <p>
        Once you have converted and downloaded the images to your device, you can upload them here. Or, if your documents are not images, simply
        upload them.
      </p>
      <p>Then you will be able to view your agreement, with a full table of contents</p>
      <div className="flex">{<UploadInputs upload={upload} />}</div>
    </div>
  )
}
