// Path: src\components\screens\documents\docViewer.jsx
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
import { IoListOutline } from 'react-icons/io5'
import DocumentHeader from '/src/models/documentHeader'
import InputWrapper from '/src/components/shared/inputWrapper'
import { TbFileSearch } from 'react-icons/tb'
import { MdSearchOff, MdTipsAndUpdates } from 'react-icons/md'
import ScreenNames from '/src/constants/screenNames'
import { IoIosArrowUp } from 'react-icons/io'
import _ from 'lodash'
import Label from '../../shared/label.jsx'
import DatasetManager from '../../../managers/datasetManager.coffee'
import reactStringReplace from 'react-string-replace'
import Spacer from '../../shared/spacer'

export default function DocViewer() {
  const predefinedHeaders = DocumentConversionManager.tocHeaders
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, docToView, isLoading, currentScreen, refreshKey } = state
  const [tocHeaders, setTocHeaders] = useState([])
  const [showToc, setShowToc] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [textWithHeaders, setTextWithHeaders] = useState('')
  const [imgUrl, setImgUrl] = useState('')
  const [docType, setDocType] = useState('document')
  const [showTips, setShowTips] = useState(false)
  const [isFormatting, setIsFormatting] = useState(false)
  const scrollToHeader = (headerText) => {
    const domHeader = document.querySelector(`#doc-text [data-header='${headerText}']`)
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
    // setState({ ...state, isLoading: false })
    const fileType = `.${StringManager.getFileExtension(docToView.name)}`
    setTextWithHeaders('')
    setIsFormatting(true)
    const nonImageFileTypes = ['.docx', '.doc', '.pdf', '.odt', '.txt']
    if (currentUser && nonImageFileTypes.includes(fileType)) {
      setDocType('document')
      const url = docToView.url
      const fileName = FirebaseStorage.getImageNameFromUrl(url)
      const firebaseText = await FirebaseStorage.getSingleFile(FirebaseStorage.directories.documents, currentUser.id, fileName)
      await formatDocument(firebaseText)
    } else {
      setDocType('image')
      await formatImageDocument()
    }
  }

  const setTableOfContentsHeaders = async () => {
    let userHeaders = await DB.getTable(`${DB.tables.documentHeaders}/${currentUser?.key}`)
    userHeaders = userHeaders.map((x) => x.headerText)
    const domHeaders = document.querySelectorAll('.header')
    let headersInDocument = []
    for (let header of domHeaders) {
      const headerText = header.textContent.trim()
      if (!_.isEmpty(headerText) && StringManager.wordCount(headerText) <= 10) {
        if (!headersInDocument.includes(headerText)) {
          headersInDocument.push(headerText)
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

  const search = async (searchValue) => {
    // setState({ ...state, isLoading: true })
    if (Manager.isValid(searchValue, true)) {
      const docText = document.getElementById('doc-text')
      let textAsHtml = docText.innerHTML
      setTextWithHeaders('')
      textAsHtml = searchTextHL.highlight(textAsHtml, searchValue)
      textAsHtml = textAsHtml.replaceAll('<span class=" text-highlight"="', '')
      setTextWithHeaders(textAsHtml)
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
      setState({ ...state, isLoading: false })
    }
  }

  const formatImageDocument = async () => {
    try {
      const allDocs = await SecurityManager.getDocuments(currentUser)
      let docOwner = await DB.find(DB.tables.users, ['phone', docToView?.ownerKey], true)
      const firebasePathId = docOwner.id
      const imageResult = await FirebaseStorage.getImageAndUrl(FirebaseStorage.directories.documents, firebasePathId, docToView.name)
      // Catch errors
      if (!Manager.isValid(allDocs)) {
        setState({ ...state, isLoading: false, loadingText: '' })
        return false
      }

      if (!Manager.isValid(docOwner)) {
        setState({ ...state, isLoading: false, loadingText: '' })
        return false
      }

      if (!Manager.isValid(docToView)) {
        setState({ ...state, isLoading: false, loadingText: '' })
        AlertManager.throwError('No Document Found')
        return false
      }

      // Insert text
      if (imageResult?.status === 'success') {
        setImgUrl(imageResult?.imageUrl)
        // Get all headers
        let userHeaders = await DB.getTable(`${DB.tables.documentHeaders}/${currentUser?.key}`)
        userHeaders = userHeaders.map((x) => x.headerText)

        let allHeaders = []
        if (Manager.isValid(userHeaders)) {
          allHeaders = [...predefinedHeaders, ...userHeaders].flat()
        } else {
          allHeaders = predefinedHeaders
        }
        let text = await DocumentConversionManager.imageToText(imageResult?.imageUrl)

        // Image to text server probably down -> 404
        if (!text) {
          AlertManager.throwError(
            'Unable to find or convert document, please try again after awhile. In the meantime, you can view the document image while this is being resolved.'
          )
          setTextWithHeaders('')
          setState({ ...state, isLoading: false, loadingText: '' })
          return false
        }
        // HTML symbol -> regular
        text = text.replaceAll('&#039;', "'")

        // Remove line breaks after header
        const lineBreaks = document.querySelectorAll('br')
        for (let lineBreak of lineBreaks) {
          const previousSibling = lineBreak.previousElementSibling
          if (previousSibling && previousSibling?.tagName === 'SPAN') {
            lineBreak.remove()
          }
        }
        // Format headers
        for (let header of allHeaders) {
          const dataHeader = header.replaceAll(' ', '').replaceAll("'", '').replace('"', '')
          if (userHeaders.includes(header)) {
            text = text.replaceAll(
              header,
              `<span data-header=${dataHeader} class="header">${header}<TiDelete className="delete-header-button"/></span>`
            )
          } else {
            text = text.replaceAll(header, `<span data-header=${dataHeader} class="header">${header}</span>`)
          }
        }
        setTextWithHeaders(text)
        setState({ ...state, isLoading: false, loadingText: '' })
      } else {
        AlertManager.throwError('No Document Found')
        setState({ ...state, isLoading: false, loadingText: '' })
        return false
      }
    } catch (error) {
      AlertManager.throwError('Unable to find or load document')
      setState({ ...state, isLoading: false, loadingText: '' })
    }
  }

  const formatHeaderText = (headerText) => {
    return headerText
      .trim()
      .replaceAll('&nbsp;', '')
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .replaceAll('  ', ' ')
      .replaceAll('   ', ' ')
  }

  const formatDocument = async (firebaseText) => {
    const url = docToView.url
    if (!Manager.isValid(url)) {
      setState({ ...state, isLoading: false })
      return false
    }
    const textContainer = document.getElementById('doc-text')
    const allDocuments = await SecurityManager.getDocuments(currentUser)
    const coparents = allDocuments.map((x) => x.coparent)
    const relevantDoc = allDocuments.filter((x) => x?.name === docToView?.name)[0]
    const fileExtension = StringManager.getFileExtension(docToView?.name).toString()

    if (!Manager.isValid(relevantDoc)) {
      setState({ ...state, isLoading: false })
      return false
    }
    let docHtml = firebaseText

    //#region VALIDATION
    if (!Manager.isValid(allDocuments)) {
      setState({ ...state, isLoading: false })
      return false
    }

    if (!Manager.isValid(coparents)) {
      setState({ ...state, isLoading: false })
      return false
    }
    if (!Manager.isValid(relevantDoc)) {
      setState({ ...state, isLoading: false })
      return false
    }

    if (!Manager.isValid(docHtml, true)) {
      AlertManager.throwError('Unable to find or load document. Please try again after awhile.')
      setState({ ...state, isLoading: false, currentScreen: ScreenNames.docsList })
      return false
    }

    //#endregion VALIDATION

    // APPEND HTML
    setTextWithHeaders(docHtml)

    //#region STYLING/FORMATTING
    setTimeout(async () => {
      var x = document.body.getElementsByTagName('style')
      for (var i = x.length - 1; i >= 0; i--) x[i].parentElement.removeChild(x[i])
      let allPars = textContainer?.querySelectorAll('p')

      if (fileExtension === 'pdf') {
        allPars = textContainer?.querySelectorAll('span')
      }
      const allTags = textContainer?.querySelectorAll('h3,h2,p,span,li,p')

      // Remove JS styles
      if (Manager.isValid(allTags)) {
        for (let tag of allTags) {
          tag.style = null
        }
      }

      //#region PDF
      if (fileExtension === 'pdf') {
        const textWrappers = document.querySelectorAll('.stl_01')

        for (let textElement of textWrappers) {
          const spans = textElement.querySelectorAll('span')
          let userHeaders = await DB.getTable(`${DB.tables.documentHeaders}/${currentUser?.key}`)

          for (let span of spans) {
            for (let userHeader of userHeaders) {
              const userHeaderText = formatHeaderText(userHeader.headerText)
              let text = formatHeaderText(span.textContent)
              if (text.includes(userHeaderText)) {
                const newHeader = document.createElement('span')
                newHeader.classList.add('header')
                newHeader.setAttribute('data-header', userHeaderText)
                span.replaceWith(newHeader)
                newHeader.textContent = userHeaderText
                const deleteIcon = document.createElement('p')
                deleteIcon.classList.add('delete-header-button')
                deleteIcon.onclick = async (e) => {
                  await deleteHeader(e)
                }
                newHeader.append(deleteIcon)
              }
            }
          }
        }
      }
      //#endregion PDF

      //#region NOT PDF
      else {
        // Format p/span
        if (Manager.isValid(allPars)) {
          for (let par of allPars) {
            const spans = par.querySelectorAll('span')
            const links = par.querySelectorAll('a')

            // Get all headers
            let userHeaders = await DB.getTable(`${DB.tables.documentHeaders}/${currentUser?.key}`)
            userHeaders = userHeaders.map((x) => x.headerText)

            // Remove unnecessary pars
            if (_.isEmpty(par.innerHTML.trim()) || _.isEmpty(par.innerText.trim()) || _.isEmpty(par.textContent.trim())) {
              par.remove()
            }

            // LINKS (<a>)
            for (let link of links) {
              link.setAttribute('target', '_blank')
            }

            // SPANS
            for (let span of spans) {
              if (span) {
                let elementText = span.textContent
                const textLength = elementText.length
                const spanInlineStyles = span.style.cssText
                const header = span.parentNode
                const onlyDashes = span.innerText.match(/__/g)

                if (StringManager.isAllUppercase(span.innerText)) {
                  span.classList.add('bold')
                }

                // Handle user headers
                for (let userHeader of userHeaders) {
                  if (elementText.includes(userHeader)) {
                    const _span = document.createElement('span')
                    const deleteIcon = document.createElement('p')
                    deleteIcon.classList.add('delete-header-button')
                    deleteIcon.onclick = async (e) => {
                      await deleteHeader(e)
                    }
                    _span.innerText = userHeader
                    _span.classList.add('header')
                    _span.setAttribute('data-header', userHeader)
                    _span.append(deleteIcon)
                    par.append(_span)
                  }
                }
                span.innerHTML = span.innerHTML.replace(/&nbsp;/g, '')
                if (onlyDashes && onlyDashes.length > 1) {
                  span.remove()
                }
                if (span.innerText.length < 5) {
                  span.remove()
                }

                // Add header class
                if (Manager.contains(spanInlineStyles, 'font-weight: bold') && textLength > 3) {
                  header.classList.add('header')
                  header.setAttribute('data-header', header.textContent)
                }
              }
            }

            // Remove unnecessary pars
            if (_.isEmpty(par.innerHTML.trim()) || _.isEmpty(par.innerText.trim()) || _.isEmpty(par.textContent.trim())) {
              par.remove()
            }
          }
        }
      }
      //#endregion NOT PDF

      const docText = document.getElementById('doc-text')
      const elements = docText.querySelectorAll('*')
      for (let element of elements) {
        if (
          !element.hasChildNodes() ||
          element?.innerHTML?.length === 0 ||
          element?.textContent?.length === 0 ||
          element?.value?.length === 0 ||
          element?.textContent === '\n\n'
        ) {
          element.style.display = 'none'
          console.log(element)
          element.remove()
        }
      }

      setIsFormatting(false)
      // setState({ ...state, isLoading: false })
    }, 400)
    //#endregion STYLING/FORMATTING

    if (!Manager.isValid(firebaseText)) {
      setState({ ...state, isLoading: false })
    }
  }

  const deleteHeader = async (headerElement) => {
    const headerTarget = headerElement?.target
    if (headerTarget) {
      const headerText = formatHeaderText(headerTarget?.parentNode?.textContent)
      const header = await DB.find(`${DB.tables.documentHeaders}/${currentUser?.key}`, ['headerText', headerText], true)
      if (header) {
        await DB.deleteById(`${DB.tables.documentHeaders}/${currentUser?.key}`, header.id)
        setTocHeaders([])
        await onLoad()
      }
    }
  }

  const addUserHeaderToDatabase = async () => {
    // setState({ ...state, isLoading: true })
    const text = DomManager.getSelectionText()
    let userHeaders = await DB.getTable(`${DB.tables.documentHeaders}/${currentUser?.key}`)
    const alreadyExists = userHeaders.filter((x) => x.headerText.trim().includes(text.trim())).length > 0
    if (!alreadyExists) {
      if (text.length > 0 && currentScreen === ScreenNames.docViewer) {
        AlertManager.confirmAlert('Would you like to use the selected text as a header?', 'Yes', true, async () => {
          const header = new DocumentHeader()
          header.headerText = formatHeaderText(text)
          header.ownerKey = currentUser.key
          await DB.add(`${DB.tables.documentHeaders}/${currentUser?.key}`, header)
          await onLoad()
        })
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
  }

  useEffect(() => {
    if (isFormatting === false) {
      setTableOfContentsHeaders().then((r) => r)
    }
  }, [isFormatting])

  // PAGE LOAD
  useEffect(() => {
    onLoad().then((r) => r)
    const appContentWithSidebar = document.getElementById('app-content-with-sidebar')
    if (appContentWithSidebar) {
      appContentWithSidebar.classList.add('doc-viewer')
    }

    // Listen for selection change
    document.addEventListener('selectionchange', debounce(addUserHeaderToDatabase, 1000))
  }, [])

  return (
    <div className="doc-viewer-container">
      {/* SEARCH CARD */}
      <BottomCard
        wrapperClass="doc-search-card"
        hasSubmitButton={false}
        className="form search-card"
        showCard={showSearch}
        title={'Search'}
        showOverlay={false}
        onClose={closeSearch}>
        <div className="flex">
          <InputWrapper placeholder="Enter text to find..." onChange={(e) => search(e.target.value)} inputValueType="text" />
        </div>
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
            {DomManager.tapOrClick(true)} the search button and start typing the word/words you would like to find. Found results will be&nbsp;
            <span className="text-highlight">highlighted</span>&nbsp;.
          </p>
          <Label text={'Table of Contents'} isBold={true} />
          <p className="tip-text">
            {DomManager.tapOrClick(true)} the <IoListOutline id="toc-button-inline" className={`${theme}`} /> icon to view the Table of Contents.
          </p>
          <p className="tip-text">When you click on an item you will be taken directly to that header in the document.</p>
          <p>If the document has a lot of text, it may take a few moments for the table of contents button to appear.</p>
          <Label text={'Create Your Own Headers'} isBold={true} />
          <p className="tip-text">
            There are headers (dark blue text with a light blue background) that are predefined that you may see. But you will likely want to define
            your own custom headers so that certain texts stands out to you.
          </p>
          <p className="tip-text">
            Simply select the text you would like to create a new header for and when you see the confirmation button, {DomManager.tapOrClick()}{' '}
            <b>Yes</b>.
          </p>
          <p className="tip-text">
            The page will reload and you will now see the new header you have created! You will see the same header every time you view the document.
          </p>
          <p className="tip-text">
            You can delete it at any time by {DomManager.tapOrClick()}ing the red <span className="red">X</span> icon to the right of the header.
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
                    <div className="flex" id="toc-header-wrapper">
                      <span>•</span>
                      <p
                        onClick={() => {
                          setShowToc(false)
                          scrollToHeader(header)
                        }}
                        className={`toc-header`}
                        data-header={header}
                        dangerouslySetInnerHTML={{ __html: header }}></p>
                    </div>
                  )
                })}
            </div>
          </div>
        </BottomCard>
      )}

      {/* FLOATING BUTTONS */}
      <div id="floating-buttons" className={` ${showToc || showSearch || showTips ? 'hide' : ''}`}>
        {/* SCROLL TO TOP BUTTON */}
        <div id="scroll-to-top-icon-wrapper" onClick={scrollToTop}>
          <IoIosArrowUp id={'scroll-to-top-button'} />
        </div>

        {/* TOC BUTTON */}
        {tocHeaders.length > 0 && (
          <div
            id="toc-button-wrapper"
            onClick={async () => {
              await setTableOfContentsHeaders()
              setShowToc(true)
            }}>
            <IoListOutline id="toc-button" className={`${theme}`} />
          </div>
        )}

        {/* SEARCH ICON FOR 800PX > */}
        {!DomManager.isMobile() && (
          <div id="desktop-search-button-wrapper">
            <TbFileSearch id={'desktop-search-button'} onClick={() => setShowSearch(true)} />
          </div>
        )}

        {/* TIPS ICON */}
        <div id="tips-icon-wrapper" onClick={() => setShowTips(true)}>
          <MdTipsAndUpdates id={'tips-icon'} />
        </div>
      </div>

      {/* PAGE CONTAINER / TEXT */}
      <div id="documents-container" className={`${theme} page-container form documents`}>
        <p className="screen-title">
          {StringManager.removeFileExtension(StringManager.uppercaseFirstLetterOfAllWords(docToView?.name)).replaceAll('-', ' ')}
        </p>
        <>
          {docType === 'image' && (
            <LightGallery elementClassNames={`light-gallery ${theme}`} speed={500} selector={'#document-image'}>
              <img data-src={imgUrl} id="document-image" src={imgUrl} alt="" />
            </LightGallery>
          )}
          <div id="doc-text" dangerouslySetInnerHTML={{ __html: textWithHeaders }} />
        </>
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