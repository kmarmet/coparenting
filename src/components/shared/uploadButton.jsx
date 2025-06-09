// Path: src\components\shared\uploadButton.jsx
import React, {useContext, useEffect} from 'react'
import globalState from '../../context'
import {GrAttachment} from 'react-icons/gr'
import Manager from '../../managers/manager'
import CardButton from './cardButton'

function UploadButton({containerClass = '', getImages = (e) => {}, uploadType = 'document', useAttachmentIcon = false}) {
  const {state, setState} = useContext(globalState)

  const GetUploadType = () => {
    if (uploadType === 'document') {
      return 'application/pdf,.doc,.docx,application/msword'
    } else {
      return 'image/*'
    }
  }

  const TriggerFileSelection = () => {
    const uploadInput = document.getElementById('upload-input')
    uploadInput.click()
  }

  useEffect(() => {
    const uploadInput = document.getElementById('upload-input')

    if (Manager.IsValid(uploadInput)) {
      uploadInput.addEventListener('change', function (event) {
        const selectedFile = event.target.files[0]
        // Handle the selected file here.
        if (selectedFile) {
          console.log('Selected file:', selectedFile)
          // You can now process the image file (e.g., display a preview, upload it, etc.)
        }
      })
    }
  }, [])

  return (
    <>
      {useAttachmentIcon && (
        <CardButton classes={'attachment-button'} onClick={TriggerFileSelection}>
          <GrAttachment className={'attachment-icon'} />
        </CardButton>
      )}
      {!useAttachmentIcon && (
        <div id="upload-inputs" className={containerClass}>
          <div className="flex">
            <input onChange={getImages} multiple id="upload-input" name="file-upload" type="file" accept={GetUploadType()} />
          </div>
        </div>
      )}
    </>
  )
}

export default UploadButton