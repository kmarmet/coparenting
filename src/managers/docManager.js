import Manager from '@manager'
import { createWorker } from 'tesseract.js'
import FirebaseStorage from '@firebaseStorage'

const DocManager = {
  tocHeaders: [
    'child-support',
    'spousal-maintenance',
    'matrimonial-home',
    'assets',
    'debts',
    'equitable-distribution-release',
    'dower-curtesy-and-homestead-release',
    'between',
    'background',
    'living-separate-and-apart',
    'interference',
    'children',
    'child-custody',
    'estate-and-testamentary-disposition',
    'pension-release',
    'general-release',
    'general-provisions',
    'acknowledgement',
    'division-of-property',
    'real-estate',
    'household-goods-and-furnishings',
    'motor-vehicles',
    'financial-accounts',
    'incomes-taxes',
    'definitions',
    'the-distribution',
    'mutual-releases-indemnification-and-litigation',
    'custody-and-visitation',
    'spousal-support',
    'the-family-residence',
    'retirement-benefits',
    'husbands-separate-property',
    'wifes-separate-property',
    'severability-and-enforceability',
    'law-applicable',
    'introductory-provisions',
    'property',
    'purpose-of-agreement',
  ],
  documentApiUrl: () => {
    if (window.location.hostname === 'localhost') {
      return 'https://localhost:5000/document/getdoctext'
    } else {
      return 'https://pcp-node.netlify.app/.netlify/functions/app/'
    }
  },
  docToHtml: async (fileName, currentUserId) => {
    const myHeaders = new Headers()
    myHeaders.append('Access-Control-Allow-Origin', '*')

    const requestOptions = {
      method: 'GET',
      headers: myHeaders,
      mode: 'cors',
      crossOrigin: true,
      redirect: 'follow',
    }

    let returnHtml = ''
    const all = await FirebaseStorage.getImageAndUrl(FirebaseStorage.directories.documents, currentUserId, fileName)
    const { status, imageUrl } = all
    if (status === 'success') {
      await fetch(`https://peaceful-coparenting.app:5000/document/getDocText?fileName=${fileName}&currentUserId=${currentUserId}`, requestOptions)
        .then((response) => response.text())
        .then((result) => (returnHtml = result))
        .catch((error) => console.error(error))
    }

    return returnHtml
  },
  hasNumbers: (str) => {
    var regex = /\d/g
    return regex.test(str)
  },
  cleanHeader: (header, uppercaseAll = false, uppercaseFirstWord) => {
    let returnString = header.replaceAll('-', ' ')
    if (uppercaseAll) {
      returnString = returnString.toUpperCase()
    }
    if (uppercaseFirstWord) {
      returnString = returnString.uppercaseFirstLetterInWord()
    }
    return returnString.replaceAll("'", '')
  },
  formatDocHeaders: (text) => {
    DocManager.tocHeaders.forEach((header) => {
      text = text.replaceAll(
        DocManager.cleanHeader(header, true),
        `<span data-header-name="${header.replaceAll("'", '&apos;')}" class="header">${DocManager.cleanHeader(header)}</span>`
      )
    })
    return text
  },
  imageToTextAndAppend: async (imagePath, textContainer) => {
    const worker = await createWorker()
    await worker.recognize(imagePath).then((result) => {
      let confidence = result.confidence
      let paragraphs = result.data.paragraphs

      paragraphs.forEach((par) => {
        if (DocManager.hasNumbers(par.text) && par.text.trim().split(/\s+/).length <= 10) {
          par.text = `<span className="sub-header">${par.text}</span>`
        }
        const parEl = document.createElement('p')
        par.text = DocManager.formatDocHeaders(par.text)

        parEl.innerHTML = par.text
        textContainer.appendChild(parEl)
      })
    })
  },
  addHeaderClass: (el) => {
    let strong = el.querySelector('strong')

    if (el.tagName.toLowerCase() === 'strong') {
      if (Manager.isValid(el)) {
        const strongText = el.textContent
        const hasNumbers = strongText.indexOf('.') > -1
        if (hasNumbers && strongText.wordCount() < 6 && strongText.length > 3) {
          el.parentNode.classList.add('header')
        }
        if (strongText.wordCount() <= 6 && strongText.length > 5) {
          if (strongText.toLowerCase().indexOf('state') === -1 && strongText.toLowerCase().indexOf('county') === -1) {
            el.parentNode.classList.add('header')
          } else {
            el.parentNode.classList.remove('header')
          }
        }
      }
    } else {
      if (Manager.isValid(strong)) {
        const strongText = strong.textContent
        const hasNumbers = strongText.indexOf('.') > -1
        if (hasNumbers && strongText.wordCount() < 6 && strongText.length > 3) {
          el.classList.add('header')
        }
        if (strongText.wordCount() <= 6 && strongText.length > 5) {
          if (strongText.toLowerCase().indexOf('state') === -1 && strongText.toLowerCase().indexOf('county') === -1) {
            el.classList.add('header')
          }
        }
      }
    }
  },
}

export default DocManager