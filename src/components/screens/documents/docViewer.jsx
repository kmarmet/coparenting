import InputWrapper from '/src/components/shared/inputWrapper'
import Modal from '/src/components/shared/modal'
import ScreenNames from '/src/constants/screenNames'
import DB from '/src/database/DB'
import AlertManager from '/src/managers/alertManager'
import DocumentConversionManager from '/src/managers/documentConversionManager'
import DomManager from '/src/managers/domManager'
import Manager from '/src/managers/manager'
import StringManager from '/src/managers/stringManager'
import DocumentHeader from '/src/models/documentHeader'
import debounce from 'debounce'
import LightGallery from 'lightgallery/react'
import 'lightgallery/css/lightgallery.css'
import _ from 'lodash'
import React, {useContext, useEffect, useState} from 'react'
import {FaLightbulb} from 'react-icons/fa6'
import {HiDotsHorizontal} from 'react-icons/hi'
import {IoIosArrowUp} from 'react-icons/io'
import {IoClose, IoListOutline} from 'react-icons/io5'
import {MdDriveFileRenameOutline} from 'react-icons/md'
import {TbFileSearch} from 'react-icons/tb'
import searchTextHL from 'search-text-highlight'
import InputTypes from '../../../constants/inputTypes'
import globalState from '../../../context'
import useCurrentUser from '../../../hooks/useCurrentUser'
import useDocuments from '../../../hooks/useDocuments'
import DatasetManager from '../../../managers/datasetManager.coffee'
import NavBar from '../../navBar'
import Label from '../../shared/label.jsx'
import ScreenActionsMenu from '../../shared/screenActionsMenu'

