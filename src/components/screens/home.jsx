import React, { useContext, useEffect, useState } from 'react'
import { contains, formatNameFirstNameOnly } from '../../globalFunctions'
import globalState from '../../context'
import { Fade } from 'react-awesome-reveal'
import { PiCalendarDotsDuotone, PiMoneyWavyDuotone } from 'react-icons/pi'
import { AiTwotoneMessage, AiTwotoneSafetyCertificate, AiTwotoneTool } from 'react-icons/ai'
import DomManager from '../../managers/domManager'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import firebaseConfig from '../../firebaseConfig'
import { initializeApp } from 'firebase/app'
import { TbSunMoon } from 'react-icons/tb'
import { FaWandMagicSparkles } from 'react-icons/fa6'
import MemoriesImage from '../../img/homepage/memories.png'
import ChildInfoImage from '../../img/homepage/childInfo.png'
import CalendarImage from '../../img/homepage/calendar.png'
import MenuImage from '../../img/homepage/menu.png'
import ExpensesImage from '../../img/homepage/expense-tracker.png'
import TabletImage from '../../img/homepage/devices/tablet.png'
import LaptopImage from '../../img/homepage/devices/laptop.png'
import PhoneImage from '../../img/homepage/devices/phone.png'
import Logo from '../../img/logo.png'
import ScreenNames from '@screenNames'

function LazyImage({ show, importedImage, imagesObjectPropName }) {
  const [showImage, setShowImage] = useState(false)

  useEffect(() => {
    if (show) {
      setShowImage(true)
    }
  }, [show])

  return (
    <div className="img-wrapper" data-name={imagesObjectPropName}>
      {showImage && (
        <Fade>
          <img src={importedImage} className={`lazy-loaded-image`} />
        </Fade>
      )}
      {!showImage && <img id="lazy-loaded-img-placeholder" src={require('../../img/loading.gif')} />}
    </div>
  )
}

