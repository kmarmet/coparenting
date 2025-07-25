// Path: src\components\shared\uploadButton.jsx
import React, {useContext, useRef, useState} from "react"
import {GrAttachment} from "react-icons/gr"
import ButtonThemes from "../../constants/buttonThemes"
import globalState from "../../context"
import Manager from "../../managers/manager"
import StringManager from "../../managers/stringManager"
import Button from "./button"
import CardButton from "./cardButton"
import Spacer from "./spacer"

function UploadButton({
      containerClass = "",
      getSelectedImages = (e) => {},
      uploadType = "document",
      useAttachmentIcon = false,
      callback = (selectedFile) => {},
      buttonText = "Choose Images",
      allowMultiple = false,
}) {
      const {state, setState} = useContext(globalState)
      const [fileName, setFileName] = useState("No File Selected")
      const [fileSelected, setFileSelected] = useState(false)

      const fileInputRef = useRef(null)

      const TriggerFileSelection = () => fileInputRef.current?.click()

      const ReturnImages = (event) => {
            const selectedFile = fileInputRef.current?.files?.[0]
            if (!selectedFile) return

            setFileSelected(true)
            setFileName(selectedFile?.name)

            // Trigger callback if provided
            if (callback) callback({selectedFile, fileName: selectedFile.name, size: selectedFile.size})
      }

      const GetUploadType = () => {
            if (uploadType?.toLowerCase() === "document") {
                  return "application/pdf,.doc,.docx,application/msword"
            } else {
                  return "image/*"
            }
      }

      return (
            <>
                  {useAttachmentIcon && (
                        <CardButton classes={"attachment-button"} onClick={TriggerFileSelection}>
                              <GrAttachment className={"attachment-icon"} />
                        </CardButton>
                  )}

                  {/* Hidden File Input */}
                  <input
                        ref={fileInputRef}
                        onChange={ReturnImages}
                        multiple={allowMultiple}
                        name="file-upload"
                        type="file"
                        accept={GetUploadType()}
                        style={{display: "none"}}
                  />

                  {!useAttachmentIcon && (
                        <div id="upload-inputs" className={containerClass}>
                              {/* Upload Button */}
                              <Button text={buttonText} theme={ButtonThemes.white} classes="upload-button" onClick={TriggerFileSelection} />

                              <Spacer height={10} />
                              {Manager.IsValid(fileName, true) && (
                                    <p className={`${fileSelected ? "file-name active" : "file-name"}`}>
                                          {StringManager.removeFileExtension(StringManager.FormatTitle(fileName.replaceAll("_", " "), true))}
                                    </p>
                              )}
                        </div>
                  )}
            </>
      )
}

export default UploadButton