import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../context'
import { Fade } from 'react-awesome-reveal'
import { PiCalendarDotsDuotone, PiMoneyWavyDuotone } from 'react-icons/pi'
import { AiTwotoneMessage, AiTwotoneSafetyCertificate, AiTwotoneTool } from 'react-icons/ai'
import DomManager from '/src/managers/domManager'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import firebaseConfig from '/src/firebaseConfig'
import { initializeApp } from 'firebase/app'
import { TbSunMoon } from 'react-icons/tb'
import MemoriesImage from '/src/img/homepage/memories.png'
import ChildInfoImage from '/src/img/homepage/childInfo.png'
import CalendarImage from '/src/img/homepage/calendar.png'
import MenuImage from '/src/img/homepage/menu.png'
import ExpensesImage from '/src/img/homepage/expense-tracker.png'
import TabletImage from '/src/img/homepage/devices/tablet.png'
import LaptopImage from '/src/img/homepage/devices/laptop.png'
import PhoneImage from '/src/img/homepage/devices/phone.png'
import Logo from '/src/img/logo.png'
import 'pure-react-carousel/dist/react-carousel.es.css'
import { MdOutlineStar } from 'react-icons/md'
import { FaRegHandshake } from 'react-icons/fa'
import { useLongPress } from 'use-long-press'
import ScreenNames from '/src/constants/screenNames'
import Manager from '/src/managers/manager'
import LightGallery from 'lightgallery/react'
import 'lightgallery/css/lightgallery.css'
import AppManager from '/src/managers/appManager.js'
import HomescreenSections from '/src/models/homescreenSections.js'

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
          <img alt="Peaceful coParenting" src={importedImage} className={`lazy-loaded-image`} />
        </Fade>
      )}
      {!showImage && <img alt="Loading..." id="lazy-loaded-img-placeholder" src={require('/src/img/loading.gif')} />}
    </div>
  )
}

