import ScreenNames from "./screenNames"
import DateFormats from "./datetimeFormats"
import moment from "moment"


StateObj =
  authUser: null
  childAccessGranted: false,
  creationFormToShow: ''
  currentScreen: ScreenNames.home
  currentUser: {}
  docToView: ''
  isLoading: true
  loadingText: 'Preparing your pathway to peace...'
  menuIsOpen: false
  messageToUser: null
  dateToEdit: moment().format(DateFormats.dateForDb)
  modalIsOpen: false
  notificationCount: 0,
  parentAccessGranted: false
  refreshKey: 0,
  showCreationMenu: false
  showScreenActions: false
  registrationUserName: ''
  successAlertMessage: null
  users: []
  activeChatId: ''
  setActiveChatId: (id) ->
  setUsers: (users) ->
  setSuccessAlertMessage: (message) ->
  setShowScreenActions: (bool) ->
  setAuthUser: (user) ->
  setChildAccessGranted: (bool) ->
  setContactInfoToUpdateType: ->
  setCreationFormToShow: (form) ->
  setCurrentScreen: (screen) ->
  setCurrentUser: (user) ->
  setDateToEdit: (date) ->
  setDocToView: (doc) ->
  setEventToEdit: (event) ->
  setIsLoading: (bool) ->
  setLoadingText: (text) ->
  setMenuIsOpen: (isOpen) ->
  setMessageToUser: (user) ->
  setModalIsOpen: (bool) ->
  setNotificationCount: (count) ->
  setParentAccessGranted: (bool) ->
  setRefreshKey: (num) ->
  setRegistrationUserName: (name) ->
  setShowBottomMenu: (bool) ->
  setShowOverlay: (bool) ->
  setTheme: (theme) ->
  setUserIsLoggedIn: (isLoggedIn) ->
  showBottomMenu: false
  theme: 'light'
  userIsLoggedIn: false

export default StateObj