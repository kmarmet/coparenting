import React, {useContext, useEffect, useState} from 'react'
import ScreenNames from '/src/constants/screenNames'
import AppManager from '/src/managers/appManager.js'
import DomManager from '/src/managers/domManager'
import Manager from '/src/managers/manager'
import {AiTwotoneMessage, AiTwotoneSafetyCertificate, AiTwotoneTool} from 'react-icons/ai'
import {BsFillEnvelopeHeartFill} from 'react-icons/bs'
import {IoIosArrowUp, IoIosChatbubbles} from 'react-icons/io'
import {IoSyncCircle} from 'react-icons/io5'
import {MdLooksOne, MdPeopleAlt, MdStyle} from 'react-icons/md'
import {PiCalendarDotsDuotone, PiDevicesFill} from 'react-icons/pi'
import {TbSunMoon} from 'react-icons/tb'
import {useLongPress} from 'use-long-press'
import globalState from '../../context'
import Slideshow from '../shared/slideshow'
import Spacer from '../shared/spacer'
import SuspenseImage from '../shared/suspenseImage'

export default function Landing() {
  const {state, setState} = useContext(globalState)
  const {theme, currentScreen, authUser} = state
  const [showTrioSlideshow, setShowTrioSlideshow] = useState(false)
  const [showDocumentsSlideshow, setShowDocumentsSlideshow] = useState(false)
  const [showEmotionMeterSlideshow, setShowEmotionMeterSlideshow] = useState(false)
  const [showExpensesSlideshow, setShowExpensesSlideshow] = useState(false)
  const [showDevicesSlideshow, setShowDevicesSlideshow] = useState(false)
  const [showCollabSlideshow, setShowCollabSlideshow] = useState(false)
  const bind = useLongPress((element) => {
    setState({...state, currentScreen: ScreenNames.login})
  })

  // Init Firebase

  const ToggleFeature = (feature) => {
    const featureName = feature.currentTarget.dataset.name
    const clickedFeatureElement = document.querySelector(`[data-name='${featureName}']`)
    const allFeatureElements = document.querySelectorAll(`[data-name]`)

    if (clickedFeatureElement) {
      if (Manager.Contains(clickedFeatureElement.classList, 'active')) {
        clickedFeatureElement.classList.remove('active')
      } else {
        if (Manager.IsValid(allFeatureElements)) {
          for (let _feature of allFeatureElements) {
            _feature.classList.remove('active')
          }
        }
        clickedFeatureElement.classList.add('active')
      }
    }
  }

  const GetFadeUpClass = (element) => {
    const scrollWrapper = document.querySelector('#wrapper')
    if (DomManager.mostIsInViewport(scrollWrapper, element)) {
      if (!Manager.Contains(element.classList, DomManager.AnimateClasses.names.fadeInUp)) {
        return `${DomManager.AnimateClasses.names.fadeInUp} ${DomManager.AnimateClasses.names.default}`
      }
    }
  }

  const HandleScroll = () => {
    const firstViewableBox = document.querySelector('#first-scroll-button-candidate')
    const scrollWrapper = document.querySelector('#wrapper')
    const scrollToTopButton = document.querySelector('#scroll-to-top-button-wrapper')

    if (DomManager.mostIsInViewport(scrollWrapper, firstViewableBox)) {
      scrollToTopButton.classList.remove('hide')
    } else {
      scrollToTopButton.classList.add('hide')
    }
  }

  const ScrollToTop = () => {
    const scrollToTopButton = document.querySelector('#scroll-to-top-button-wrapper')
    scrollToTopButton.classList.remove('hide')

    const header = document.getElementById('home-navbar')
    header.scrollIntoView({behavior: 'smooth'})
  }

  useEffect(() => {
    if (currentScreen === ScreenNames.landing) {
      setState({...state, isLoading: false})
    }
  }, [currentScreen])

  useEffect(() => {
    const requestType = AppManager.getQueryStringParams('type')
    if (Manager.IsValid(requestType)) {
      if (requestType === 'invite') {
        // Invitation Sender Key
        const token = AppManager.getQueryStringParams('token')

        if (Manager.IsValid(token)) {
          localStorage.setItem('pcp_invite_token', token)
          setState({...state, currentScreen: ScreenNames.registration})
        }
      }
    }
    const scrollWrapper = document.querySelector('#wrapper')

    const appWrapper = document.getElementById('app-content-with-sidebar')
    if (appWrapper) {
      appWrapper.classList.add('home')
    }

    if (Manager.IsValid(scrollWrapper)) {
      DomManager.addScrollListener(scrollWrapper, HandleScroll, 200)
    }
  }, [])

  return (
    <div id="wrapper" onScroll={HandleScroll}>
      {/* SLIDESHOWS */}

      {/* Documents */}
      <Slideshow
        show={showDocumentsSlideshow}
        hide={() => setShowDocumentsSlideshow(false)}
        activeIndex={0}
        images={[
          {
            url: require('/src/img/landing/tableOfContents.png'),
            name: 'Table of Contents',
            alt: 'Table of Contents',
          },
          {
            url: require('/src/img/landing/customDocHeaders.gif'),
            name: 'Custom Headers',
            alt: 'Custom Headers',
          },
        ]}
      />

      {/* Trio */}
      <Slideshow
        show={showTrioSlideshow}
        activeIndex={0}
        hide={() => setShowTrioSlideshow(false)}
        images={[
          {
            title: 'Memories',
            url: require('/src/img/landing/memories.png'),
            notes: "Share your child's valuable memories with your co-parents or children",
          },
          {title: 'Calendar', url: require('/src/img/landing/calendar.png'), notes: 'Schedule important dates with your co-parents or children'},
          {
            title: 'Child Info',
            url: require('/src/img/landing/child-info.png'),
            notes: 'Share important details about your child with your co-parents or children',
          },
        ]}
      />

      {/* Compatibility */}
      <Slideshow
        show={showDevicesSlideshow}
        hide={() => setShowDevicesSlideshow(false)}
        activeIndex={1}
        images={[
          {url: require('/src/img/landing/devices/phone.png'), title: 'Compatible with all Phones'},
          {url: require('/src/img/landing/devices/laptop.png'), title: 'Compatible with all Tablets'},
          {url: require('/src/img/landing/devices/tablet.png'), title: 'Compatible with all Computers'},
        ]}
      />

      {/* Menu */}
      <Slideshow
        images={[
          {
            url: require('/src/img/landing/menu.png'),
            title: 'Collaboration',
            alt: 'Collaboration',
          },
        ]}
        show={showCollabSlideshow}
        hide={() => setShowCollabSlideshow(false)}
      />

      {/* Expenses */}
      <Slideshow
        images={[
          {
            url: require('/src/img/landing/expense-tracker.png'),
            alt: 'Expenses',
            title: 'Expense Tracker',
            notes: 'Assign and track all expenses between you and your co-parents',
          },
        ]}
        activeIndex={0}
        show={showExpensesSlideshow}
        hide={() => setShowExpensesSlideshow(false)}
      />

      {/* Emotion Meter */}
      <Slideshow
        activeIndex={0}
        show={showEmotionMeterSlideshow}
        hide={() => setShowEmotionMeterSlideshow(false)}
        images={[
          {
            url: require('../../img/landing/emotion-meter.gif'),
            title: 'Emotion Meter',
            alt: 'Emotion Meter',
          },
        ]}
      />

      {/* ABOVE FOLD WRAPPER */}
      <div id="scroll-to-top-button-wrapper" className="hide" onClick={ScrollToTop}>
        <IoIosArrowUp id={'scroll-to-top-button'} />
      </div>

      <div id="above-fold-wrapper" className="section above-fold">
        <div id="home-navbar" className="flex">
          <SuspenseImage classes={'landing logo'} shouldUseLongPress={true} />
          <div className="login-buttons">
            <div className="choose-peace-text flex">
              <p className="choose-peace-text">
                <span className="emphasize">Choose Peace</span>
                <span>ful Co-Parenting</span>
              </p>
            </div>
          </div>
        </div>
        <div className="section page-title">
          <p id="title">Peaceful Co-Parenting</p>
          <p id="subtitle">Built for Families - Focused on Peace</p>
        </div>
        <Spacer height={10} />

        <div className="flex" id="images">
          <SuspenseImage classes={'landing memories'} />
          <SuspenseImage classes={'landing calendar'} />
          <SuspenseImage classes={'landing child-info'} />
        </div>
      </div>
      <Spacer height={20} />
      {/* PAGE CONTAINER */}
      <div id="below-fold-intro-text" className="section">
        <p>
          Our app provides a stress-free way to manage co-parenting by enhancing communication, scheduling, and decision-making, so&nbsp;
          <b>you can focus on what matters most, your children&#39;s well-being</b>.
        </p>
      </div>

      <Spacer height={10} />

      {/* BELOW FOLD */}
      <div id="below-fold-wrapper">
        <div className="flex boxes section below-fold" data-section={1}>
          <div className="text-box">
            <PiCalendarDotsDuotone />
            <p className="text-box-title">Streamline your Parenting Schedule </p>
            <p className="text-box-subtitle">Shared Calendars, Real-Time Updates, and Reminders</p>
            <p className="text-box-main-text">
              Easily coordinate visitation, school events, and extracurricular activities with our intuitive scheduling tool. Ensuring both parents
              stay on the same page without the hassle.
            </p>
          </div>

          {/* EFFECTIVE COMMUNICATION */}
          <div
            className={`${GetFadeUpClass(document.querySelector('.below-fold'))} text-box`}
            style={DomManager.AnimateDelayStyle(1)}
            id="first-scroll-button-candidate">
            <AiTwotoneMessage />
            <p className="text-box-title">Effective Communication without Conflict </p>
            <p className="text-box-subtitle">Clear Messaging for Healthier Conversations</p>
            <p className="text-box-main-text">Facilitate positive communication with in-app messaging designed to reduce misunderstandings.</p>
            <Spacer height={10} />
            <div id="emotion-meter-wrapper">
              <p>Emotion Meter 😃</p>
              <p className="description">
                Effective communication with a foundation of respect is crucial for successful co-parenting. The Emotion Meter plays a vital role in
                facilitating this essential aspect.
              </p>
              <SuspenseImage classes={'landing emotion-meter'} />
            </div>
          </div>
        </div>
        <hr className="landing" />

        {/* UNIQUE FEATURES */}
        <div>
          <div className="section full-width-box unique-features" data-section={2}>
            <div id="text-content">
              <p className="title">
                Why <span>Choose</span> <span>Peace</span>ful Co-Parenting?
              </p>
              <p className="text subtitle">
                Peaceful Co-Parenting offers the same abilities and features as other applications, yet it stands out with its{' '}
                <b>DISTINCTIVE FEATURES</b>. These exclusive features are UNAVAILABLE in any other co-parenting application.
              </p>
              <span className="feature-toggle-instructions">{DomManager.tapOrClick(true)} any feature to view or hide details</span>
            </div>

            {/* FEATURE GRID */}
            <div id="feature-grid">
              {/* ANY DEVICE */}
              <div className="feature" onClick={(e) => ToggleFeature(e)} data-name={'any-device'}>
                <div className="star-wrapper"></div>
                <div className="feature-title-wrapper">
                  <p className="feature-title">Available on Any Device</p>
                  <PiDevicesFill className={'star'} />
                </div>
                <p className="feature-subtitle">
                  Unlike other co-parenting applications that require installation through an app store, which limits them to specific devices and
                  operating systems (such as Apple and Android), Peaceful Co-Parenting offers a more flexible solution.
                </p>
                <p className="feature-subtitle">
                  You can install our application on <b>any device</b>—be it a phone, tablet, or computer—and it is compatible with all operating
                  systems, including Android and Apple.
                </p>
                <div className="content">
                  <div className="feature-details-boxes">
                    <ul className="parent-ul">
                      <div className="feature-details-box">
                        <p className="box-title">Simple Installation</p>
                        <p>You do not have to us an app store to install the application</p>
                        <Spacer height={2} />
                        <p>
                          <b className="smaller">Installation Steps</b>
                        </p>
                        <li>Visit the website</li>
                        <li>Click the share button</li>
                        <li>
                          Click <i>Add to Homescreen</i>
                        </li>
                        <Spacer height={2} />
                        <p className="center">These steps are provided for Android, iOS (Apple) and Laptop/Desktop computers</p>
                      </div>

                      <div className="feature-details-box">
                        <p className="box-title">Device Support</p>
                        <p>
                          You can install our application on any device, including phones, tablets, and computers, without the need for an app store
                        </p>
                        <Spacer height={2} />
                        <p>All of your activities and data will be synchronized across all devices if you utilize multiple devices</p>
                      </div>
                      <div className="feature-details-box">
                        <p className="box-title">Operating System Support</p>
                        <p>You can install our application on any device, whether it is a Windows, Mac, Android, or Apple device</p>
                      </div>
                      <div className="feature-details-box">
                        <p className="box-title">Updates</p>
                        <p>
                          All updates, including feature enhancements and bug fixes, are performed automatically in the background, requiring no
                          action on your part
                        </p>
                        <Spacer height={2} />
                        <p>Each time you launch the application, it will be completely up to date</p>
                      </div>
                    </ul>
                  </div>
                </div>
              </div>

              {/* ONE SUBSCRIPTION */}
              <div className="feature" onClick={(e) => ToggleFeature(e)} data-name={'one-subscription'}>
                <div className="feature-title-wrapper">
                  <p className="feature-title">One Subscription = ALL Features</p>
                  <MdLooksOne className={'star'} />
                </div>
                <p className="feature-subtitle">
                  Many co-parenting apps offer various pricing tiers. You receive basic features at one price, but they often upsell for access to
                  more valuable/useful features. That&#39;s not the case with us!
                </p>
                <div className="content">
                  <div className="feature-details-boxes">
                    <div className="feature-details-box">
                      <p className="box-title">Fair Pricing that Everyone can Afford</p>
                      <Spacer height={5} />
                      <p>
                        <b>Only $4.99 per month!</b>
                      </p>
                      <Spacer height={5} />
                      <p>For example: The OurFamilyWizard application costs $150 per year - PER co-parent/user!</p>
                      <Spacer height={5} />
                      <p>
                        The annual cost of Peaceful Co-Parenting is significantly reduced, being <b>85% less expensive</b>!
                      </p>
                      <Spacer height={5} />
                      <p>
                        <b>That makes the annual cost $120 for BOTH co-parents instead of $300</b>. You and your co-parent can take advantage of our
                        application and all its features for less than half the cost of a single OurFamilyWizard subscription.
                      </p>
                    </div>
                    <div className="feature-details-box">
                      <p className="box-title">Access to ALL Features - ZERO Upselling</p>
                      <p>Too often subscriptions (such as OurFamilyWizard) have several pricing tiers. Basic, Premium, Max, .etc.</p>
                      <ul>
                        <li>That is NOT keeping you in mind.</li>
                      </ul>
                      <Spacer height={5} />
                      <p>You should have the opportunity to enjoy all the features at a price that is very budget-friendly.</p>
                      <Spacer height={5} />
                      <p>
                        For the price of a cup of coffee ($4.99) you get <b>ALL</b> features because it&#39;s essential for every co-parent to have
                        access to the full range of resources and tools that our application offers.
                      </p>
                      <Spacer height={5} />
                      <p>
                        We aim to simplify and bring harmony to your co-parenting experience, which is why we don’t impose extra fees for accessing
                        essential features.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* UI DESIGN */}
              <div className="feature" onClick={(e) => ToggleFeature(e)} data-name={'ui'}>
                <div className="feature-title-wrapper">
                  <p className="feature-title">Designed with You in Mind</p>
                  <MdStyle className={'star'} />
                </div>
                <p className="feature-subtitle">
                  Numerous applications can often be quite challenging to navigate. Picture this: you need to log an expense to share with your
                  co-parent, but you&#39;re unable to locate the option to do so.
                </p>
                <p className="feature-subtitle">
                  We aim to <b>remove that frustration</b> and save you time, allowing you to focus on what truly matters.
                </p>
                <div className="content">
                  <div className="feature-details-boxes">
                    <div className="feature-details-box">
                      <p className="box-title">Menu</p>
                      <p>
                        The main menu includes large, clickable menu items that have a name that easily conveys where you will go when you click it.
                      </p>
                      <Spacer height={5} />
                      <p>The design facilitates quick and effortless navigation to your desired destination or task</p>
                    </div>
                    <div className="feature-details-box">
                      <p className="box-title">Straightforward Pages</p>
                      <p>Each page (e.g Expense Tracker, Memories, .etc) features a header text that clearly states its intended purpose.</p>
                      <Spacer height={5} />
                      <p>
                        You will find that any potential questions are usually accompanied by supportive text and visual aids to enhance
                        understanding.
                      </p>
                      <Spacer height={5} />
                      <p>
                        <b>Viewing the Calendar, for example:</b>
                      </p>
                      <ul>
                        <li>Each day with scheduled events is marked by color-coordinated dots</li>
                        <li>The calendar is accompanied by a legend that indicates the meaning of each dot&#39;s color</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* REALTIME ENGAGEMENT */}
              <div className="feature" onClick={(e) => ToggleFeature(e)} data-name={'realtime'}>
                <div className="feature-title-wrapper">
                  <p className="feature-title">Realtime Engagement</p>
                  <IoSyncCircle className={'star'} />
                </div>
                <p className="feature-subtitle">
                  You will receive all updates, changes, and notifications <b>instantly</b>, whether the application is open or closed.
                </p>
                <div className="content">
                  <div className="feature-details-boxes">
                    <div className="feature-details-box">
                      <p className="box-title">Notifications</p>
                      <p>
                        Whenever a co-parent schedules a calendar event, shares a medical record, or sends you a message, you will receive an instant
                        notification.
                      </p>
                    </div>

                    <div className="feature-details-box">
                      <div className="box-title">Application, Activity & Data</div>
                      <p>
                        If you make an update (add a child, update a calendar event, .etc) you will see the updates <b>automatically.</b>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* MULTIPLE COPARENTS */}
              <div className="feature" onClick={(e) => ToggleFeature(e)} data-name={'multiple-coparents'}>
                <div className="feature-title-wrapper">
                  <p className="feature-title">Multiple Co-Parent Support</p>
                  <MdPeopleAlt className={'star'} />
                </div>
                <p className="feature-subtitle">
                  We recognize that you or your spouse might have several co-parents from previous relationships or marriages.
                </p>

                <p className="feature-subtitle">We have acknowledged this situation and offer support tailored to this dynamic.</p>

                <div className="content">
                  <div className="feature-details-boxes">
                    <div className="feature-details-box">
                      <p className="box-title">Co-Parent Accounts</p>
                      <p>
                        You can create multiple co-parent accounts, each with their own unique set of features and permissions. This allows you to
                      </p>
                    </div>
                    <div className="feature-details-box">
                      <p className="box-title">Multiple Co-Parents</p>
                      <p>Add as many co-parents as you need to and easily utilize all of our application&#39;s features for each co-parent.</p>
                      <Spacer height={5} />

                      <p>You have the option to share important information either with individual co-parents or with all of them simultaneously.</p>
                    </div>
                    <div className="feature-details-box">
                      <p className="box-title">Children from More than One Parent</p>
                      <p>
                        You have the capability to include an unlimited number of children for the purpose of storing information or sharing updates.
                      </p>
                      <Spacer height={5} />
                      <p>
                        Any child (with a valid phone number) can create an account and also use our application and access features such as the
                        calendar, ensuring they stay informed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* MESSAGING */}
              <div className="feature" onClick={(e) => ToggleFeature(e)} data-name={'messaging'}>
                <div className="feature-title-wrapper">
                  <p className="feature-title">Messaging/Communication</p>
                  <IoIosChatbubbles className={'star'} />
                </div>
                <p className="feature-subtitle">Other applications might offer messaging capabilities, but they lack these specific features</p>
                <div className="content">
                  <div className="feature-details-boxes">
                    <div className="feature-details-box">
                      <p className="box-title">Pause/Resume Conversations</p>
                      <p>You can pause a conversation and its notifications at any moment, and later resume it whenever you choose.</p>
                    </div>
                    <div className="feature-details-box">
                      <p className="box-title">Message Search</p>
                      <p>Enter more than three characters to view all messages sent or received, including the specific text you are looking for.</p>
                    </div>
                    <div className="feature-details-box">
                      <p className="box-title">Bookmarking</p>
                      <p>Bookmark any message at any time.</p>
                      <Spacer height={5} />
                      <p>You can access all your bookmarks (saved messages) instantly with a single click of a button.</p>
                    </div>
                    <div className="feature-details-box">
                      <p className="box-title">Message Copying</p>
                      <p>Bookmark any message at any time.</p>
                      <Spacer height={5} />
                      <p>Long-press any message to copy it so you can paste it anywhere you would like.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SUPPORT */}
              <div className="feature" onClick={(e) => ToggleFeature(e)} data-name={'support'}>
                <div className="feature-title-wrapper">
                  <p className="feature-title">Support Team that Truly Cares</p>
                  <BsFillEnvelopeHeartFill className={'star'} />
                </div>
                <p className="feature-subtitle">
                  It&#39;s frustrating when you contact customer support and have to wait days for a response, only to receive a generic answer that
                  feels like it was sent to countless others.
                </p>

                <p className="feature-subtitle">
                  We understand how important your time is, and that&#39;s why <b>we prioritize you!</b>
                </p>
                <div className="content">
                  <div className="feature-details-boxes">
                    <div className="feature-details-box">
                      <p className="box-title">Lightning Fast Response Time</p>
                      <p>
                        You will have a reply from our response team <b>within hours</b>, not days.
                      </p>
                      <Spacer height={5} />
                      <p>
                        <b>This includes:</b>
                      </p>
                      <ul>
                        <li>Technical issues encountered in the app</li>
                        <li>Feature requests</li>
                        <li>App feedback</li>
                        <li>Anything else you would like to contact us about</li>
                      </ul>
                    </div>
                    <div className="feature-details-box">
                      <p className="box-title">No hidden or extra cost for support</p>
                      <p>All support requests and feature addition requests are included in your subscription.</p>
                    </div>
                    <div className="feature-details-box">
                      <p className="box-title">No Middleman</p>
                      <p>
                        When you reach out to us for support, your request/concern will go <b>directly</b> to the technical/development team that will
                        be working on handling the issue, which will eliminate any unnecessary wait time for your concern/request.
                      </p>
                    </div>
                    <div className="feature-details-box">
                      <p className="box-title">Feature Requests</p>
                      <p>
                        If you would like to have a feature added to our app, let us know! We are more than happy to consider <b>all</b> feature
                        requests.
                      </p>
                      <Spacer height={5} />
                      <p>The goal is provide an all-in-one application that fits your needs exactly.</p>
                    </div>
                    <div className="feature-details-box">
                      <p className="box-title">Authentic Support from Real People</p>
                      <p>We promise to provide help that is 100% related to the concern/request you send us.</p>
                      <Spacer height={5} />
                      <p>The goal is provide an all-in-one application that fits your needs exactly.</p>
                      <Spacer height={5} />
                      <p>
                        <b>The benefits:</b>
                      </p>
                      <ul>
                        <li>No bots</li>
                        <li>No &#39;canned&#39; responses</li>
                        <li>No vague responses that do not directly address your concern</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <hr className="landing" />

        {/* DOCUMENTS */}
        <div>
          <div id="documents" className="section text-box documents">
            <div className="flex text-columns">
              <div className="text-wrapper left">
                <p className="title">Effortlessly View your Documents</p>
                <p className="text">
                  Co-parents often need to refer back to their separation agreements or other important documents to clarify specific details, such as
                  holiday visitation arrangements or obligations.
                </p>
                <p className="text">
                  Finding the document is just the first step; after that, you need to sift through it to locate the specific information you need.
                  This can often be a lengthy and exasperating task.
                </p>
                <p className="text">We have eliminated that process and the frustration that comes with it.</p>
              </div>
              <div className="right">
                <h2>How we Simplify this Task</h2>
                <Spacer height={2} />
                <p>Easily upload your documents. All text will be extracted from image documents.</p>
                <Spacer height={5} />
                <p>Set your own headers by simply selecting text you would like to stand out.</p>
                <Spacer height={5} />
                <p>
                  A table of contents is generated for you, allowing quick navigation to any section, utilizing both predefined headers and your own
                  custom headers.
                </p>
                <Spacer height={5} />
                <p>Use the search feature to quickly find a word or words you are looking for.</p>
              </div>
            </div>

            <p className="light-gallery-instructions">{DomManager.tapOrClick()} an image to enlarge</p>

            <SuspenseImage classes={'landing custom-doc-headers'} />
            <SuspenseImage classes={'landing table-of-contents'} />

            <Spacer height={8} />
          </div>
        </div>

        <hr className="landing" />
        {/* EXPENSES */}
        <div id="expenses-wrapper" className="section expenses">
          <div className="text-wrapper">
            <p className="title">Track Expenses and Share Responsibilities</p>
            <p className="text subtitle">Transparency in Shared Financial Responsibilities</p>
            <p className="text">
              Manage shared expenses like childcare, education, and extracurricular costs with our expense tracking feature, making it easy to split
              costs and avoid conflicts over money.
            </p>
          </div>

          <SuspenseImage classes={'landing expense-tracker'} />
        </div>

        <hr className="landing" />

        {/* COLLABORATION */}
        <div>
          <div id="collaboration" className="section text-box">
            {/*<FaRegHandshake />*/}
            <div className="text-wrapper">
              <p className="title">Collaborate on Decisions that Matter Most</p>
              <p className="text">
                From medical appointments to school choices, collaborate effectively through our platform’s decision-making tools, keeping your
                child’s best interests at the forefront.
              </p>
              <p className="text">
                Co-parenting peacefully requires a lot of tools and resources. With that in mind, everything you need can be found in our menu - no
                time spent looking for anything!
              </p>
              <p className="text">
                Our mission is to provide a supportive space where you and your co-parent can reduce stress and focus on creating a harmonious
                environment for your children.
              </p>
            </div>

            {/*<LazyLoadImage onClick={() => setShowCollabSlideshow(true)} className={'image'} src={require('/src/img/landing/menu.png')} alt="Menu" />*/}
            <SuspenseImage classes={'landing collaboration'} />
          </div>
        </div>
        <hr className="landing" />

        {/* SECURITY & PRIVACY */}
        <div>
          <div className="box section security-and-privacy with-bg">
            <AiTwotoneSafetyCertificate />
            <div className="content text-wrapper">
              <p className="title">Security & Privacy</p>
              <p className="text subtitle center">Transparency in Shared Financial Responsibilities</p>
              <p className="text">
                <b>Custom Sharing: </b> Keep control over what co-parents see by selecting only the co-parents you want to share with. This includes
                calendar events, expenses and other important information.
              </p>
              <p className="text">
                <b>Enhanced Protection: </b> Enjoy peace of mind with SMS code verification for password recovery, and secure registration for both
                parents and children.
              </p>
            </div>
          </div>
        </div>
        <hr className="landing" />

        {/* COMPATIBLE */}
        <div>
          <div className="section text-box all-devices" id="all-devices">
            <TbSunMoon />
            <p className="title">Compatible & Accessible</p>
            <div className=" text">
              <p className="subtitle">
                <b>Available on All Devices </b>
              </p>
              <span>iOS, Android, Windows, Mac, .etc.</span>
            </div>
            <div className="text">
              <p className="subtitle">
                <b>Available on All Screen Sizes </b>
              </p>
              <span>Adapts to any screen size (phone, tablet, laptop, .etc) and/or screen orientation.</span>
            </div>
            <div className="text">
              <p className="subtitle">
                <b>Supports both Light & Dark Modes</b>
              </p>
              <span>
                We understand that visual impairments and glare from lighting can be challenging. That&#39;s why our application offers both Light and
                Dark modes, easily switchable with just a {DomManager.tapOrClick()}. We&#39;re here to ensure your experience is comfortable and
                accessible!
              </span>
            </div>

            <SuspenseImage classes={'landing phone'} />
            <SuspenseImage classes={'landing tablet'} />
            <SuspenseImage classes={'landing laptop'} />

            <p className="subtitle mt-25 mb-0" id="multiple-device-usage">
              You can use the application across multiple devices and all of your data will be kept in sync across them all!
            </p>
          </div>
        </div>
        <hr className="landing" />

        {/*  CO-PARENTING TOOLS */}
        <div>
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
            <div className="text-wrapper text-only box">
              <AiTwotoneMessage />
              <p className="title">Streamlined Communication</p>
              <p className="text">
                <b>Easy Messaging: </b> Keep conversations organized with features like message archiving, bookmarking, and a powerful search tool for
                quick access to important chats.
              </p>
              <p className="text">
                <b>Multimedia Sharing</b> Share memories in real-time by uploading photos and milestones with your co-parent, helping you both stay
                connected with your child&#39;s journey.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}