import React, { useContext, useEffect } from 'react'
import Modal from '../../shared/modal.jsx'
import { ImAppleinc } from 'react-icons/im'
import { IoLogoVenmo } from 'react-icons/io5'
import { SiCashapp, SiZelle } from 'react-icons/si'
import { LiaCcPaypal } from 'react-icons/lia'
import globalState from '../../../context.js'
import Spacer from '../../shared/spacer'

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

  useEffect(() => {
    console.log('ran')
  }, [])

  return (
    <>
      <Modal
        hasSubmitButton={false}
        subtitle="There are numerous straightforward and cost-free methods available for transferring money to a co-parent for expenses or other purposes. Please review the options below to determine which one suits your needs best."
        title={'Payment/Transfer Options'}
        className="payment-options-card"
        wrapperClass="payment-options-card"
        onClose={onClose}
        showCard={showPaymentOptionsCard}>
        {showPaymentOptionsCard &&
        <div id="payment-options-card">
          <Spacer height={5} />
          <div className="options">
            {/* ZELLE */}
            <div className="option zelle">
              <div className="flex brand-name-wrapper zelle">
                <SiZelle className={'zelle-icon'} />
                <p className="brand-name accent">Zelle</p>
              </div>
              <div className="flex">
                <div className="text">
                  <p className={`${theme} description payment-options`}>Safely send money to co-parent, no matter where they bank.</p>
                  <a href={zelleLink} target="_blank" className="setup-instructions" rel="noreferrer">
                    Learn More
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

            <Spacer height={5} />
            {/* VENMO */}
            <div className="option venmo">
              <div className="flex brand-name-wrapper venmo">
                <IoLogoVenmo className={'venmo-icon'} />
                <p className="brand-name">Venmo</p>
              </div>
              <div className="flex">
                <div className="text">
                  <p className={`${theme} description payment-options`}>Fast, safe, social payments.</p>
                  <a href={venmoLink} target="_blank" className="setup-instructions" rel="noreferrer">
                    Learn More
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

            <Spacer height={5} />

            {/* APPLE PAY */}
            <div className="option apple-cash">
              <div className="flex brand-name-wrapper apple">
                <ImAppleinc className={'apple-icon'} />
                <p className="brand-name">Apple Cash</p>
              </div>
              <div className="flex ">
                <div className="text">
                  <p className={`${theme} description payment-options`}>Use Apple Cash to send and receive money with people you know.</p>
                  <a href={appleLink} target="_blank" className="setup-instructions" rel="noreferrer">
                    Learn More
                  </a>
                </div>
              </div>
            </div>

            <Spacer height={5} />
            {/* PAYPAL */}
            <div className="option paypal">
              <div className="flex brand-name-wrapper paypal">
                <LiaCcPaypal className={'paypal-icon'} />
                <p className="brand-name">PayPal</p>
              </div>
              <div className="flex">
                <div className="text">
                  <p className={`${theme} description payment-options`}>Send and request money, quickly and securely.</p>
                  <a href={paypalLink} target="_blank" className="setup-instructions" rel="noreferrer">
                    Learn More
                  </a>
                </div>
              </div>
            </div>

            <Spacer height={5} />
            {/* CASHAPP */}
            <div className="option cashapp">
              <div className="flex brand-name-wrapper cashapp">
                <SiCashapp />
                <p className="brand-name">CashApp</p>
              </div>
              <div className="flex">
                <div className="text">
                  <p className={`${theme} description payment-options`}>Pay anyone, instantly.</p>
                  <a href={cashappLink} target="_blank" className="setup-instructions" rel="noreferrer">
                    Learn More
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
        }
      </Modal>
    </>
  )
}