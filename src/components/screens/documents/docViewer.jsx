import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../../context'
import FirebaseStorage from '../../../database/firebaseStorage'
import TableOfContentsListItem from '../../tableOfContentsListItem'
import DocumentConversionManager from '../../../managers/documentConversionManager'
import Manager from '../../../managers/manager'
import BottomCard from '../../shared/bottomCard'
import SecurityManager from '../../../managers/securityManager'
import NavBar from '../../navBar'
import DB from '../../../database/DB'
import AlertManager from '../../../managers/alertManager'
import StringManager from '../../../managers/stringManager'
import LightGallery from 'lightgallery/react'
import 'lightgallery/css/lightgallery.css'
import DomManager from '../../../managers/domManager'
import debounce from 'debounce'
import DocumentHeader from '../../../models/documentHeader'
import { child, getDatabase, onValue, ref } from 'firebase/database'
import InputWrapper from '../../../components/shared/inputWrapper'
import { TbFileSearch } from 'react-icons/tb'
import { MdSearchOff } from 'react-icons/md'
import ScreenNames from '../../../constants/screenNames'

export default function DocViewer() {
  const predefinedHeaders = DocumentConversionManager.tocHeaders
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, docToView, isLoading, currentScreen } = state
  const [tocHeaders, setTocHeaders] = useState([])
  const [showToc, setShowToc] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [textWithHeaders, setTextWithHeaders] = useState('')
  const [imgUrl, setImgUrl] = useState('')
  const [docType, setDocType] = useState('document')
  const [refreshKey, setRefreshKey] = useState(Manager.getUid())

  const scrollToHeader = (headerText) => {
    const header = headerText.replaceAll(' ', '').replaceAll("'", '').replace('"', '').replaceAll('-', '')
    const domHeader = document.querySelector(`[data-header='${header}']`)
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
    const fileType = `.${StringManager.getFileExtension(docToView.name)}`
    setTimeout(() => {
      setState({ ...state, isLoading: true, loadingText: 'Converting your document image to text...' })
    }, 500)
    if (currentUser && fileType === '.docx') {
      setDocType('document')
      await getDoc()
    } else {
      setDocType('image')
      await getImage()
    }

    // Set ALL headers
    let userHeaders = await DB.getTable(`${DB.tables.documentHeaders}/${currentUser.phone}`)
    userHeaders = userHeaders.map((x) => x.headerText)
    let allHeaders = []
    if (Manager.isValid(userHeaders)) {
      allHeaders = [...predefinedHeaders, ...userHeaders].flat()
    } else {
      allHeaders = predefinedHeaders
    }
    setTocHeaders(allHeaders)
  }

  const search = async (searchValue) => {
    setState({ ...state, isLoading: true, loadingText: 'Finding and highlighting your search results...' })
    setTextWithHeaders('')
    await formatImageDocument(searchValue)
  }

  const formatImageDocument = async (searchValue) => {
    try {
      const allDocs = await SecurityManager.getDocuments(currentUser)
      let docOwner = await DB.find(DB.tables.users, ['phone', docToView?.ownerPhone], true)
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
        let userHeaders = await DB.getTable(`${DB.tables.documentHeaders}/${currentUser.phone}`)
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

        // FOR SEARCH
        if (Manager.isValid(searchValue, true)) {
          text = text.toLowerCase().replaceAll(searchValue, `<span class="search-highlight">${searchValue}</span>`)
        }
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
              `<span data-header=${dataHeader} class="header">${header}<span class="delete-header-button">X</span></span>`
            )
          } else {
            text = text.replaceAll(header, `<span data-header=${dataHeader} class="header">${header}</span>`)
          }
        }
        setTextWithHeaders(text)
        setTimeout(() => {
          setState({ ...state, isLoading: false, loadingText: '' })
        }, 300)
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

  const shouldAddClass = (el, text) => {
    if (text && text.length > 0) {
      const textToSkip = ['add additional terms']
      const isAllUppercase = StringManager.isAllUppercase(text)
      const classAlreadyAdded = el.classList.contains('header')
      const isMinimumLength = text.replaceAll(' ', '').length > 3
      const isDefinedHeader = predefinedHeaders.includes(text.toLowerCase())
      const dontSkip = !textToSkip.includes(text.toLowerCase())
      return isAllUppercase && !classAlreadyAdded && isMinimumLength && isDefinedHeader && dontSkip
    }
    return false
  }

  // Get/Append Doc
  const getDoc = async () => {
    const url = docToView.url
    const fileName = FirebaseStorage.getImageNameFromUrl(url)
    const textContainer = document.getElementById('text-container')

    const coparentDocsObjects = await SecurityManager.getDocuments(currentUser)
    if (!Manager.isValid(coparentDocsObjects)) {
      setState({ ...state, isLoading: false })
      return false
    }

    const coparentsFromObject = coparentDocsObjects.map((x) => x.coparent)
    if (!Manager.isValid(coparentsFromObject)) {
      setState({ ...state, isLoading: false })
      return false
    }
    const relevantDoc = coparentDocsObjects.filter((x) => x?.name === docToView?.name)[0]
    if (!Manager.isValid(relevantDoc)) {
      setState({ ...state, isLoading: false })
      return false
    }

    // Insert HTML
    const docHtml = await DocumentConversionManager.docToHtml(fileName, currentUser?.id)
    if (!Manager.isValid(docHtml, true)) {
      AlertManager.throwError('Unable to find or load document. Please try again after awhile.')
      setState({ ...state, isLoading: false, currentScreen: ScreenNames.docsList })
      return false
    }
    textContainer.innerHTML = docHtml

    // Format HTML
    const pars = textContainer.querySelectorAll('p, li')
    const listItems = textContainer.querySelectorAll('li')
    const containsLettersRegex = /[a-zA-Z]/g

    // List Item formatting
    listItems.forEach((listItem, index) => {
      if (StringManager.stringHasNumbers(listItem.textContent) && listItem.textContent.toLowerCase().indexOf('article') > -1) {
        listItem.classList.add('highlight')
      }

      // ADD HIGHLIGHT
      if (shouldAddClass(listItem, listItem.textContent)) {
        listItem.classList.add('highlight')
      }
      if (listItem.classList.contains('highlight')) {
        const header = listItem.textContent.replace(/ /g, '-').replace(/[0-9]/g, '').replace('.', '').replace(/\s/g, '')
        listItem.setAttribute('data-header-date', header)
      }

      const allStrongs = listItem.querySelectorAll('strong')
      allStrongs.forEach((thisStrong) => {
        if (shouldAddClass(thisStrong, thisStrong.textContent)) {
          thisStrong.classList.add('highlight')
        }
        DocumentConversionManager.addHeaderClass(thisStrong)
      })
      DocumentConversionManager.addHeaderClass(listItem)
      if (StringManager.wordCount(listItem.textContent) > 10) {
        listItem.classList.remove('highlight')
      }
    })

    // Header formatting
    pars.forEach((par, index) => {
      const text = par.textContent
      if (StringManager.stringHasNumbers(text) && text.toLowerCase().indexOf('article') > -1) {
        par.classList.add('header', 'w-100')
      }

      // ADD HIGHLIGHT
      if (shouldAddClass(par, text)) {
        par.classList.add('highlight')
      }

      const allStrongs = par.querySelectorAll('strong')
      allStrongs.forEach((thisStrong) => {
        if (shouldAddClass(thisStrong, thisStrong.textContent)) {
          thisStrong.classList.add('highlight')
        }
        DocumentConversionManager.addHeaderClass(thisStrong)
      })
      DocumentConversionManager.addHeaderClass(par)
    })

    // Cleanup unnecessary header classes
    pars.forEach((par) => {
      const text = par.textContent
      if (!containsLettersRegex.test(text)) {
        par.classList.remove('header', 'highlight')
        par.remove()
      }
      if (Manager.contains(text.toLowerCase(), 'notary public')) {
        par.classList.remove('header', 'highlight')
        // par.remove()
      }
      if (Manager.contains(text, '___')) {
        text.replace(/_/g, '')
      }
      if (StringManager.wordCount(text) > 10) {
        par.classList.remove('header')
      }
      if (par.classList.contains('header')) {
        const header = par.textContent.replace(/ /g, '-').replace(/[0-9]/g, '').replace('.', '').replace(/\s/g, '')
        par.setAttribute('data-header-date', header)
      }
    })

    // Set TOC headers
    const headers = document.querySelectorAll('.header, li.highlight, span.highlight, .toc-header')
    let newHeaderArray = []
    headers.forEach((header) => {
      const text = header.textContent
        .replaceAll(' ', '-')
        .replaceAll('-', ' ')
        .replace(/ /g, '-')
        .replace(/[0-9]/g, '')
        .replace('.', '')
        .replace(/\s/g, '')
        .replaceAll('•', '')
      if (newHeaderArray.indexOf(text) === -1 && StringManager.wordCount(header.textContent) < 10) {
        newHeaderArray.push(text)
      }
    })
    setTocHeaders(newHeaderArray.sort())
  }

  // Get/Append Image
  const getImage = async () => {
    await formatImageDocument()
  }

  const deleteHeader = async (headerText) => {
    const header = await DB.find(`${DB.tables.documentHeaders}/${currentUser.phone}`, ['headerText', headerText])
    if (header) {
      await DB.deleteById(`${DB.tables.documentHeaders}/${currentUser.phone}`, header.id)
      await getImage()
    }
  }

  const addUserHeaderToDatabase = () => {
    const text = DomManager.getSelectionText()

    if (text.length > 0 && currentScreen === ScreenNames.docViewer) {
      AlertManager.confirmAlert('Would you like to use the selected text as a header?', 'Yes', true, async () => {
        const header = new DocumentHeader()
        header.headerText = text.toLowerCase().replaceAll("'", '')
        header.ownerPhone = currentUser.phone
        await DB.add(`${DB.tables.documentHeaders}/${currentUser.phone}`, header)
        setTextWithHeaders('')

        await getImage()
      })
    }
  }

  const addHeaderClickHandler = async (textWrapper) => {
    const headers = textWrapper.querySelectorAll('.header')
    if (Manager.isValid(headers)) {
      for (let header of headers) {
        header.addEventListener('click', async (e) => {
          const buttonParent = e.target.parentNode
          if (buttonParent) {
            let headerText = buttonParent.textContent.replace('X', '').replace(' ', '')
            headerText = headerText.toLowerCase()
            headerText = StringManager.addSpaceBetweenWords(headerText)
            headerText = StringManager.uppercaseFirstLetterOfAllWords(headerText)
            console.log(headerText)
            await deleteHeader(headerText)
          }
        })
      }
    }
  }

  const onTableChange = async () => {
    setState({ ...state, isLoading: true })
    const dbRef = ref(getDatabase())
    onValue(child(dbRef, `${DB.tables.documentHeaders}/${currentUser.phone}`), async (snapshot) => {
      await onLoad()
    })
  }

  const closeSearch = async () => {
    setShowSearch(false)
    setRefreshKey(Manager.getUid())
    const searchHighlights = document.querySelectorAll('.search-highlight')
    if (Manager.isValid(searchHighlights)) {
      for (let highlight of searchHighlights) {
        highlight.classList.remove('search-highlight')
      }
    }
  }

  // Add header click handler when text is in DOM
  useEffect(() => {
    const imageText = document.getElementById('image-text')
    if (Manager.isValid(imageText)) {
      addHeaderClickHandler(imageText).then((r) => r)
    }
  }, [document.getElementById('image-text')])

  useEffect(() => {
    onTableChange().then((r) => r)
    const textContainer = document.getElementById('text-container')
    if (textContainer) {
      document.getElementById('text-container').innerText = ''
    }
    const appContentWithSidebar = document.getElementById('app-content-with-sidebar')
    if (appContentWithSidebar) {
      appContentWithSidebar.classList.add('doc-viewer')
    }

    // Listen for selection change
    document.addEventListener('selectionchange', debounce(addUserHeaderToDatabase, 1000))
  }, [])

  return (
    <div className="doc-viewer-container">
      {/* BOTTOM ACTIONS */}
      <div className={`${theme} flex form`} id="bottom-actions">
        {Manager.isValid(document.querySelectorAll('.header'), true) && (
          <div id="toc-button" className={`${theme}`} onClick={() => setShowToc(true)}>
            Table of Contents
          </div>
        )}
      </div>

      {/* SEARCH CARD */}
      <BottomCard
        wrapperClass="doc-search-card"
        hasSubmitButton={false}
        className="form search-card"
        showCard={showSearch}
        title={'Search'}
        refreshKey={refreshKey}
        showOverlay={false}
        onClose={closeSearch}>
        <div className="flex">
          <InputWrapper placeholder="Enter text to search for..." onChange={(e) => search(e.target.value)} inputValueType="text" />
        </div>
      </BottomCard>

      {/* TABLE OF CONTENTS */}
      {Manager.isValid(document.querySelectorAll('.header'), true) && (
        <BottomCard
          wrapperClass="toc-card"
          hasSubmitButton={false}
          showCard={showToc}
          onClose={() => setShowToc(false)}
          className="toc"
          title={'Table of Contents'}>
          <div id="table-of-contents">
            <button
              id="toc-scroll-button"
              className="button default center mt-5"
              onClick={() => {
                setShowToc(false)
                let allHeaders = document.querySelectorAll('.header')
                if (Manager.isValid(allHeaders)) {
                  allHeaders = Array.from(allHeaders)
                  allHeaders[0].scrollIntoView({ block: 'center', behavior: 'smooth' })
                }
              }}>
              Scroll to top
            </button>
            <div id="toc-contents">
              {tocHeaders.length > 0 &&
                tocHeaders.sort().map((header, index) => {
                  const dataHeader = header.replaceAll(' ', '').replaceAll("'", '').replace('"', '')
                  header = header.replace(/ /g, '-').replace(/[0-9]/g, '').replace('.', '').replace(/\s/g, '')
                  const domHeader = document.querySelector(`[data-header='${dataHeader}']`)
                  return (
                    <span key={index}>
                      <TableOfContentsListItem
                        text={`> ${header}`}
                        classes={domHeader ? 'show' : 'hide'}
                        dataHeader={dataHeader}
                        onClick={() => {
                          setShowToc(false)
                          scrollToHeader(header)
                        }}
                      />
                    </span>
                  )
                })}
            </div>
          </div>
        </BottomCard>
      )}

      {/* SEARCH ICON FOR 800PX > */}
      {!DomManager.isMobile() && (
        <div id="desktop-search-button-wrapper">
          <TbFileSearch id={'desktop-search-button'} onClick={() => setShowSearch(true)} />
        </div>
      )}

      {/* PAGE CONTAINER / TEXT */}
      <div id="documents-container" className={`${theme} page-container form documents`}>
        {/* DOC NAME */}
        {!DomManager.isMobile() && docType === 'image' && <p id="image-name">{StringManager.removeFileExtension(docToView?.name)}</p>}
        <p className="screen-title pt-10">Doc Viewer</p>
        {/* DOC NAME */}
        {DomManager.isMobile() && docType === 'image' && <p id="image-name">{StringManager.removeFileExtension(docToView?.name)}</p>}
        {/* IMAGE */}
        {docType === 'image' && (
          <>
            <LightGallery elementClassNames={`light-gallery ${theme}`} speed={500} selector={'#document-image'}>
              <img data-src={imgUrl} id="document-image" src={imgUrl} alt="" />
            </LightGallery>
            <div id="image-text" dangerouslySetInnerHTML={{ __html: textWithHeaders }} />
          </>
        )}
        {/* DOCUMENT */}
        {docType === 'document' && <div id="text-container"></div>}
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