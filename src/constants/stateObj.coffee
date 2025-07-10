import ScreenNames from "./screenNames"
import DateFormats from "./datetimeFormats"
import moment from "moment"


StateObj =
  authUser: null
  childAccessGranted: false,
  creationFormToShow: ''
  currentScreen: ScreenNames.landing
  currentUser: {}
  docToView: ''
  isLoading: true
  menuIsOpen: false
  messageToUser: null
  oneSignalInitialized: false
  dateToEdit: moment().format(DateFormats.dateForDb)
  modalIsOpen: false
  notificationCount: 0,
  parentAccessGranted: false
  refreshKey: 0,
  showCreationMenu: false
  showScreenActions: false
  registrationUserName: ''
  showOverlay: false
  successAlertMessage: null
  users: []
  activeChatId: ''
  registrationExitStep: ""
  setRegistrationExitStep: (step) ->
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