export default function Home() {
  const { state, setState } = useContext(globalState)
  const { theme, currentUser } = state
  const [loadedImages, setLoadedImages] = useState([])
  const [calendarImage, setCalendarImage] = useState(null)
  const bind = useLongPress((element) => {
    setState({ ...state, currentScreen: ScreenNames.login })
  })
  // Init Firebase
  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)

  const toggleFeature = (feature) => {
    const featureName = feature.currentTarget.dataset.name
    const clickedFeatureElement = document.querySelector(`[data-name='${featureName}']`)
    const allFeatureElements = document.querySelectorAll(`[data-name]`)

    if (clickedFeatureElement) {
      if (Manager.contains(clickedFeatureElement.classList, 'active')) {
        clickedFeatureElement.classList.remove('active')
      } else {
        if (Manager.isValid(allFeatureElements)) {
          for (let _feature of allFeatureElements) {
            _feature.classList.remove('active')
          }
        }
        clickedFeatureElement.classList.add('active')
        clickedFeatureElement.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }
    }
  }
  useEffect(() => {
    let homescreenWrapper = document.getElementById('app-content-with-sidebar')

    if (homescreenWrapper) {
      const imageWrappers = document.querySelectorAll('.img-wrapper')
      DomManager.addScrollListener(
        homescreenWrapper,
        () => {
          console.log(imageWrappers)
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

    const queryStringSection = AppManager.getQueryStringParams('section')
    if (Manager.isValid(queryStringSection)) {
      const whyUsSection = document.querySelector('.unique-features.section')
      if (queryStringSection === HomescreenSections.whyUs) {
        if (whyUsSection) {
          whyUsSection.scrollIntoView({ behavior: 'smooth' })
        }
      }
    }
  }, [])

  return (
    <>
      {/* ABOVE FOLD WRAPPER */}
      <div id="above-fold-wrapper" className="section above-fold">
        <Fade>
          <div id="home-navbar" className="flex">
            <img src={Logo} id="logo" {...bind()} />
            <div id="login-buttons">
              {/*<button id="register-button" onClick={() => setState({ ...state, currentScreen: ScreenNames.registration })}>*/}
              {/*  Sign Up <IoPersonAddOutline />*/}
              {/*</button>*/}
              {/*<button id="login-button" className="default default button" onClick={() => setState({ ...state, currentScreen: ScreenNames.login })}>*/}
              {/*  Log In <AiTwotoneUnlock />*/}
              {/*</button>*/}
              {/*<button id="login-button" className="default default button" onClick={() => setState({ ...state, currentScreen: ScreenNames.login })}>*/}
              {/*  Get Started*/}
              {/*</button>*/}
              <p id="choose-peace-text">
                <span>Choose Peace</span>ful <br /> Co-Parenting
              </p>
            </div>
          </div>
          <div className="section page-title">
            <p id="title">Peaceful {DomManager.isMobile() ? <br /> : ''} Co-Parenting</p>
            <p id="subtitle">
              Built for Families {DomManager.isMobile() ? '' : '-'} {DomManager.isMobile() ? <br /> : ''} Focused on Peace
            </p>
          </div>
          <LightGallery elementClassNames={`light-gallery ${theme}`} speed={500} selector={'.image'}>
            <div className="flex" id="images">
              <img alt="Calendar" className="image" src={CalendarImage} />
              <img alt="Memories" className="image" src={MemoriesImage} />
              <img alt="Child Info" className="image" src={ChildInfoImage} />
            </div>
          </LightGallery>
        </Fade>
      </div>

      {/* PAGE CONTAINER */}
      <div className="page-container home" id="home-screen-wrapper">
        {/* NAVBAR */}
        <div id="below-fold-intro-text" className="section">
          <p>
            Our app provides a stress-free way to manage co-parenting by enhancing communication, scheduling, and decision-making, so
            <b>you can focus on what matters most, your children's well-being</b>.
          </p>
        </div>
        {/* BELOW FOLD */}
        <div id="below-fold-wrapper">
          <Fade direction={'up'} duration={1000} triggerOnce={true}>
            <div className="flex boxes section">
              <div className="text-box">
                <PiCalendarDotsDuotone />
                <p className="text-box-title"> Streamline your Parenting Schedule </p>
                <p className="text-box-subtitle">Shared Calendars, Real-Time Updates, and Reminders</p>
                <p className="text-box-main-text">
                  Easily coordinate visitation, school events, and extracurricular activities with our intuitive scheduling tool. Ensuring both
                  parents stay on the same page without the hassle.
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

          <Fade direction={'up'} duration={1000} triggerOnce={true}>
            <div className="section full-width-box unique-features">
              <p className="title">
                Why <span>Choose</span> <span>Peace</span>ful Co-Parenting?
              </p>
              <p className="text subtitle">
                Peaceful Co-Parenting has the same functionality and features as other apps, but our app has <b>UNIQUE FEATURES</b>. These unique
                features are <u>NOT</u> available in other co-parenting applications.
              </p>
              <p id="unique-features-title">
                <b>Features Exclusive to Peaceful Co-Parenting</b>
                <br />
                <span>{DomManager.tapOrClick(true)} any feature to see exactly how it will improve your co-parenting experience. </span>
                <br />
                <span>{DomManager.tapOrClick(true)} again to close the feature's details.</span>
              </p>

              <div className="flex" id="feature-grid">
                <div className="feature" onClick={(e) => toggleFeature(e)} data-name={'any-device'}>
                  <p className="feature-title">
                    Available on&nbsp;<b>Any</b>&nbsp;Device
                  </p>
                  <MdOutlineStar className={'star'} />
                  <p className="feature-subtitle">
                    All other co-parenting applications are installed via an app store. This means that they can typically only be installed on
                    certain devices and on certain operating systems (Apple, Android, .etc).
                  </p>
                  <p className="feature-subtitle">
                    However, with Peaceful Co-Parenting <b>you can install our application on any device</b> (phone, tablet, computer, .etc) and any
                    operating system (Android, Apple, .etc).
                  </p>
                  <div className="content">
                    <ul>
                      <li className="list-title">
                        Simple (2-step) Installation
                        <ul>
                          <li>You do not have to us an app store to install the application</li>
                          <li>
                            Installation Steps
                            <ul>
                              <li>Visit the website</li>
                              <li>Click the share button</li>
                              <li>
                                Click <i>Add to Homescreen</i>
                              </li>
                            </ul>
                          </li>
                          <li>These steps are provided for Android, iOS (Apple) and Laptop/Desktop computers</li>
                        </ul>
                      </li>
                      <li className="list-title">
                        Device Support
                        <ul>
                          <li>
                            Because you do not need to utilize an app store, you can install our application on any device (phone, tablet, computer,
                            .etc)
                          </li>
                          <li>If you use more than one device, all of your activity and date will be synced across all devices</li>
                        </ul>
                      </li>
                      <li className="list-title">
                        Operating System Support
                        <ul>
                          <li>Whether you use a Windows, Mac, Android or Apple device, you can install our application on that device</li>
                        </ul>
                      </li>
                      <li className="list-title">
                        Updates
                        <ul>
                          <li>All updates (feature additions, fixes, .etc) are done in the background, you don't have to do anything!</li>
                          <li>Every time you open the application it will be fully updated</li>
                        </ul>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="feature" onClick={(e) => toggleFeature(e)} data-name={'one-subscription'}>
                  <p className="feature-title">One Subscription for All Features</p>
                  <MdOutlineStar className={'star'} />
                  <p className="feature-subtitle">
                    Almost every co-parenting application have multiple tiers of pricing. You get very basic features for one price, and then they
                    upsell (charge more) to access the more useful features. Not us!
                  </p>
                  <div className="content">
                    <ul>
                      <li className="list-title">
                        Low Subscription Cost
                        <ul>
                          <li>$4.99 per month</li>
                          <li>
                            For example: The OurFamilyWizard application costs $120 per year
                            <ul>
                              <li>
                                Peaceful Co-Parenting costs <b>HALF of THAT</b>
                              </li>
                            </ul>
                          </li>
                        </ul>
                      </li>
                      <li className="list-title">
                        Access to ALL Features
                        <ul>
                          <li>
                            For the price of a cup of coffee ($4.99) you get <b>ALL</b> features
                            <ul>
                              <li>Every co-parent needs access to all the resources and tools our application provides</li>
                              <li>
                                Our goal is to make your co-parenting simple and peaceful, so{' '}
                                <b>we do not charge you more to access important features</b>
                              </li>
                            </ul>
                          </li>
                        </ul>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="feature" onClick={(e) => toggleFeature(e)} data-name={'ui'}>
                  <p className="feature-title">Designed with You in Mind</p>
                  <MdOutlineStar className={'star'} />
                  <p className="feature-subtitle">
                    Many applications, including other co-parenting applications, can be very difficult to use. Imagine that you need to create an
                    expense to share with your co-parent but you can't find how/where to do that?
                  </p>
                  <p className="feature-subtitle">
                    Our goal is <b>eliminate that frustration or wasted time</b> that gets in the way of what you want to do.
                  </p>
                  <div className="content">
                    <ul>
                      <li className="list-title">
                        Menu
                        <ul>
                          <li>
                            The main menu includes large, clickable menu items
                            <ul>
                              <li>These menu items each have a name that easily conveys where you go when you click it</li>
                              <li>Each item also includes an icon to associate with the text quickly</li>
                            </ul>
                          </li>
                          <li>
                            Because it is designed in this way, it makes{' '}
                            <b>finding where you need to go, or what you need to do, as fast and easy as possible</b>
                          </li>
                        </ul>
                      </li>
                      <li className="list-title">
                        Straightforward Pages (e.g Expense Tracker, Memories, .etc)
                        <ul>
                          <li>Each page includes text at the top that indicate exactly what the page can be used for</li>
                          <li>
                            You will also notice that anything that could lead to a question is typically paired with helpful text and/or visual tools
                            <ul>
                              <li>
                                Viewing the Calendar, for example
                                <ul>
                                  <li>There are color coordinated dots for each day that has events.</li>
                                  <li>Below the calendar there is a legend so that you know exactly what the color of each dot represents</li>
                                </ul>
                              </li>
                            </ul>
                          </li>
                        </ul>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="feature" onClick={(e) => toggleFeature(e)} data-name={'realtime'}>
                  <p className="feature-title">Everything in Realtime</p>
                  <MdOutlineStar className={'star'} />
                  <p className="feature-subtitle">
                    Whether you are using the application or it is closed,{' '}
                    <b>you will receive all updates, changes and notifications instantaneously.</b>
                  </p>
                  <div className="content">
                    <ul>
                      <li className="list-title">
                        Notifications
                        <ul>
                          <li>
                            As soon as a co-parent creates a calendar event, shares a medical record or sends you a message - you will immediately get
                            a notification
                          </li>
                        </ul>
                      </li>
                      <li className="list-title">
                        Application, Activity & Data
                        <ul>
                          <li>
                            If you make an update (add a child, update a calendar event, .etc) you will see the updates <b>automatically</b>
                          </li>
                          <li>
                            Because you do not need to utilize an app store, you can install our application on any device (phone, tablet, computer,
                            .etc)
                          </li>
                          <li>If you use more than one device, all of your activity and date will be synced across all devices</li>
                        </ul>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="feature" onClick={(e) => toggleFeature(e)} data-name={'multiple-coparents'}>
                  <p className="feature-title">Multiple Co-Parent Support</p>
                  <MdOutlineStar className={'star'} />
                  <p className="feature-subtitle">
                    We understand that you may have multiple co-parents from prior relationships or marriages. We have taken this into consideration
                    and provide support for this dynamic.
                  </p>
                  <div className="content">
                    <ul>
                      <li className="list-title">
                        Multiple Co-Parents
                        <ul>
                          <li>Add as many co-parents as you need to</li>
                          <li>Easily utilize all of our application's features for each co-parent</li>
                          <li>When sharing important information, you can choose to share with individual co-parents or all at once</li>
                        </ul>
                      </li>
                      <li className="list-title">
                        Children from More than One Parent
                        <ul>
                          <li>You can add an unlimited number of children to store information for or share updates about</li>
                          <li>
                            Any child (with a valid phone number) can create an account and also use our application
                            <ul>
                              <li>If your child has their own account, they will have access to areas like the calendar to keep them in the loop</li>
                            </ul>
                          </li>
                        </ul>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="feature" onClick={(e) => toggleFeature(e)} data-name={'messaging'}>
                  <p className="feature-title">Messaging</p>
                  <MdOutlineStar className={'star'} />
                  <p className="feature-subtitle">All other applications include messaging, but not with these features.</p>
                  <div className="content">
                    <ul>
                      <li className="list-title">
                        Archive Conversations
                        <ul>
                          <li>
                            At any time you can delete/archive a conversation
                            <ul>
                              <li>If you need to (for court or reference), you can recover the conversation at any time</li>
                            </ul>
                          </li>
                          <li>
                            Search
                            <ul>
                              <li>
                                Enter more than three letters and you will see all messages send or received including the text you are searching for
                              </li>
                            </ul>
                          </li>
                          <li>
                            Bookmarking
                            <ul>
                              <li>
                                Bookmark any message at any time
                                <ul>
                                  <li>You can view all bookmarks (saved messages) at any time with one button click</li>
                                </ul>
                              </li>
                            </ul>
                          </li>
                          <li>
                            Message Copying
                            <ul>
                              <li>Long-press any message to copy it so you can paste it anywhere you would like</li>
                            </ul>
                          </li>
                        </ul>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="feature" onClick={(e) => toggleFeature(e)} data-name={'support'}>
                  <p className="feature-title">Support Team that Caters to You</p>
                  <MdOutlineStar className={'star'} />
                  <p className="feature-subtitle">
                    Far too often when you reach out to a customer support team it can take days to get an answer, and then when you do get an answer
                    it typically an answer that you can tell has been copied and pasted to many others in need of help.
                  </p>

                  <p className="feature-subtitle">
                    No longer! We put <b>YOU</b> first.
                  </p>
                  <div className="content">
                    <ul>
                      <li className="list-title">
                        Lightning Fast Response Time
                        <ul>
                          <li>
                            You will have a reply from our response team <b>within hours</b> not days
                          </li>
                          <li>
                            This includes
                            <ul>
                              <li>Technical issues encountered in the app</li>
                              <li>Feature requests</li>
                              <li>App feedback</li>
                              <li>Anything else you would like to contact us about</li>
                            </ul>
                          </li>
                        </ul>
                      </li>
                      <li className="list-title">
                        No hidden or extra cost for support
                        <ul>
                          <li>All support requests and feature addition requests are included in your subscription</li>
                        </ul>
                      </li>
                      <li className="list-title">
                        No Middleman
                        <ul>
                          <li>
                            When you reach out to us for support, your request/concern will go <b>directly</b> to the technical/development team that
                            will be working on handling the issue
                            <ul>
                              <li>Eliminates any unnecessary wait time for your concern/request</li>
                              <li>
                                The technical team will be making the changes to resolve issues or add feature requests - so it makes sense to be able
                                to engage with them directly
                              </li>
                            </ul>
                          </li>
                        </ul>
                      </li>
                      <li className="list-title">
                        Feature Requests
                        <ul>
                          <li>
                            If you would like to have a feature added to our app, let us know!
                            <ul>
                              <li>
                                We are more than happy to consider <b>all</b> feature requests
                                <ul>
                                  <li>The goal is provide an all-in-one application that fits your needs exactly</li>
                                </ul>
                              </li>
                            </ul>
                          </li>
                        </ul>
                      </li>
                      <li className="list-title">
                        Authentic Support from Real People
                        <ul>
                          <li>
                            We promise to provide help that is 100% related to the concern/request you send us
                            <ul>
                              <li>No bots</li>
                              <li>No 'canned' responses</li>
                              <li>No vague responses that do not directly address your concern</li>
                            </ul>
                          </li>
                        </ul>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </Fade>

          <Fade direction={'up'} duration={1000} triggerOnce={true}>
            <div id="collaboration" className="section text-box flex">
              <FaRegHandshake />
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

          <Fade direction={'up'} duration={1000} triggerOnce={true}>
            <div id="expenses-wrapper" className="section expenses">
              <PiMoneyWavyDuotone />
              <div className="text-wrapper">
                <p className="title">Track Expenses and Share Responsibilities</p>
                <p className="text subtitle">Transparency in Shared Financial Responsibilities</p>
                <p className="text">
                  Manage shared expenses like childcare, education, and extracurricular costs with our expense tracking feature, making it easy to
                  split costs and avoid conflicts over money.
                </p>
              </div>
              <LazyImage importedImage={ExpensesImage} imagesObjectPropName={'expenses'} show={loadedImages.includes('expenses')} />
            </div>
          </Fade>

          <Fade direction={'up'} duration={1000} triggerOnce={true}>
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
                  Whether you are visually impaired, or glare is a concern due to lighting - we got you covered! Our application supports Light and
                  Dark mode that can be toggled at the {DomManager.tapOrClick(true)} of a button.
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
            <Fade direction={'up'} duration={1000} triggerOnce={true}>
              <div className="box section security-and-privacy with-bg">
                <AiTwotoneSafetyCertificate />
                <p className="title">Security & Privacy</p>
                <p className="text subtitle">Transparency in Shared Financial Responsibilities</p>
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
          <Fade direction={'up'} duration={1000} triggerOnce={true}>
            <div className="flex" id="double">
              <div className="text-wrapper text-only box">
                <AiTwotoneTool />
                <p className="title">Flexible Co-Parenting Tools</p>
                <p className="text">
                  <b>Swap Requests:</b> Need a schedule change? Easily request new times or locations for child transfers with just a few clicks.
                </p>
                <p className="text">
                  <b>Shared Calendar:</b> Seamlessly plan and manage visitations, holidays, and paydays with icons, search functionality, and
                  automatic reminders.
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
                  <b>Easy Messaging: </b> Keep conversations organized with features like message archiving, bookmarking, and a powerful search tool
                  for quick access to important chats.
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
    </>
  )
}