export default function DocViewer() {
  const predefinedHeaders = DocumentConversionManager.tocHeaders
  const {state, setState} = useContext(globalState)
  const {theme, docToView, currentScreen} = state
  const [tocHeaders, setTocHeaders] = useState([])
  const [showToc, setShowToc] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [imgUrl, setImgUrl] = useState('')
  const [docType, setDocType] = useState('document')
  const [showTips, setShowTips] = useState(false)
  const [showRenameFile, setShowRenameFile] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [sideMenuIsOpen, setSideMenuIsOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [shouldHideSidebar, setShouldHideSidebar] = useState(true)
  const {currentUser, currentUserIsLoading} = useCurrentUser()
  const {documents, documentsAreLoading} = useDocuments()

  const ScrollToHeader = (hashedHeader) => {
    const domHeader = document.querySelector(`#doc-text [data-hashed-header="${hashedHeader}"]`)
    if (domHeader) {
      setTimeout(() => {
        if (domHeader) {
          domHeader.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          })
        }
      }, 300)
    }
  }

  const OnLoad = async () => {
    const fileType = `.${StringManager.GetFileExtension(docToView.name)}`.toLowerCase()
    const nonImageFileTypes = ['.docx', '.doc', '.pdf', '.odt', '.txt']
    if (currentUser && nonImageFileTypes.includes(fileType)) {
      setDocType('document')
      await FormatDocument()
    } else {
      setDocType('image')
      await FormatImageDocument()
    }
  }

  const SetTableOfContentsHeaders = async () => {
    let userHeaders = await DB.getTable(`${DB.tables.documentHeaders}/${currentUser?.key}`)
    let headersInDocument = []

    if (!userHeaders) {
      userHeaders = predefinedHeaders
    } else {
      userHeaders = userHeaders?.map((x) => x.headerText)
    }

    const domHeaders = document.querySelectorAll('.header')
    if (Manager.isValid(domHeaders)) {
      // Loop through DOM headers
      for (let header of domHeaders) {
        let headerTextElement = header.querySelector('.header-text')
        // Add header event listeners
        header.addEventListener('click', DeleteHeader)

        // Get header text
        if (!headerTextElement) {
          headerTextElement = header.textContent.trim()
        } else {
          headerTextElement = headerTextElement.textContent.trim()
          if (!_.isEmpty(headerTextElement) && StringManager.GetWordCount(headerTextElement) <= 10) {
            // Add header to headersInDocument
            if (!headersInDocument.includes(headerTextElement)) {
              headersInDocument.push(Manager.generateHash(headerTextElement))
            }
          }
        }
      }
    }
    const userHeadersMatchingHeadersInDocument = userHeaders.filter((x) => headersInDocument.includes(x))
    let allHeaders = []

    if (Manager.isValid(userHeadersMatchingHeadersInDocument)) {
      allHeaders = userHeadersMatchingHeadersInDocument
    } else {
      allHeaders = headersInDocument
    }
    setTocHeaders(DatasetManager.getUniqueArray(allHeaders, true))
  }

  const Search = async () => {
    if (Manager.isValid(searchValue, true)) {
      const docText = document.getElementById('doc-text')
      let textAsHtml = docText.innerHTML
      textAsHtml = searchTextHL.highlight(textAsHtml, searchValue)
      textAsHtml = textAsHtml.replaceAll('<span class=" text-highlight"="', '')
      docText.innerHTML = textAsHtml
      setShowSearch(false)
      setTimeout(() => {
        let headers = docText.querySelectorAll('.header')
        for (let header of headers) {
          if (header.textContent.includes(searchValue.toUpperCase())) {
            header.textContent = header.textContent.replace('">', '')
            header.textContent = header.textContent.replace(searchValue, '')
            const childSpan = header.querySelector('span')
            if (childSpan) {
              childSpan.remove()
            }
            const dataHeader = header.dataset.header
            if (dataHeader) {
              const cleanHeader = dataHeader.replaceAll('<span class=', '')
              header.setAttribute('data-header', cleanHeader.trim())
            }
          }
        }
      }, 500)
    } else {
      AlertManager.throwError('Please enter a search value')
      return false
    }
  }

  const FormatImageDocument = async () => {
    try {
      // Insert text
      if (Manager.isValid(docToView)) {
        setImgUrl(docToView.url)

        let text = docToView.docText
        console.log(text)
        // if (!text) {
        //         //   AlertManager.throwError(
        //         //     `Unable to find or convert document, please try again after awhile. ${docToView?.type === 'image' ? `In the meantime, you can view the document image while this is being resolved.` : ''}`
        //         //   )
        //         //   return false
        //         // }

        // Remove line breaks after header
        const lineBreaks = document.querySelectorAll('br')
        for (let lineBreak of lineBreaks) {
          const previousSibling = lineBreak.previousElementSibling
          if (previousSibling && previousSibling?.tagName === 'SPAN') {
            lineBreak.remove()
          }
        }

        const docText = document.getElementById('doc-text')
        docText.innerHTML = text

        await AddAndFormatHeaders()
        CorrectTextErrors()
        await SetTableOfContentsHeaders()
      } else {
        AlertManager.throwError('No Document Found')
        return false
      }
    } catch (error) {
      AlertManager.throwError('Unable to find or load document')
    }
  }

  const FormatDocument = async () => {
    const url = docToView.url
    const docText = docToView.docText
    if (!Manager.isValid(docToView) || !Manager.isValid(docText, true)) {
      AlertManager.throwError('Unable to find or load document. Please try again after awhile.')
      setState({...state, isLoading: false, currentScreen: ScreenNames.docsList})
      return false
    }
    const textContainer = document.getElementById('doc-text')
    const coparents = documents.map((x) => x.coparent)
    const relevantDoc = documents.find((x) => x?.name === docToView?.name)

    //#region VALIDATION
    if (!Manager.isValid(relevantDoc)) {
      return false
    }

    if (!Manager.isValid(documents)) {
      return false
    }

    if (!Manager.isValid(coparents)) {
      return false
    }
    if (!Manager.isValid(relevantDoc)) {
      return false
    }

    //#endregion VALIDATION

    // APPEND HTML
    textContainer.innerHTML = docText

    //#region STYLING/FORMATTING
    const allElements = textContainer.querySelectorAll('*')

    for (let element of allElements) {
      const computedStyle = window.getComputedStyle(element)
      const fontWeight = computedStyle.fontWeight
      element.style.lineHeight = '1.4'
      element.style.textAlign = 'left'
      element.style.textIndent = '0'
      element.style.marginLeft = '0'

      if (!element.classList.contains('header')) {
        // Add top margin to headers
        if (fontWeight === '700') {
          const parent = element.parentElement
          if (parent) {
            parent.style.marginTop = '15px'
            parent.style.marginBottom = '0'
            parent.style.display = 'block'
          }
        }

        // PARAGRAPHS
        if (element.tagName === 'P') {
          const parStyles = window.getComputedStyle(element)
          const parFontWeight = parStyles.fontWeight
          const spans = element.querySelectorAll('span')
          let parText = ''

          if (parFontWeight !== '700') {
            element.style.marginBottom = '15px'
          }

          // Get text and remove spans
          for (let span of spans) {
            const spanStyles = window.getComputedStyle(span)
            const fontWeight = spanStyles.fontWeight
            span.innerHTML = span.innerHTML.replace(/&nbsp;/g, '')

            // Bold titles
            if (fontWeight === '700') {
              element.style.fontWeight = '700'
              element.style.marginBottom = '0'
              element.style.marginTop = '15px'
            }

            parText += span.textContent
            span.remove()
          }
          element.style.textIndent = '0'
          element.innerHTML = parText
        }

        // SPANS
        if (element.tagName === 'SPAN') {
          if (element.textContent.length === 1) {
            element.remove()
          }
        }

        // LINKS
        if (element.tagName === 'A') {
          element.style.display = 'inline'
          element.innerHTML = element.innerHTML.replaceAll('&nbsp;', '').replaceAll('  ', ' ')
        }
      }
    }

    await AddAndFormatHeaders()
    CorrectTextErrors()
    await SetTableOfContentsHeaders()
    //#endregion STYLING/FORMATTING
  }

  const CorrectTextErrors = () => {
    const docText = document.getElementById('doc-text')
    docText.innerHTML = docText.innerHTML.replaceAll('  ', ' ').replaceAll('Triday', 'Friday').replaceAll(')', ') ')
  }

  const AddAndFormatHeaders = async () => {
    const docText = document.getElementById('doc-text')
    let userHeaders = await DB.getTable(`${DB.tables.documentHeaders}/${currentUser?.key}`)
    userHeaders = userHeaders.map((x) => x.headerText)
    for (let header of userHeaders) {
      docText.innerHTML = docText.innerHTML.replaceAll(
        header,
        `<div data-hashed-header=${Manager.generateHash(header).replaceAll(' ', '')} class="header">
                          <span class="header-text">${header}</span>
                        </div>`
      )
    }
  }

  const AddFloatingMenuAnimations = () => {
    document.querySelectorAll('#floating-buttons .svg-wrapper').forEach((menuItem, i) => {
      setTimeout(() => {
        menuItem.classList.add('visible')
      }, 55 * i)
    })
  }

  const DeleteHeader = async (headerElement) => {
    const headerTarget = headerElement?.currentTarget
    if (headerTarget) {
      const headerText = headerTarget.querySelector('.header-text')?.textContent
      const header = await DB.find(`${DB.tables.documentHeaders}/${currentUser?.key}`, ['headerText', headerText], true)
      if (header) {
        await DB.deleteById(`${DB.tables.documentHeaders}/${currentUser?.key}`, header.id)
        setTocHeaders([])
        await OnLoad()
      }
    }
  }

  const AddUserHeaderToDatabase = async () => {
    const text = DomManager.getSelectionText()

    let userHeaders = await DB.getTable(`${DB.tables.documentHeaders}/${currentUser?.key}`)
    const alreadyExists = Manager.isValid(userHeaders.find((x) => x.headerText.includes(text)))

    if (!alreadyExists) {
      if (text.length > 5 && currentScreen === ScreenNames.docViewer) {
        AlertManager.confirmAlert(
          'Would you like to use the selected text as a header?',
          'Yes',
          true,
          async () => {
            const header = new DocumentHeader()
            header.headerText = text
            header.ownerKey = currentUser.key
            await DB.Add(`${DB.tables.documentHeaders}/${currentUser?.key}`, header)
            await OnLoad()
          },
          () => {
            DomManager.clearTextSelection()
          }
        )
      }
    } else {
      if (text.length > 5) {
        AlertManager.throwError('This header already exists')
        return false
      }
    }
  }

  const CloseSearch = async () => {
    setShowSearch(false)
    setSearchValue('')
    setState({...state, refreshKey: Manager.getUid()})
    const searchHighlights = document.querySelectorAll('.text-highlight')
    if (Manager.isValid(searchHighlights)) {
      for (let highlight of searchHighlights) {
        highlight.classList.remove('text-highlight')
      }
    }
  }

  const ScrollToTop = () => {
    const header = document.querySelector('.screen-title')
    header.scrollIntoView({behavior: 'smooth', block: 'end'})
    setShouldHideSidebar(true)
  }

  const RenameFile = async () => {
    if (Manager.isValid(newFileName, true)) {
      const newName = `${newFileName}.${StringManager.GetFileExtension(docToView.name).toLowerCase()}`
      const recordIndex = DB.GetTableIndexById(documents, docToView?.id)
      if (Manager.isValid(recordIndex)) {
        await DB.updateByPath(`${DB.tables.documents}/${currentUser?.key}/${recordIndex}/name`, newName)
        setState({...state, refreshKey: Manager.getUid(), docToView: {...docToView, name: newName}})
      }
      setShowRenameFile(false)
      setNewFileName('')
    } else {
      AlertManager.throwError('Please enter a new document name')
      return false
    }
  }

  useEffect(() => {
    if (sideMenuIsOpen) {
      AddFloatingMenuAnimations()
    } else {
      const allMenuItems = document.querySelectorAll('#floating-buttons .svg-wrapper')
      allMenuItems.forEach((menuItem) => {
        menuItem.classList.remove('visible')
      })
    }
  }, [sideMenuIsOpen])

  // CLOSE SIDEBAR
  useEffect(() => {
    if (showToc || showSearch || showTips || showRenameFile) {
      setShouldHideSidebar(true)
    } else {
      setShouldHideSidebar(false)
    }
  }, [showToc, showSearch, showTips])

  useEffect(() => {
    if (!currentUserIsLoading && !documentsAreLoading) {
      OnLoad().then((r) => r)
    }
  }, [currentUserIsLoading, documentsAreLoading])

  // PAGE LOAD
  useEffect(() => {
    const appContentWithSidebar = document.getElementById('app-content-with-sidebar')
    if (appContentWithSidebar) {
      appContentWithSidebar.classList.add('doc-viewer')
    }

    // Listen for selection change
    if (currentScreen === ScreenNames.docViewer) {
      document.addEventListener('selectionchange', debounce(AddUserHeaderToDatabase, 1000))
    }

    return () => {
      document.removeEventListener('selectionchange', AddUserHeaderToDatabase)
      if (appContentWithSidebar) {
        appContentWithSidebar.classList.remove('doc-viewer')
      }
    }
  }, [])

  return (
    <>
      {/* SEARCH CARD */}
      <Modal
        wrapperClass="doc-search-card"
        className="form search-card"
        submitText={'Find Text'}
        showCard={showSearch}
        title={'Search'}
        showOverlay={false}
        onSubmit={Search}
        onClose={CloseSearch}>
        <InputWrapper
          wrapperClasses="mt-5"
          labelText="Enter word(s) to find..."
          onChange={(e) => setSearchValue(e.target.value)}
          inputValueType="text"
        />
      </Modal>

      {/* TIPS CARD */}
      <Modal
        wrapperClass="doc-tips-card"
        hasSubmitButton={false}
        showCard={showTips}
        title={'Learn More'}
        showOverlay={true}
        onClose={() => setShowTips(false)}>
        <>
          <hr className="mt-5 mb-20" />
          <Label text={'Searching'} isBold={true} />

          <p className="tip-text">
            To begin your search, {DomManager.tapOrClick()} the search button and enter the word or words you want to look for. The results you find
            will be <span className="text-highlight">highlighted</span> for easy viewing.
          </p>
          <hr />
          <Label text={'Table of Contents'} isBold={true} />
          <p className="tip-text">
            {DomManager.tapOrClick(true)} the <IoListOutline id="toc-button-inline" className={`${theme}`} /> icon to view the Table of Contents.
          </p>
          <p className="tip-text">
            When you {DomManager.tapOrClick()} an item, you&#39;ll be directed straight to the corresponding header in the document.
          </p>
          <hr />
          <Label text={'Create Your Own Headers'} isBold={true} />
          <p className="tip-text">
            You might notice some predefined headers, which are text on a light grey background. However, it&#39;s a good idea to create your own
            custom headers to make specific texts stand out to you.
          </p>
          <p className="tip-text">
            To create a new header, just highlight the text you want to use, and then {DomManager.tapOrClick()} the confirmation button when it
            appears.
          </p>
          <p className="tip-text">
            The page will refresh, and you&#39;ll be able to see the new header you&#39;ve just created! Your custom headers will appear each time you
            open the document.
          </p>
        </>
      </Modal>

      {/* TABLE OF CONTENTS */}
      {tocHeaders?.length > 0 && (
        <Modal
          wrapperClass="toc-card"
          hasSubmitButton={false}
          showCard={showToc}
          onClose={() => setShowToc(false)}
          className="toc"
          title={'Table of Contents'}>
          <div id="table-of-contents">
            <div id="toc-contents">
              {tocHeaders.length > 0 &&
                tocHeaders.sort().map((header, index) => {
                  return (
                    <div key={index} className="flex" id="toc-header-wrapper">
                      <p
                        onClick={() => {
                          setShowToc(false)
                          ScrollToHeader(header)
                        }}
                        className={`toc-header`}
                        data-hashed-header={header}
                        dangerouslySetInnerHTML={{__html: Manager.decodeHash(header)}}></p>
                    </div>
                  )
                })}
            </div>
          </div>
        </Modal>
      )}

      {/* RENAME FILE */}
      <Modal
        showCard={showRenameFile}
        submitText={'Rename'}
        wrapperClass="rename-file-card"
        onClose={() => setShowRenameFile(false)}
        onSubmit={RenameFile}
        className="rename-file"
        title={'Rename Document'}>
        <InputWrapper labelText={'New document name'} required={true} inputType={InputTypes.text} onChange={(e) => setNewFileName(e.target.value)} />
      </Modal>

      {/* SCREEN ACTIONS */}
      <ScreenActionsMenu centeredActionItem={true}>
        {/*<Fade direction={'right'} className={'fade-wrapper'} duration={800} damping={0.2} triggerOnce={false} cascade={true}>*/}
        {/* SCROLL TO TOP BUTTON */}
        <div
          className="action-item scroll-to-top"
          onClick={() => {
            setState({...state, showScreenActions: false})
            ScrollToTop()
          }}>
          <div className="content">
            <div className="svg-wrapper ">
              <IoIosArrowUp id={'scroll-to-top-icon'} />
            </div>
            <p>Scroll to Top</p>
          </div>
        </div>

        {/* TOC BUTTON */}
        {tocHeaders.length > 0 && (
          <div
            className="action-item toc"
            onClick={async () => {
              await SetTableOfContentsHeaders()
              setShowToc(true)
              setState({...state, showScreenActions: false})
            }}>
            <div className="content">
              <div className="svg-wrapper">
                <IoListOutline id="toc-icon" className={`${theme}`} />
              </div>
              <p>Table of Contents</p>
            </div>
          </div>
        )}

        {/* SEARCH  */}
        <div
          className="action-item"
          onClick={() => {
            setShowSearch(true)
            setState({...state, showScreenActions: false})
          }}>
          <div className="content">
            <div className="svg-wrapper">
              <TbFileSearch id={'desktop-search-icon'} />
            </div>
            <p>Find Text</p>
          </div>
        </div>

        {/* RENAME ICON */}
        <div
          className="action-item rename-document"
          onClick={() => {
            setShowRenameFile(true)
            setState({...state, showScreenActions: false})
          }}>
          <div className="content">
            <div className="svg-wrapper">
              <MdDriveFileRenameOutline />
            </div>
            <p>Rename Document</p>
          </div>
        </div>

        {/* TIPS ICON */}
        <div
          className="action-item tips"
          onClick={() => {
            setShowTips(true)
            setState({...state, showScreenActions: false})
          }}>
          <div className="content">
            <div className="svg-wrapper">
              <FaLightbulb className={'lightbulb'} />
            </div>
            <p>Learn More</p>
          </div>
        </div>

        {/* DOCUMENT IMAGE */}
        {docType === 'image' && (
          <LightGallery elementClassNames={`light-gallery ${theme}`} speed={500} selector={'#document-image'}>
            <div data-src={imgUrl} className="action-item document-image">
              <img data-src={imgUrl} id="document-image" src={imgUrl} alt="" />
            </div>
          </LightGallery>
        )}
        {/*</Fade>*/}
        <div id="close-icon-wrapper">
          <IoClose className={'close-button'} onClick={() => setState({...state, showScreenActions: false})} />
        </div>
      </ScreenActionsMenu>

      {/* PAGE CONTAINER / TEXT */}
      <div id="documents-container" className={`${theme} page-container form documents`}>
        <p className="screen-title accent">
          {StringManager.removeFileExtension(StringManager.uppercaseFirstLetterOfAllWords(docToView?.name)).replaceAll('-', ' ')}
        </p>
        <hr className="documents" />
        <div id="doc-text"></div>
        {Manager.isValid(searchValue, true) && (
          <button onClick={CloseSearch} id="close-search-button" className="default with-border">
            Close Search
          </button>
        )}
      </div>

      {/* NAV BAR */}
      {DomManager.isMobile() && (
        <NavBar navbarClass={'actions'}>
          <div onClick={() => setState({...state, showScreenActions: true})} className={`menu-item`}>
            <HiDotsHorizontal className={'screen-actions-menu-icon'} />
            <p>More</p>
          </div>
        </NavBar>
      )}
    </>
  )
}