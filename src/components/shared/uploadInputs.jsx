// Path: src\components\shared\uploadInputs.jsx
import React, {useContext} from 'react'
import globalState from '../../context'

function UploadInputs({containerClass = '', getImages = (e) => {}, uploadType = 'document'}) {
  const {state, setState} = useContext(globalState)
  const {currentUser} = state

  const getUploadType = () => {
    if (uploadType === 'document') {
      return 'application/pdf,.doc,.docx,application/msword'
    } else {
      return 'image/*'
    }
  }

  return (
    <div id="upload-inputs" className={containerClass}>
      <div className="flex">
        <input onChange={getImages} multiple id="upload-input" name="file-upload" type="file" accept={getUploadType()} />
      </div>
    </div>
  )
}

export default UploadInputs