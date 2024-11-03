import React, { useContext, useEffect, useState } from 'react'
import globalState from '../context'
import Manager from 'managers/manager'
import PopupCard from './shared/popupCard'
import { Accordion } from 'rsuite'
import { FaApple } from 'react-icons/fa6'
import { BsAndroid2 } from 'react-icons/bs'
import { FaChevronDown, FaChevronUp } from 'react-icons/fa'

export default function InstallAppPopup() {
  const { state, setState } = useContext(globalState)
  const [expandAppleAccordion, setExpandAppleAccordion] = useState(false)
  const [expandAndroidAccordion, setExpandAndroidAccordion] = useState(false)

  useEffect(() => {
    Manager.showPageContainer('hide')
  }, [])

  return (
    <PopupCard
      onClose={() => document.querySelector('.install-app').classList.remove('active')}
      subtitle="LESS steps than App Store or Google Play!"
      className={`install-app`}
      title={'Install App <span class="material-icons-outlined">install_mobile</span>'}>
      <div className="content">
        <Accordion>
          <p className="accordion-header mb-5" onClick={(e) => setExpandAppleAccordion(!expandAppleAccordion)}>
            iOS <FaApple /> {expandAppleAccordion ? <FaChevronDown /> : <FaChevronUp />}
          </p>
          <Accordion.Panel expanded={expandAppleAccordion}>
            <div className="os-container apple">
              <p className="while-viewing">While viewing the website...</p>
              <div className="flex steps">
                <div className="flex">
                  <span className="step-number">1.</span>
                  <p>
                    Tap the Share button <span className="material-icons round">ios_share</span> in the menu bar
                  </p>
                </div>

                <div className="flex">
                  <span className="step-number">2.</span>
                  <p>
                    Scroll and tap <span className="emphasize">Add to Home Screen</span>
                  </p>
                </div>

                <div className="flex">
                  <span className="step-number">3.</span>
                  <p>Tap the new icon on your Home Screen</p>
                </div>

                <p className="emphasize no-bold more-padding mb-10">
                  If you don’t see Add to Home Screen, you can add it. Scroll down to the bottom of the list, tap Edit Actions, then tap Add to Home
                  Screen.
                </p>
              </div>
            </div>
          </Accordion.Panel>
        </Accordion>
        <Accordion>
          <p className="accordion-header mb-5 android" onClick={(e) => setExpandAndroidAccordion(!expandAndroidAccordion)}>
            Android <BsAndroid2 />
            {expandAndroidAccordion ? <FaChevronDown /> : <FaChevronUp />}
          </p>
          <Accordion.Panel expanded={expandAndroidAccordion}>
            <div className="os-container android">
              <p className="while-viewing">While viewing the website...</p>
              <div className="flex steps">
                <div className="flex">
                  <span className="step-number">1.</span>
                  <p>Tap the menu icon</p>
                </div>

                <div className="flex">
                  <span className="step-number">2.</span>
                  <p>
                    Tap <span className="emphasize">Add to Home Screen</span>
                  </p>
                </div>

                <div className="flex">
                  <span className="step-number">3.</span>
                  <p>Choose a name for the website shortcut</p>
                </div>

                <div className="flex">
                  <span className="step-number">4.</span>
                  <p>Tap on the new icon on your Home Screen</p>
                </div>
              </div>
            </div>
          </Accordion.Panel>
        </Accordion>
      </div>
    </PopupCard>
  )
}
