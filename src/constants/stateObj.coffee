import ScreenNames from "./screenNames"

StateObj =
  activeInfoChild: null
  activeInfoCoparent: [],
  activityCount: 0,
  authUser: null
  childAccessGranted: false,
  currentScreen: ScreenNames.home
  currentUser: {}
  docToView: ''
  firebaseUser: null,
  isLoading: true
  loadingText: 'Preparing your pathway to peace...'
  menuIsOpen: false
  messageToUser: null
  modalIsOpen: false
  parentAccessGranted: false
  refreshKey: 0,
  registrationUserName: ''
  selectedChild: null
  selectedNewEventDay: null
  showCenterNavbarButton: true
  showNavbar: true
  swapRequestToRevise: null
  theme: 'light'
  transferRequestToEdit: {}
  unreadMessageCount: 0
  userIsLoggedIn: false
  users: []
  viewExpenseForm: false
  viewSwapRequestForm: false
  viewTransferRequestForm: false
  setActiveInfoChild: (child) ->
  setActiveInfoCoparent: (coparent) ->
  setActivityCount: (count) ->
  setAuthUser: (user) ->
  setChildAccessGranted: (bool) ->
  setContactInfoToUpdateType: ->
  setCurrentScreen: (screen) ->
  setCurrentUser: (user) ->
  setDateToEdit: (date) ->
  setDocToView: (doc) ->
  setEventToEdit: (event) ->
  setFirebaseUser: (user) ->
  setIsLoading: (bool) ->
  setLoadingText: (text) ->
  setMenuIsOpen: (isOpen) ->
  setMessageToUser: (user) ->
  setModalIsOpen: (bool) ->
  setParentAccessGranted: (bool) ->
  setRefreshKey: (num) ->
  setRegistrationUserName: (name) ->
  setSelectedChild: (child) ->
  setSelectedNewEventDay: (day) ->
  setShowCenterNavbarButton: (bool) ->
  setShowOverlay: (bool) ->
  setSwapRequestToRevise: (request) ->
  setTheme: (theme) ->
  setTransferRequestToEdit: (request) ->
  setUnreadMessageCount: (num) ->
  setUserIsLoggedIn: (isLoggedIn) ->
  setUsers: (users) ->
  setViewExpenseForm: (show) ->
  setViewSwapRequestForm: (show) ->
  setViewTransferRequestForm: (show) ->

export default StateObj