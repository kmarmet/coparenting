import ScreenNames from "./screenNames"
import DateFormats from "./datetimeFormats"
import moment from "moment"

StateObj =
  # Getters
  activeChatId: ''
  authUser: null
  childAccessGranted: false,
  creationFormToShow: ''
  currentScreen: ScreenNames.landing
  currentUser: {}
  docToView: ''
  isLoading: true
  menuIsOpen: false
  messageToUser: null
  modalIsOpen: false
  notificationCount: 0,
  oneSignalInitialized: false
  parentAccessGranted: false
  refreshKey: 0,
  registrationExitStep: ""
  registrationUserName: ''
  selectedCalendarDate: moment().format(DateFormats.dateForDb)
  showCreationMenu: false
  showOverlay: false
  showScreenActions: false
  successAlertMessage: null
  users: []
  
  # Setters
  setActiveChatId: (id) ->
  setAuthUser: (user) ->
  setChildAccessGranted: (bool) ->
  setContactInfoToUpdateType: ->
  setCreationFormToShow: (form) ->
  setCurrentScreen: (screen) ->
  setCurrentUser: (user) ->
  setDocToView: (doc) ->
  setEventToEdit: (event) ->
  setIsLoading: (bool) ->
  setMenuIsOpen: (isOpen) ->
  setMessageToUser: (user) ->
  setModalIsOpen: (bool) ->
  setNotificationCount: (count) ->
  setParentAccessGranted: (bool) ->
  setRefreshKey: (num) ->
  setRegistrationExitStep: (step) ->
  setRegistrationUserName: (name) ->
  setSelectedCalendarDate: (date) ->
  setShowBottomMenu: (bool) ->
  setShowOverlay: (bool) ->
  setShowScreenActions: (bool) ->
  setSuccessAlertMessage: (message) ->
  setTheme: (theme) ->
  setUserIsLoggedIn: (isLoggedIn) ->
  setUsers: (users) ->
  showBottomMenu: false
  theme: 'light'
  userIsLoggedIn: false

export default StateObj