export default function Home() {
  const { state, setState } = useContext(globalState)
  const { theme, currentUser } = state
  const [loadedImages, setLoadedImages] = useState([])

  // Init Firebase
  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)

  useEffect(() => {
    const pageContainer = document.querySelector('.page-container')

    if (pageContainer) {
      const imageWrappers = document.querySelectorAll('.img-wrapper')
      DomManager.addScrollListener(
        pageContainer,
        () => {
          for (let imageWrapper of imageWrappers) {
            const imagesObjectPropName = imageWrapper.dataset.name
            if (DomManager.isInViewport(imageWrapper)) {
              setLoadedImages([...loadedImages, imagesObjectPropName])
            }
          }
        },
        0
      )
    }

    onAuthStateChanged(auth, async (user) => {
      if (user) {
        // console.log(user)
        // User is signed in.
        // setState({ ...state, isLoading: true })
      } else {
        // No user is signed in.
        setState({ ...state, isLoading: false })
      }
    })
  }, [])

  return (
    <div className="page-container home" id="home-screen-wrapper">
      {/* NAVBAR */}
      <div id="home-navbar" className="flex">
        <img src={Logo} id="logo" />
        <div id="login-buttons">
          {/*<button id="register-button" onClick={() => setState({ ...state, currentScreen: ScreenNames.registration })}>*/}
          {/*  Sign Up <IoPersonAddOutline />*/}
          {/*</button>*/}
          {/*<button id="login-button" className="default default button" onClick={() => setState({ ...state, currentScreen: ScreenNames.login })}>*/}
          {/*  Log In <AiTwotoneUnlock />*/}
          {/*</button>*/}
          <button id="login-button" className="default default button" onClick={() => setState({ ...state, currentScreen: ScreenNames.login })}>
            Get Started
          </button>
        </div>
      </div>
      {/* ABOVE FOLD */}
      <div id="above-fold-wrapper" className="section above-fold">
        <Fade>
          <div className="section page-title">
            {DomManager.isMobile() && (
              <>
                <p id="title" className="mobile">
                  Peaceful
                </p>
                <p id="title" className="mobile">
                  Co-Parenting
                </p>
              </>
            )}
            {!DomManager.isMobile() && <p id="title">Peaceful Co-Parenting</p>}
            <p id="subtitle">Built for Families - Focused on Peace</p>
          </div>
        </Fade>
        {!DomManager.isMobile() && (
          <div className="flex" id="images">
            <img src={CalendarImage} />
            <img src={MemoriesImage} />
            <img src={ChildInfoImage} />
          </div>
        )}
        {DomManager.isMobile() && (
          <div className="flex" id="images">
            <div id="single-image">
              <img src={CalendarImage} />
            </div>
            <div className="flex" id="double-images">
              <img src={MemoriesImage} />
              <img src={ChildInfoImage} />
            </div>
          </div>
        )}
      </div>
      <div id="below-fold-intro-text" className="section">
        <p>
          Our app provides a stress-free way to manage co-parenting by enhancing communication, scheduling, and decision-making, so{' '}
          <b>you can focus on what matters most, your children's well-being</b>.
        </p>
      </div>
      {/* BELOW FOLD */}
      <div id="below-fold-wrapper">
        {/* MAIN CONTENT */}
        <Fade>
          <div className="flex boxes section">
            <div className="text-box">
              <PiCalendarDotsDuotone />
              <p className="text-box-title"> Streamline your Parenting Schedule </p>
              <p className="text-box-subtitle">Shared Calendars, Real-Time Updates, and Reminders</p>
              <p className="text-box-main-text">
                Easily coordinate visitation, school events, and extracurricular activities with our intuitive scheduling tool. Ensuring both parents
                stay on the same page without the hassle.
              </p>
            </div>
            <div className="text-box with-bg">
              <AiTwotoneMessage />
              <p className="text-box-title"> Effective Communication without Conflict </p>
              <p className="text-box-subtitle">Clear Messaging for Healthier Conversations</p>
              <p className="text-box-main-text">
                Facilitate positive communication with in-app messaging designed to reduce misunderstandings. All interactions are organized and
                documented to maintain clarity and peace of mind.
              </p>
            </div>
          </div>
        </Fade>
        <Fade>
          <div id="collaboration" className="section text-box flex">
            <FaWandMagicSparkles />
            <div className="text-wrapper">
              <p className="title">Collaborate on Decisions that Matter Most</p>
              <p className="text subtitle">
                From medical appointments to school choices, collaborate effectively through our platform’s decision-making tools, keeping your
                child’s best interests at the forefront.
              </p>
              <p className="text">
                Co-parenting peacefully requires a lot of tools and resources. With that in mind, everything you need can be found in our menu - no
                time spent looking for anything!
              </p>
              <p>
                Our mission is to provide a supportive space where you and your co-parent can reduce stress and focus on creating a harmonious
                environment for your children.
              </p>
            </div>
            <LazyImage show={loadedImages.includes('menu')} importedImage={MenuImage} imagesObjectPropName={'menu'} />
          </div>
        </Fade>
        <Fade>
          <div id="expenses-wrapper" className="section expenses">
            <PiMoneyWavyDuotone />
            <div className="text-wrapper">
              <p className="title">Track Expenses and Share Responsibilities</p>
              <p className="subtitle">Transparency in Shared Financial Responsibilities</p>
              <p className="text">
                Manage shared expenses like childcare, education, and extracurricular costs with our expense tracking feature, making it easy to split
                costs and avoid conflicts over money.
              </p>
            </div>
            <LazyImage importedImage={ExpensesImage} imagesObjectPropName={'expenses'} show={loadedImages.includes('expenses')} />
          </div>
        </Fade>

        <Fade>
          <div className="section text-box all-devices" id="all-devices">
            <TbSunMoon />
            <p className="title">Compatible & Accessible</p>
            <div className="flex text">
              <p className="subtitle">
                <b>Available on All Devices: </b>
              </p>
              <span>iOS, Android, Windows, Mac, .etc.</span>
            </div>
            <div className="flex text">
              <p className="subtitle">
                <b>Available on All Screen Sizes: </b>
              </p>
              <span>Adapts to any screen size (phone, tablet, laptop, .etc) and/or screen orientation.</span>
            </div>
            <div className="flex text">
              <p className="subtitle">
                <b>Supports both Light & Dark Modes: </b>
              </p>
              <span>
                Whether you are visually impaired, or glare is a concern due to lighting - we got you covered! Our application supports Light and Dark
                mode that can be toggled at the tap of a button.
              </span>
            </div>

            <div className="flex images mt-15">
              <LazyImage importedImage={PhoneImage} imagesObjectPropName={'phone'} show={loadedImages.includes('phone')} className="phone" />
              <LazyImage importedImage={LaptopImage} imagesObjectPropName={'laptop'} show={loadedImages.includes('laptop')} className="laptop" />
              <LazyImage importedImage={TabletImage} imagesObjectPropName={'tablet'} show={loadedImages.includes('tablet')} className="tablet" />
            </div>

            <p className="subtitle mt-25 mb-0" id="multiple-device-usage">
              You can use the application across multiple devices and all of your data will be kept in sync across them all!
            </p>
          </div>
        </Fade>

        {/* FOOTER WRAPPER */}
        <div id="footer-wrapper">
          <Fade>
            <div className="box section security-and-privacy with-bg">
              <AiTwotoneSafetyCertificate />
              <p className="title">Security & Privacy</p>
              <p className="subtitle">Transparency in Shared Financial Responsibilities</p>
              <p className="text">
                <b>Custom Sharing: </b> Keep control over what co-parents see by selecting the "share with" checkbox for events, expenses , and
                important information.
              </p>
              <p className="text">
                <b>Enhanced Protection: </b> Enjoy peace of mind with SMS code verification for password recovery, and secure registration for both
                parents and children.
              </p>
            </div>
          </Fade>
        </div>
        <Fade>
          <div className="flex" id="double">
            <div className="text-wrapper text-only box">
              <AiTwotoneTool />
              <p className="title">Flexible Co-Parenting Tools</p>
              <p className="text">
                <b>Swap Requests:</b> Need a schedule change? Easily request new times or locations for child transfers with just a few clicks.
              </p>
              <p className="text">
                <b>Shared Calendar:</b> Seamlessly plan and manage visitations, holidays, and paydays with icons, search functionality, and automatic
                reminders.
              </p>
              <p className="text">
                <b>Expense Tracker:</b> Stay on top of shared costs by uploading receipts, tracking expenses with live due date countdowns, and
                sending reminders to the responsible co-parent.
              </p>
            </div>
            <div className="text-wrapper text-only  box">
              <AiTwotoneMessage />
              <p className="title">Streamlined Communication</p>
              <p className="text">
                <b>Easy Messaging: </b> Keep conversations organized with features like message archiving, bookmarking, and a powerful search tool for
                quick access to important chats.
              </p>
              <p className="text">
                <b>Multimedia Sharing</b> Share memories in real-time by uploading photos and milestones with your co-parent, helping you both stay
                connected with your child's journey.
              </p>
            </div>
          </div>
        </Fade>
      </div>
    </div>
  )
}