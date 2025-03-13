import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../../context'
import FirebaseStorage from '/src/database/firebaseStorage'
import searchTextHL from 'search-text-highlight'
import DocumentConversionManager from '/src/managers/documentConversionManager'
import Manager from '/src/managers/manager'
import BottomCard from '/src/components/shared/bottomCard'
import SecurityManager from '/src/managers/securityManager'
import NavBar from '../../navBar'
import DB from '/src/database/DB'
import AlertManager from '/src/managers/alertManager'
import StringManager from '/src/managers/stringManager'
import LightGallery from 'lightgallery/react'
import 'lightgallery/css/lightgallery.css'
import DomManager from '/src/managers/domManager'
import debounce from 'debounce'
import { IoListOutline, IoMenuOutline } from 'react-icons/io5'
import DocumentHeader from '/src/models/documentHeader'
import InputWrapper from '/src/components/shared/inputWrapper'
import { TbFileSearch } from 'react-icons/tb'
import { MdDriveFileRenameOutline, MdSearchOff } from 'react-icons/md'
import { FaFileImage, FaLightbulb } from 'react-icons/fa6'
import ScreenNames from '/src/constants/screenNames'
import { IoIosArrowUp } from 'react-icons/io'
import { IoClose } from 'react-icons/io5'
import _ from 'lodash'
import Label from '../../shared/label.jsx'
import DatasetManager from '../../../managers/datasetManager.coffee'
import Actions from '../../shared/actions'

