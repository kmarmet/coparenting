import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../../context'
import DB from '../../../database/DB'
import Manager from '../../../managers/manager'
import ScreenNames from '../../../constants/screenNames'
import SignaturePad from 'signature_pad'
import FirebaseStorage from '../../../database/firebaseStorage'
import moment from 'moment'
import CheckboxGroup from '../../../components/shared/checkboxGroup'
import DateFormats from '../../../constants/dateFormats'
import domtoimage from 'dom-to-image'
import ChatRecoveryRequest from '../../../models/chat/chatRecoveryRequest'
import ImageManager from '../../../managers/imageManager'
import NavBar from '../../navBar'
import InputWrapper from '../../shared/inputWrapper'
import InputSuggestion from '../../../models/inputSuggestion'
import InputSuggestionWrapper from '../../shared/inputSuggestionWrapper'
import AlertManager from '../../../managers/alertManager'

function ChatRecovery() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [reason, setReason] = useState('')
  const [coparentPhone, setCoparentPhone] = useState('')
  const [signaturePad, setSignaturePad] = useState(null)
  const [viewConvo, setViewConvo] = useState(false)
  const [messageType, setMessageType] = useState('all')
  const [convoMessages, setConvoMessages] = useState([])
  const [inputSuggestions, setInputSuggestions] = useState([])
  const [signatureUrl, setSignatureUrl] = useState('')
  const [convoImageUrl, setConvoImageUrl] = useState('')
  const [refreshKey, setRefreshKey] = useState(Manager.getUid())
  const submit = async () => {
    if (reason.length === 0) {
      AlertManager.throwError('Please provide a reason for recovering this deleted conversation')
      return false
    }
    if (signaturePad && signaturePad.isEmpty()) {
      AlertManager.throwError('Please draw your signature')
      return false
    }
    if (coparentPhone.length === 0) {
      AlertManager.throwError('Please enter the phone number of the co-parent you were chatting with')
      return false
    }
    setViewConvo(true)

    const newSuggestion = new InputSuggestion()
    newSuggestion.ownerPhone = currentUser?.phone
    newSuggestion.formName = 'archived-chat'
    newSuggestion.suggestion = coparentPhone
    await DB.addSuggestion(newSuggestion)
    await setMessagesToLoop()
  }

  const setMessagesToLoop = async () => {
    setState({ ...state, isLoading: true })
    setViewConvo(true)
    const signatureImage = new Image()
    signatureImage.id = 'pic'
    let scopedChat
    let archivedChats = await DB.getTable(`${DB.tables.archivedChats}/${currentUser?.phone}`)
    archivedChats = archivedChats.filter((r) => r)

    if (Manager.isValid(archivedChats)) {
      for (let chat of archivedChats) {
        const memberPhones = chat?.members?.map((x) => x.phone)
        if (memberPhones?.includes(currentUser?.phone) && memberPhones?.includes(coparentPhone)) {
          scopedChat = chat
          break
        }
      }
    }

    // Error if no scoped chat
    if (!Manager.isValid(scopedChat) || scopedChat[0]?.messages?.length === 0) {
      AlertManager.throwError('We could not find an archived chat with the details provided.')
      setViewConvo(false)
      setState({ ...state, isLoading: false })
      return false
    } else {
      let messages = scopedChat.messages
      messages = Manager.convertToArray(messages)

      if (messageType === 'Bookmarked') {
        messages = messages.filter((x) => x.bookmarked === true)
      }

      setConvoMessages(messages)

      setTimeout(() => {
        createImage()
      }, 1000)

      setState({ ...state, isLoading: false })
      document.querySelector('.conversation-container').style.display = 'block'

      const signaturePadImage = FirebaseStorage.base64ToImage(signaturePad.toDataURL(), 'signature.jpg')
      await FirebaseStorage.uploadChatRecoverySignature(scopedChat.id, signaturePadImage).finally(async (img) => {})
      await FirebaseStorage.getSingleFileUrl(FirebaseStorage.directories.chatRecoveryRequests, scopedChat.id, 'signature.jpg').then(async (url) => {
        if (url && url !== undefined && url.length > 0) {
          const chatRecoveryRequest = new ChatRecoveryRequest()
          chatRecoveryRequest.id = scopedChat.id
          chatRecoveryRequest.members = scopedChat.members
          chatRecoveryRequest.signatureImageUrl = url
          chatRecoveryRequest.timestamp = moment().format(DateFormats.fullDatetime)
          chatRecoveryRequest.createdBy = currentUser?.email
          chatRecoveryRequest.reason = reason

          setSignatureUrl(url)

          // Add to Database
          await DB.add(DB.tables.chatRecoveryRequests, chatRecoveryRequest)
        }
      })
    }
  }

  const saveImageLocal = () => ImageManager.saveImageFromUrl('#image-wrapper', convoImageUrl, 'Chats Recovery Chats')

  const handleMessageTypeSelection = async (e) => {
    Manager.handleCheckboxSelection(
      e,
      (e) => {
        setMessageType(e)
      },
      (e) => {},
      false
    )
  }

  const createImage = () => {
    const imageWrapper = document.getElementById('image-wrapper')
    const readableHtmlWrapper = document.getElementById('readable-html-wrapper')

    domtoimage
      .toPng(readableHtmlWrapper)
      .then(function (dataUrl) {
        const img = new Image()
        img.src = dataUrl
        setConvoImageUrl(dataUrl)
        imageWrapper.appendChild(img)
      })
      .catch(function (error) {
        console.error('oops, something went wrong!', error)
      })
  }

  useEffect(() => {
    Manager.showPageContainer()
    const signaturePadElement = document.querySelector('.signature-pad')
    if (signaturePadElement) {
      const sigPad = new SignaturePad(signaturePadElement, {
        backgroundColor: 'white',
      })
      setSignaturePad(sigPad)
    }
    document.querySelector('.conversation-container').style.display = 'none'
  }, [])

  return (
    <>
      {!viewConvo && (
        <>
          <div id="chat-request-container" className={`${theme} page-container form`}>
            <p className="screen-title">Chat Recovery</p>
            <div className="form">
              {/* PHONE */}
              <div className="title-suggestion-wrapper">
                <InputWrapper
                  inputType={'input'}
                  inputValueType="number"
                  required={true}
                  labelText={'Phone Number of Chats Co-parent'}
                  onChange={async (e) => {
                    const inputValue = e.target.value
                    if (inputValue.length > 1) {
                      const dbSuggestions = await DB.getTable(DB.tables.suggestions)
                      const matching = dbSuggestions.filter(
                        (x) =>
                          x.formName === 'archived-chat' &&
                          x.ownerPhone === currentUser?.phone &&
                          Manager.contains(x.suggestion.toLowerCase(), inputValue)
                      )
                      setInputSuggestions(Manager.getUniqueArray(matching).flat())
                    } else {
                      setInputSuggestions([])
                    }
                    setCoparentPhone(inputValue)
                  }}></InputWrapper>
                <InputSuggestionWrapper
                  suggestions={inputSuggestions}
                  setSuggestions={() => setInputSuggestions([])}
                  onClick={(e) => {
                    const suggestion = e.target.textContent
                    setCoparentPhone(suggestion)
                    setInputSuggestions([])
                    document.querySelector('.coparent-phone').value = suggestion
                  }}></InputSuggestionWrapper>
              </div>
              {/* REASON */}
              <InputWrapper
                inputType={'textarea'}
                refreshKey={refreshKey}
                required={true}
                labelText={'Reason for Recovery'}
                onChange={(e) => setReason(e.target.value)}
              />

              {/* CONVERSATION TYPE */}
              <CheckboxGroup
                parentLabel="Which types of messages would you like to see and/or download?"
                defaultLabel={'All'}
                onCheck={handleMessageTypeSelection}
                checkboxLabels={['All', 'Bookmarked Only']}
                skipNameFormatting={true}
              />

              {/* DISCLAIMER/LEGAL TEXT */}
              <p className="mb-10">
                Please provide your signature below to provide self-identification, in the event that the messages are used for legal purposes.
              </p>
              <p className="mb-20">
                <i>
                  I, {currentUser?.name}, agree and understand that by signing the Electronic Signature Acknowledgment and Consent Form, that all
                  electronic signatures are the legal equivalent of my manual/handwritten signature and I consent to be legally bound to this
                  agreement.
                </i>
              </p>

              {/* SIGNATURE PAD */}
              <canvas className="signature-pad mb-20"></canvas>
              <button className="button default center mb-10 w-60" onClick={() => signaturePad.clear()}>
                Reset Signature Pad
              </button>

              {/* VIEW MESSAGES BUTTON */}
              {reason.length > 0 && coparentPhone.length > 0 && (
                <button className="button default green center w-60" onClick={submit}>
                  View Messages
                  <span className="material-icons-outlined">visibility</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
      <div className="conversation-container">
        <div id="chat-request-container" className={`${theme} page-container active form`}>
          <p className="mb-15">
            If you require a copy (image) of the signature applied when requesting this chat, or the date and time, please{' '}
            <span className="link" onClick={() => setState({ ...state, currentScreen: ScreenNames.contactSupport })}>
              <u>send us an email</u>
            </span>
            .
          </p>
          {/* CONVO IMAGE */}
          <label>Below is an image of the entire conversation</label>
          <div id="image-wrapper" className="mt-5"></div>
          <button className="button default w-50 center mb-20" onClick={saveImageLocal}>
            Download Image
          </button>

          {/* HTML TO READABLE TEXT */}
          <label className="mb-5">Below is the entire conversation</label>
          <div id="readable-html-wrapper">
            {Manager.isValid(convoMessages) &&
              convoMessages.map((message, index) => {
                return (
                  <div className="convo-message" key={index}>
                    <p id="message">{message.message}</p>
                    <p id="sender">From: {message.sender.contains(currentUser?.name) ? 'Me' : message.sender}</p>
                    <p id="timestamp">{moment(message.timestamp, 'MM/DD/yyyy hh:mma').format(DateFormats.readableDatetime)}</p>
                  </div>
                )
              })}
          </div>
        </div>
      </div>
      <NavBar navbarClass={'calendar no-add-new-button'}></NavBar>
    </>
  )
}

export default ChatRecovery