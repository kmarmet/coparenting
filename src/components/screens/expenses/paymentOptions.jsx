// Path: src\components\screens\expenses\paymentOptions.jsx
import BottomCard from '../../shared/bottomCard.jsx'
import { RxOpenInNewWindow } from 'react-icons/rx'
import { ImAppleinc } from 'react-icons/im'
import { IoLogoVenmo } from 'react-icons/io5'
import { SiCashapp, SiZelle } from 'react-icons/si'
import { LiaCcPaypal } from 'react-icons/lia'
import globalState from '../../../context.js'
import { useContext } from 'react'

const zelleLink = 'https://www.zellepay.com/how-it-works'
const zelleVideoLink = 'https://www.youtube.com/embed/FhL1HKUOStM?si=0xzdELJcIfnbHIRO'
const venmoLink = 'https://help.venmo.com/hc/en-us/articles/209690068-How-to-Sign-Up-for-a-Personal-Venmo-Account'
const venmoVideoLink = 'https://www.youtube.com/embed/zAqz0Kzootg'
const appleLink = 'https://support.apple.com/en-us/105013'
const paypalLink = 'https://www.paypal.com/us/digital-wallet/send-receive-money'
const cashappLink = 'https://cash.app/help/6485-getting-started-with-cash-app'

export default function PaymentOptions({ onClose, showPaymentOptionsCard }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  return (
    <>
      <BottomCard
        hasSubmitButton={false}
        subtitle="There are a multitude of simple and FREE ways to send money to a co-parent for expenses, or for any other reason. Please look below to
              see which option works best for you."
        title={'Payment/Transfer Options'}
        className="payment-options-card"
        wrapperClass="payment-options-card"
        onClose={onClose}
        showCard={showPaymentOptionsCard}>
        <div id="payment-options-card">
          <div className="options">
            {/* ZELLE */}
            <div className="option zelle">
              <div className="flex brand-name-wrapper zelle">
                <p className="brand-name accent mr-10">Zelle</p>
                <SiZelle className={'zelle-icon'} />
              </div>
              <div className="flex">
                <div className="text">
                  <p className={`${theme} description payment-options`}>Safely send money to co-parent, no matter where they bank.</p>
                  <a href={zelleLink} target="_blank" className="setup-instructions mb-10">
                    Learn More <RxOpenInNewWindow className={'new-tab-icon'} />
                  </a>
                </div>
              </div>
              <iframe
                width="560"
                height="315"
                src={zelleVideoLink}
                title="Zelle® | How it Works"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen></iframe>
            </div>
            <hr />
            {/* VENMO */}
            <div className="option venmo">
              <div className="flex brand-name-wrapper venmo">
                <p className="brand-name mr-10">Venmo</p>
                <IoLogoVenmo className={'venmo-icon'} />
              </div>
              <div className="flex">
                <div className="text">
                  <p className={`${theme} description payment-options`}>Fast, safe, social payments.</p>
                  <a href={venmoLink} target="_blank" className="setup-instructions mb-10">
                    Learn More <RxOpenInNewWindow className={'new-tab-icon'} />
                  </a>
                </div>
              </div>
              <iframe
                src={venmoVideoLink}
                title="Paying or Requesting Payment From Multiple Users in a Single Transaction"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen></iframe>
            </div>
            <hr />

            {/* APPLE PAY */}
            <div className="option apple-cash">
              <div className="flex brand-name-wrapper apple">
                <p className="brand-name mr-10">Apple Cash</p>
                <ImAppleinc className={'apple-icon'} />
              </div>
              <div className="flex ">
                <div className="text">
                  <p className={`${theme} description payment-options`}>Use Apple Cash to send and receive money with people you know.</p>
                  <a href={appleLink} target="_blank" className="setup-instructions mb-10">
                    Learn More <RxOpenInNewWindow className={'new-tab-icon'} />
                  </a>
                </div>
              </div>
            </div>
            <hr />
            {/* PAYPAL */}
            <div className="option paypal">
              <div className="flex brand-name-wrapper paypal">
                <p className="brand-name mr-10">PayPal</p>
                <LiaCcPaypal className={'paypal-icon'} />
              </div>
              <div className="flex">
                <div className="text">
                  <p className={`${theme} description payment-options`}>Send and request money, quickly and securely.</p>
                  <a href={paypalLink} target="_blank" className="setup-instructions mb-10">
                    Learn More <RxOpenInNewWindow className={'new-tab-icon'} />
                  </a>
                </div>
              </div>
            </div>
            <hr />
            {/* CASHAPP */}
            <div className="option cashapp">
              <div className="flex brand-name-wrapper cashapp">
                <p className="brand-name mr-10">CashApp</p>
                <SiCashapp />
              </div>
              <div className="flex">
                <div className="text">
                  <p className={`${theme} description payment-options`}>Pay anyone, instantly.</p>
                  <a href={cashappLink} target="_blank" className="setup-instructions mb-10">
                    Learn More <RxOpenInNewWindow className={'new-tab-icon'} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </BottomCard>
    </>
  )
}
