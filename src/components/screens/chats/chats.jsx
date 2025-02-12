import React, { useContext, useEffect, useState } from 'react'
import Manager from '/src/managers/manager'
import globalState from '../../../context.js'
import DB_UserScoped from '/src/database/db_userScoped'
import { BiMessageRoundedAdd } from 'react-icons/bi'
import { child, getDatabase, onValue, ref } from 'firebase/database'
import { Fade } from 'react-awesome-reveal'
import BottomCard from '../../shared/bottomCard'
import SecurityManager from '/src/managers/securityManager'
import NoDataFallbackText from '../../shared/noDataFallbackText'
import NavBar from '../../navBar'
import AlertManager from '/src/managers/alertManager'
import DomManager from '/src/managers/domManager'
import ScreenNames from '/src/constants/screenNames'
import StringManager from '/src/managers/stringManager.coffee'
import ChatRow from './chatRow.jsx'
import DB from '/src/database/DB.js'
import { TbMessageCirclePlus } from 'react-icons/tb'
const Chats = () => {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [showNewThreadForm, setShowNewThreadForm] = useState(false)
  const [chats, setChats] = useState([])
  const [selectedCoparent, setSelectedCoparent] = useState(null)
  const [activeChatPhones, setActiveChatPhones] = useState([])
  const [showNewConvoCard, setShowNewConvoCard] = useState(false)

  const openMessageThread = async (coparent) => {
    // Check if thread member (coparent) account exists in DB
    let userCoparent = await DB_UserScoped.getCoparentByPhone(coparent?.phone, currentUser)
    if (!Manager.isValid(userCoparent)) {
      AlertManager.oneButtonAlert(
        'Co-Parent Account not Found',
        'This co-parent may have closed their account, however, you can still view the messages',
        null,
        () => {
          setState({ ...state, currentScreen: ScreenNames.chat, messageRecipient: coparent })
        }
      )
    } else {
      console.log(userCoparent)
      setState({ ...state, currentScreen: ScreenNames.chat, messageRecipient: userCoparent })
    }
  }

  const getSecuredChats = async () => {
    let securedChats = await SecurityManager.getChats(currentUser)
    const members = securedChats.map((x) => x.members).flat()
    const activeChats = members.filter((x) => x.phone && x.phone !== currentUser.phone)
    const activeChatPhones = activeChats.map((x) => x.phone)
    setChats(securedChats)
    setActiveChatPhones(activeChatPhones)
  }

  const onTableChange = async () => {
    const dbRef = ref(getDatabase())
    onValue(child(dbRef, `${DB.tables.chats}/${currentUser.phone}`), async (snapshot) => {
      await getSecuredChats()
    })
  }

  useEffect(() => {
    if (currentUser?.accountType === 'parent') {
      onTableChange().then((r) => r)
    }
  }, [selectedCoparent])

  return (
    <>
      {/* NEW THREAD FORM */}

      <BottomCard
        hasSubmitButton={false}
        className="new-conversation"
        wrapperClass="new-conversation"
        onClose={() => setShowNewConvoCard(false)}
        showCard={showNewConvoCard}
        title={'New Chats'}>
        {/* COPARENTS */}
        {currentUser?.accountType === 'parent' &&
          Manager.isValid(currentUser?.coparents) &&
          currentUser?.coparents?.map((coparent, index) => {
            return (
              <div key={index}>
                {!activeChatPhones.includes(coparent?.phone) && (
                  <div id="users-wrapper">
                    <div className="user-wrapper">
                      <TbMessageCirclePlus />
                      <p
                        className="coparent-name new-thread-coparent-name"
                        onClick={() => {
                          openMessageThread(coparent).then((r) => r)
                        }}>
                        {StringManager.formatNameFirstNameOnly(coparent?.name)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

        {/* CHILDREN */}
        {currentUser?.accountType === 'child' &&
          Manager.isValid(currentUser?.parents) &&
          currentUser?.parents?.map((parent, index) => {
            return (
              <div key={index} className="flex" id="users-wrapper">
                {!activeChatPhones.includes(parent?.phone) && (
                  <div className="user-wrapper">
                    <BiMessageRoundedAdd />
                    <p
                      className="coparent-name new-thread-coparent-name"
                      onClick={() => {
                        openMessageThread(parent?.phone).then((r) => r)
                      }}>
                      {parent?.name}
                    </p>
                  </div>
                )}
                {activeChatPhones.includes(parent?.phone) && <p>All available co-parents already have an open conversation with you. </p>}
              </div>
            )
          })}
      </BottomCard>

      {/* PAGE CONTAINER */}
      <div id="chats-container" className={`${theme} page-container`}>
        {/*<VideoCall />*/}
        {!showNewThreadForm && chats.length === 0 && <NoDataFallbackText text={'There are currently no conversations'} />}
        <Fade direction={'up'} duration={1000} triggerOnce={true} className={'chats-fade-wrapper'}>
          <div className="flex" id="screen-title-wrapper">
            <p className="screen-title">Chats</p>
            {!DomManager.isMobile() && <TbMessageCirclePlus id={'add-new-button'} onClick={() => setShowNewConvoCard(true)} />}
          </div>

          {/* CHAT ROWS */}
          {!showNewThreadForm &&
            chats.length > 0 &&
            chats.map((chat, index) => {
              const coparent = chat?.members?.filter((x) => x.phone !== currentUser?.phone)[0]
              return <ChatRow coparent={coparent} chat={chat} index={index} />
            })}
        </Fade>
      </div>
      {!showNewConvoCard && (
        <NavBar navbarClass={'calendar'}>
          {DomManager.isMobile() && <TbMessageCirclePlus id={'add-new-button'} onClick={() => setShowNewConvoCard(true)} />}
        </NavBar>
      )}
    </>
  )
}

export default Chats