export default function DocViewer() {
  const predefinedHeaders = DocumentConversionManager.tocHeaders
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, docToView, isLoading, currentScreen, refreshKey } = state
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

  const scrollToHeader = (hashedHeader) => {
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

  const onLoad = async () => {
    const fileType = `.${StringManager.getFileExtension(docToView.name)}`.toLowerCase()
    const nonImageFileTypes = ['.docx', '.doc', '.pdf', '.odt', '.txt']
    if (currentUser && nonImageFileTypes.includes(fileType)) {
      setDocType('document')
      const url = docToView.url
      const fileName = FirebaseStorage.getImageNameFromUrl(url)
      const firebaseText = await FirebaseStorage.getSingleFile(FirebaseStorage.directories.documents, currentUser.key, fileName)
      await formatDocument(firebaseText)
    } else {
      setDocType('image')
      await formatImageDocument()
    }
  }

  const setTableOfContentsHeaders = async () => {
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
        header.addEventListener('click', deleteHeader)

        // Get header text
        if (!headerTextElement) {
          headerTextElement = header.textContent.trim()
        } else {
          headerTextElement = headerTextElement.textContent.trim()
          if (!_.isEmpty(headerTextElement) && StringManager.wordCount(headerTextElement) <= 10) {
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

  const search = async () => {
    if (Manager.isValid(searchValue, true)) {
      const docText = document.getElementById('doc-text')
      let textAsHtml = docText.innerHTML
      textAsHtml = searchTextHL.highlight(textAsHtml, searchValue)
      textAsHtml = textAsHtml.replaceAll('<span class=" text-highlight"="', '')
      docText.innerHTML = textAsHtml
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
            const cleanHeader = dataHeader.replaceAll('<span class=', '')
            header.setAttribute('data-header', cleanHeader.trim())
          }
        }
      }, 500)
    } else {
      AlertManager.throwError('Please enter a search value')
      return false
    }
  }

  const formatImageDocument = async () => {
    try {
      // Insert text
      if (docToView) {
        setImgUrl(docToView.url)

        let text = docToView.docText
        if (!text) {
          AlertManager.throwError(
            'Unable to find or convert document, please try again after awhile. In the meantime, you can view the document image while this is being resolved.'
          )
          return false
        }

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

        await addAndFormatHeaders()
        correctTextErrors()
        await setTableOfContentsHeaders()
      } else {
        AlertManager.throwError('No Document Found')
        return false
      }
    } catch (error) {
      AlertManager.throwError('Unable to find or load document')
    }
  }

  const formatDocument = async (firebaseText) => {
    const url = docToView.url
    if (!Manager.isValid(docToView) || !Manager.isValid(url) || !Manager.isValid(firebaseText, true)) {
      AlertManager.throwError('Unable to find or load document. Please try again after awhile.')
      setState({ ...state, isLoading: false, currentScreen: ScreenNames.docsList })
      return false
    }
    const textContainer = document.getElementById('doc-text')
    const allDocuments = await SecurityManager.getDocuments(currentUser)
    const coparents = allDocuments.map((x) => x.coparent)
    const relevantDoc = allDocuments.find((x) => x?.name === docToView?.name)

    //#region VALIDATION
    if (!Manager.isValid(relevantDoc)) {
      return false
    }

    if (!Manager.isValid(allDocuments)) {
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
    textContainer.innerHTML = firebaseText

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

    await addAndFormatHeaders()
    correctTextErrors()
    await setTableOfContentsHeaders()
    //#endregion STYLING/FORMATTING
  }

  const correctTextErrors = () => {
    const docText = document.getElementById('doc-text')
    docText.innerHTML = docText.innerHTML.replaceAll('  ', ' ').replaceAll('Triday', 'Friday').replaceAll(')', ') ')
  }

  const addAndFormatHeaders = async () => {
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

  const addFloatingMenuAnimations = () => {
    document.querySelectorAll('#floating-buttons .svg-wrapper').forEach((menuItem, i) => {
      setTimeout(() => {
        menuItem.classList.add('visible')
      }, 55 * i)
    })
  }

  const deleteHeader = async (headerElement) => {
    const headerTarget = headerElement?.currentTarget
    if (headerTarget) {
      const headerText = headerTarget.querySelector('.header-text')?.textContent
      const header = await DB.find(`${DB.tables.documentHeaders}/${currentUser?.key}`, ['headerText', headerText], true)
      if (header) {
        await DB.deleteById(`${DB.tables.documentHeaders}/${currentUser?.key}`, header.id)
        setTocHeaders([])
        await onLoad()
      }
    }
  }

  const addUserHeaderToDatabase = async () => {
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
            await DB.add(`${DB.tables.documentHeaders}/${currentUser?.key}`, header)
            await onLoad()
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

  const closeSearch = async () => {
    setShowSearch(false)
    setState({ ...state, refreshKey: Manager.getUid() })
    const searchHighlights = document.querySelectorAll('.text-highlight')
    if (Manager.isValid(searchHighlights)) {
      for (let highlight of searchHighlights) {
        highlight.classList.remove('text-highlight')
      }
    }
  }

  const scrollToTop = () => {
    const header = document.querySelector('.screen-title')
    header.scrollIntoView({ behavior: 'smooth', block: 'end' })
    setShouldHideSidebar(true)
  }

  const renameFile = async () => {
    if (Manager.isValid(newFileName, true)) {
      const newName = `${newFileName}.${StringManager.getFileExtension(docToView.name).toLowerCase()}`
      const childKey = await DB.getSnapshotKey(`${DB.tables.documents}/${currentUser?.key}`, docToView, 'id')

      if (Manager.isValid(childKey)) {
        await DB.updateByPath(`${DB.tables.documents}/${currentUser?.key}/${childKey}/name`, newName)
        setState({ ...state, refreshKey: Manager.getUid(), docToView: { ...docToView, name: newName } })
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
      addFloatingMenuAnimations()
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

  // PAGE LOAD
  useEffect(() => {
    onLoad().then((r) => r)
    const appContentWithSidebar = document.getElementById('app-content-with-sidebar')
    if (appContentWithSidebar) {
      appContentWithSidebar.classList.add('doc-viewer')
    }

    // Listen for selection change
    if (currentScreen === ScreenNames.docViewer) {
      document.addEventListener('selectionchange', debounce(addUserHeaderToDatabase, 1000))
    }

    return () => {
      document.removeEventListener('selectionchange', addUserHeaderToDatabase)
      if (appContentWithSidebar) {
        appContentWithSidebar.classList.remove('doc-viewer')
      }
    }
  }, [])

  return (
    <div className="doc-viewer-container">
      {/* SEARCH CARD */}
      <BottomCard
        wrapperClass="doc-search-card"
        className="form search-card"
        submitText={'Find Text'}
        showCard={showSearch}
        title={'Search'}
        showOverlay={false}
        onSubmit={search}
        onClose={closeSearch}>
        <InputWrapper
          wrapperClasses="mt-5"
          labelText="Enter word(s) to find..."
          onChange={(e) => setSearchValue(e.target.value)}
          inputValueType="text"
        />
      </BottomCard>

      {/* TIPS CARD */}
      <BottomCard
        wrapperClass="doc-tips-card"
        hasSubmitButton={false}
        showCard={showTips}
        title={'Tips'}
        showOverlay={true}
        onClose={() => setShowTips(false)}>
        <>
          <Label text={'Searching'} isBold={true} />
          <p className="tip-text">
            To begin your search, {DomManager.tapOrClick()} the search button and enter the word or words you want to look for. The results you find
            will be <span className="text-highlight">highlighted</span> for easy viewing.
          </p>
          <Label text={'Table of Contents'} isBold={true} />
          <p className="tip-text">
            {DomManager.tapOrClick(true)} the <IoListOutline id="toc-button-inline" className={`${theme}`} /> icon to view the Table of Contents.
          </p>
          <p className="tip-text">
            When you {DomManager.tapOrClick()} an item, you&#39;ll be directed straight to the corresponding header in the document.
          </p>
          <Label text={'Create Your Own Headers'} isBold={true} />
          <p className="tip-text">
            You might notice some predefined headers, which are dark blue text on a light blue background. However, it&#39;s a good idea to create
            your own custom headers to make specific texts stand out to you.
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
      </BottomCard>

      {/* TABLE OF CONTENTS */}
      {tocHeaders?.length > 0 && (
        <BottomCard
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
                      <span>•</span>
                      <p
                        onClick={() => {
                          setShowToc(false)
                          scrollToHeader(header)
                        }}
                        className={`toc-header`}
                        data-hashed-header={header}
                        dangerouslySetInnerHTML={{ __html: Manager.decodeHash(header) }}></p>
                    </div>
                  )
                })}
            </div>
          </div>
        </BottomCard>
      )}

      {/* RENAME FILE */}
      <BottomCard
        showCard={showRenameFile}
        submitText={'Rename'}
        wrapperClass="rename-file-card"
        onClose={() => setShowRenameFile(false)}
        onSubmit={renameFile}
        className="rename-file"
        title={'Rename Document'}>
        <InputWrapper labelText={'Enter new document name...'} onChange={(e) => setNewFileName(e.target.value)} />
      </BottomCard>

      {/* FLOATING BUTTONS */}
      <Actions shouldHide={shouldHideSidebar} show={sideMenuIsOpen}>
        {/* SCROLL TO TOP BUTTON */}
        <div className="action-item">
          <IoIosArrowUp id={'scroll-to-top-icon'} onClick={scrollToTop} />
        </div>
        {/* TOC BUTTON */}
        {tocHeaders.length > 0 && (
          <div className="action-item">
            <IoListOutline
              onClick={async () => {
                await setTableOfContentsHeaders()
                setShowToc(true)
              }}
              id="toc-icon"
              className={`${theme}`}
            />
          </div>
        )}

        {/* SEARCH ICON FOR 800PX > */}
        {!DomManager.isMobile() && (
          <div className="action-item">
            <TbFileSearch id={'desktop-search-icon'} onClick={() => setShowSearch(true)} />
          </div>
        )}

        {/* RENAME ICON */}
        <div className="action-item">
          <MdDriveFileRenameOutline onClick={() => setShowRenameFile(true)} />
        </div>

        {/* DOCUMENT IMAGE */}
        {docType === 'image' && (
          <div className="action-item">
            <LightGallery elementClassNames={`light-gallery ${theme}`} speed={500} selector={'#document-image'}>
              <img data-src={imgUrl} id="document-image" src={imgUrl} alt="" />
              <FaFileImage className={'file-image'} />
            </LightGallery>
          </div>
        )}

        {/* TIPS ICON */}
        <div className="action-item">
          <FaLightbulb id={'tips-icon'} onClick={() => setShowTips(true)} />
        </div>
      </Actions>

      {/* MENU ICON */}
      <div className={`${sideMenuIsOpen ? 'close' : ''} action-item menu-icon`}>
        {sideMenuIsOpen ? (
          <IoClose className={'menu-icon close'} onClick={() => setSideMenuIsOpen(false)} />
        ) : (
          <IoMenuOutline className={'menu-icon'} onClick={() => setSideMenuIsOpen(true)} />
        )}
      </div>

      {/* PAGE CONTAINER / TEXT */}
      <div id="documents-container" className={`${theme} page-container form documents`}>
        <p className="screen-title">
          {StringManager.removeFileExtension(StringManager.uppercaseFirstLetterOfAllWords(docToView?.name)).replaceAll('-', ' ')}
        </p>
        <div id="doc-text"></div>
      </div>

      {/* NAVBARS */}
      {DomManager.isMobile() && (
        <>
          {!showSearch && !showToc && !isLoading && (
            <NavBar addOrClose="add">
              <TbFileSearch id={'open-search-button'} onClick={() => setShowSearch(true)} />
            </NavBar>
          )}
          {showSearch && !showToc && !isLoading && (
            <NavBar addOrClose="close">
              <MdSearchOff id={'close-search-button'} onClick={closeSearch} />
            </NavBar>
          )}
        </>
      )}
    </div>
  )
}