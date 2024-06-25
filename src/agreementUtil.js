import util from "./util";
import Tesseract from "tesseract.js";
import { createWorker } from "tesseract.js";

const AgreementUtil = {
  tocHeaders: [
    "child-support",
    "spousal-maintenance",
    "matrimonial-home",
    "assets",
    "debts",
    "equitable-distribution-release",
    "dower-curtesy-and-homestead-release",
    "between",
    "background",
    "living-separate-and-apart",
    "interference",
    "children",
    "child-custody",
    "estate-and-testamentary-disposition",
    "pension-release",
    "general-release",
    "general-provisions",
    "acknowledgement",
    "separation",
    "division-of-property",
    "real-estate",
    "household-goods-and-furnishings",
    "motor-vehicles",
    "financial-accounts",
    "incomes-taxes",
    "definitions",
    "the-distribution",
    "mutual-releases-indemnification-and-litigation",
    "custody-and-visitation",
    "spousal-support",
    "the-family-residence",
    "retirement-benefits",
    "husbands-separate-property",
    "wifes-separate-property",
  ],
  cleanHeader: (header, uppercaseAll = false, uppercaseFirstWord) => {
    let returnString = header.replaceAll("-", " ");
    if (uppercaseAll) {
      returnString = returnString.toUpperCase();
    }
    if (uppercaseFirstWord) {
      returnString = util.uppercaseFirstLetterInWord;
    }
    return returnString.replaceAll("'", "");
  },
  formatDocHeaders: (text) => {
    AgreementUtil.tocHeaders.forEach((header) => {
      text = text.replaceAll(AgreementUtil.cleanHeader(header, true), `<span data-header-name="${header.replaceAll("'", "&apos;")}" class="header">${AgreementUtil.cleanHeader(header)}</span>`);
    });
    return text;
  },
  textToImageAndAppend: async (imagePath, textContainer) => {
    const worker = await createWorker();
    await worker.recognize(imagePath).then((result) => {
      let confidence = result.confidence;
      let paragraphs = result.data.paragraphs;

      paragraphs.forEach((par) => {
        const parEl = document.createElement("p");
        par.text = AgreementUtil.formatDocHeaders(par.text);
        parEl.innerHTML = par.text;
        textContainer.appendChild(parEl);
      });
    });
  },
};

export default AgreementUtil;
