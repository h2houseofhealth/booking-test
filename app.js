const API_URL = "";
const state = {
  user: null,
  bookings: [],
  services: [],
  adminMembershipOrders: [],
  adminDiscountPhones: [],
  adminUsers: [],
  adminCoupons: [],
  adminSelectedUserId: null,
  adminResolvedCustomer: null,
  adminCustomerForm: {
    name: '',
    email: '',
    phone: '',
  },
  postLoginChoice: '',
  activeUserTab: 'services',
  membership: {
    plans: [],
    active: false,
    current: null,
  },
  membershipAdditions: {},
  membershipCheckout: null,
  membershipCouponPreview: null,
  cartCouponCode: '',
  cartCouponPreview: null,
  ivSelections: {},
  selectedServiceCategory: null,
  selectedSingleSessionServiceName: '',
  singleSessionEditingBookingId: '',
  selectedHydrogenServiceName: '',
  selectedHydrogenExtraSessions: 0,
  selectedHydrogenSlots: [],
  selectedHydrogenAddOnServiceName: '',
  selectedHydrogenAddOnSessionIndex: 0,
  hydrogenEditingGroupId: '',
  activeHydrogenSessionIndex: 0,
  activeHydrogenSessionDate: '',
  activeHydrogenSessionTime: '',
  selectedServiceDate: '',
  slotAvailability: {},
  slotCapacityByService: {},
  slotHoldCounts: {},
  bookingHoldMinutes: 10,
  slotAvailabilityLoading: false,
  slotAutoShiftedNotice: '',
  adminDiscountUnlocked: false,
  adminDiscountSearch: '',
  adminDiscountDropdownOpen: false,
  adminDiscountSearchResults: [],
  adminDiscountSearchLoading: false,
  adminDiscountSelectedUsers: [],
  adminDiscountSelectedWindowOpen: false,
  adminBookingNotesByBooking: {},
  adminBookingNotesLoading: false,
  adminBookingNoteEdits: {},
  filters: {
    search: '',
    status: 'all',
    date: '',
  },
};

const SLOT_OPTIONS = [
  { value: '09:30', label: '9:30 AM - 10:30 AM' },
  { value: '10:30', label: '10:30 AM - 11:30 AM' },
  { value: '11:30', label: '11:30 AM - 12:30 PM' },
  { value: '12:30', label: '12:30 PM - 1:30 PM' },
  { value: '13:30', label: '1:30 PM - 2:30 PM' },
  { value: '14:30', label: '2:30 PM - 3:30 PM' },
  { value: '15:30', label: '3:30 PM - 4:30 PM' },
  { value: '16:30', label: '4:30 PM - 5:30 PM' },
  { value: '17:30', label: '5:30 PM - 6:30 PM' },
  { value: '18:30', label: '6:30 PM - 7:30 PM' },
  { value: '19:30', label: '7:30 PM - 8:30 PM' },
];
const BOOKING_WINDOW_DAYS = 60;
const IV_REBOOK_COOLDOWN_DAYS = 14;
const MAX_HYDROGEN_SESSIONS_PER_DAY_PER_USER = 3;
const BOOKING_HOLD_MINUTES = 10;

const elements = {
  authCard: document.getElementById('authCard'),
  authTitle: document.getElementById('authTitle'),
  authSwitchText: document.getElementById('authSwitchText'),
  authSwitchBtn: document.getElementById('authSwitchBtn'),
  authForm: document.getElementById('authForm'),
  authNameWrap: document.getElementById('authNameWrap'),
  authName: document.getElementById('authName'),
  authRoleWrap: document.getElementById('authRoleWrap'),
  authRole: document.getElementById('authRole'),
  authEmail: document.getElementById('authEmail'),
  authPassword: document.getElementById('authPassword'),
  authOtpWrap: document.getElementById('authOtpWrap'),
  authOtp: document.getElementById('authOtp'),
  authSubmitBtn: document.getElementById('authSubmitBtn'),
  authError: document.getElementById('authError'),
  forgotPasswordBtn: document.getElementById('forgotPasswordBtn'),

  profileBtn: document.getElementById('profileBtn'),
  profileAvatar: document.getElementById('profileAvatar'),
  userName: document.getElementById('userName'),
  userRole: document.getElementById('userRole'),
  userMembershipBadge: document.getElementById('userMembershipBadge'),
  logoutBtn: document.getElementById('logoutBtn'),
  appArea: document.getElementById('appArea'),

  profileDialog: document.getElementById('profileDialog'),
  closeProfileDialogBtn: document.getElementById('closeProfileDialogBtn'),
  cancelProfileBtn: document.getElementById('cancelProfileBtn'),
  profileForm: document.getElementById('profileForm'),
  profileFormMessage: document.getElementById('profileFormMessage'),
  profileName: document.getElementById('profileName'),
  profileAge: document.getElementById('profileAge'),
  profileGender: document.getElementById('profileGender'),
  profileMobile: document.getElementById('profileMobile'),
  profileAvatarFile: document.getElementById('profileAvatarFile'),
  profileAvatarPreview: document.getElementById('profileAvatarPreview'),

  totalCount: document.getElementById('totalCount'),
  adminStatTotal: document.getElementById('adminStatTotal'),
  adminHistoryCard: document.getElementById('adminHistoryCard'),
  historyCount: document.getElementById('historyCount'),
  memberChoiceGate: document.getElementById('memberChoiceGate'),
  userTabNav: document.getElementById('userTabNav'),
  userTabServices: document.getElementById('userTabServices'),
  userTabMembership: document.getElementById('userTabMembership'),
  userTabBookings: document.getElementById('userTabBookings'),
  joinAsMemberBtn: document.getElementById('joinAsMemberBtn'),
  continueAsMemberBtn: document.getElementById('continueAsMemberBtn'),
  continueAsNonMemberBtn: document.getElementById('continueAsNonMemberBtn'),
  membershipSection: document.getElementById('membershipSection'),
  servicesSection: document.getElementById('servicesSection'),
  bookingFiltersSection: document.getElementById('bookingFiltersSection'),
  userBookingsSection: document.getElementById('userBookingsSection'),

  serviceGrid: document.getElementById('serviceGrid'),
  serviceEmpty: document.getElementById('serviceEmpty'),
  servicePanelLead: document.getElementById('servicePanelLead'),
  servicePageNote: document.getElementById('servicePageNote'),
  adminCustomerName: document.getElementById('adminCustomerName'),
  adminCustomerEmail: document.getElementById('adminCustomerEmail'),
  adminCustomerPhone: document.getElementById('adminCustomerPhone'),
  adminClientMeta: document.getElementById('adminClientMeta'),
  adminCustomerMessage: document.getElementById('adminCustomerMessage'),
  membershipPlans: document.getElementById('membershipPlans'),
  membershipStatusText: document.getElementById('membershipStatusText'),
  memberFlowLabel: document.getElementById('memberFlowLabel'),
  membershipBrowsePanel: document.getElementById('membershipBrowsePanel'),
  membershipDashboard: document.getElementById('membershipDashboard'),
  membershipWelcomeName: document.getElementById('membershipWelcomeName'),
  membershipDashboardStatus: document.getElementById('membershipDashboardStatus'),
  membershipStatSessions: document.getElementById('membershipStatSessions'),
  membershipStatMembers: document.getElementById('membershipStatMembers'),
  membershipStatValid: document.getElementById('membershipStatValid'),
  membershipUsageLabel: document.getElementById('membershipUsageLabel'),
  membershipUsageBar: document.getElementById('membershipUsageBar'),
  membershipUsageNote: document.getElementById('membershipUsageNote'),
  membershipCalendarMonth: document.getElementById('membershipCalendarMonth'),
  membershipCalendarGrid: document.getElementById('membershipCalendarGrid'),
  membershipCalendarDetails: document.getElementById('membershipCalendarDetails'),
  membershipNextSessionTitle: document.getElementById('membershipNextSessionTitle'),
  membershipNextSessionMeta: document.getElementById('membershipNextSessionMeta'),
  membershipQuickBookBtn: document.getElementById('membershipQuickBookBtn'),
  membershipQuickHistoryBtn: document.getElementById('membershipQuickHistoryBtn'),
  membershipBackBtn: document.getElementById('membershipBackBtn'),
  membershipNextBtn: document.getElementById('membershipNextBtn'),
  bookingNotesDialog: document.getElementById('bookingNotesDialog'),
  bookingNotesCloseBtn: document.getElementById('bookingNotesCloseBtn'),
  bookingNotesAddBtn: document.getElementById('bookingNotesAddBtn'),
  bookingNotesInput: document.getElementById('bookingNotesInput'),
  bookingNotesList: document.getElementById('bookingNotesList'),
  bookingNotesEmpty: document.getElementById('bookingNotesEmpty'),
  bookingNotesBookingId: document.getElementById('bookingNotesBookingId'),
  servicesBackBtn: document.getElementById('servicesBackBtn'),
  servicesNextBtn: document.getElementById('servicesNextBtn'),
  bookingsBackBtn: document.getElementById('bookingsBackBtn'),
  bookingsPayAllBtn: document.getElementById('bookingsPayAllBtn'),
  userCheckoutSummary: document.getElementById('userCheckoutSummary'),
  membershipDialog: document.getElementById('membershipDialog'),
  membershipForm: document.getElementById('membershipForm'),
  membershipDialogTitle: document.getElementById('membershipDialogTitle'),
  membershipPlanSummary: document.getElementById('membershipPlanSummary'),
  membershipMembersGrid: document.getElementById('membershipMembersGrid'),
  closeMembershipDialogBtn: document.getElementById('closeMembershipDialogBtn'),
  cancelMembershipBtn: document.getElementById('cancelMembershipBtn'),

  searchInput: document.getElementById('searchInput'),
  statusFilter: document.getElementById('statusFilter'),
  dateFilter: document.getElementById('dateFilter'),
  resetFiltersBtn: document.getElementById('resetFiltersBtn'),

  bookingTableBody: document.getElementById('bookingTableBody'),
  emptyState: document.getElementById('emptyState'),
  adminBookingTableBody: document.getElementById('adminBookingTableBody'),
  adminEmptyState: document.getElementById('adminEmptyState'),
  adminMembershipOrdersList: document.getElementById('adminMembershipOrdersList'),
  adminMembershipEmptyState: document.getElementById('adminMembershipEmptyState'),
  adminDiscountForm: document.getElementById('adminDiscountForm'),
  adminDiscountEmail: document.getElementById('adminDiscountEmail'),
  adminDiscountPhone: document.getElementById('adminDiscountPhone'),
  adminDiscountPercent: document.getElementById('adminDiscountPercent'),
  adminDiscountSubmitBtn: document.getElementById('adminDiscountSubmitBtn'),
  adminDiscountList: document.getElementById('adminDiscountList'),
  adminDiscountEmptyState: document.getElementById('adminDiscountEmptyState'),
  adminDiscountGateBtn: document.getElementById('adminDiscountGateBtn'),
  adminDiscountGateMessage: document.getElementById('adminDiscountGateMessage'),
  adminDiscountPanel: document.getElementById('adminDiscountPanel'),
  adminDiscountDropdown: document.getElementById('adminDiscountDropdown'),
  adminDiscountUserResults: document.getElementById('adminDiscountUserResults'),
  adminDiscountBulkPercent: document.getElementById('adminDiscountBulkPercent'),
  adminDiscountBulkApplyBtn: document.getElementById('adminDiscountBulkApplyBtn'),
  adminDiscountUsersEmpty: document.getElementById('adminDiscountUsersEmpty'),
  adminDiscountUserSearch: document.getElementById('adminDiscountUserSearch'),
  adminDiscountSelectedCount: document.getElementById('adminDiscountSelectedCount'),
  adminDiscountSelectedBtn: document.getElementById('adminDiscountSelectedBtn'),
  adminDiscountSelectedWindow: document.getElementById('adminDiscountSelectedWindow'),
  adminDiscountSelectedWindowCount: document.getElementById('adminDiscountSelectedWindowCount'),
  adminDiscountSelectedList: document.getElementById('adminDiscountSelectedList'),
  adminCouponForm: document.getElementById('adminCouponForm'),
  adminCouponRecipientEmail: document.getElementById('adminCouponRecipientEmail'),
  adminCouponCode: document.getElementById('adminCouponCode'),
  adminCouponDescription: document.getElementById('adminCouponDescription'),
  adminCouponType: document.getElementById('adminCouponType'),
  adminCouponValue: document.getElementById('adminCouponValue'),
  adminCouponMaxRedemptions: document.getElementById('adminCouponMaxRedemptions'),
  adminCouponExpiresAt: document.getElementById('adminCouponExpiresAt'),
  adminCouponSubmitBtn: document.getElementById('adminCouponSubmitBtn'),
  adminCouponSaveOnlyBtn: document.getElementById('adminCouponSaveOnlyBtn'),
  adminCouponList: document.getElementById('adminCouponList'),
  adminCouponEmptyState: document.getElementById('adminCouponEmptyState'),
  adminUserCards: document.getElementById('adminUserCards'),
  adminUserCardsEmpty: document.getElementById('adminUserCardsEmpty'),
  adminUserSessionDialog: document.getElementById('adminUserSessionDialog'),
  adminUserSessionTitle: document.getElementById('adminUserSessionTitle'),
  adminUserSessionMeta: document.getElementById('adminUserSessionMeta'),
  adminUserSessionCloseBtn: document.getElementById('adminUserSessionCloseBtn'),
  adminUserSessionKpis: document.getElementById('adminUserSessionKpis'),
  adminUserSessionList: document.getElementById('adminUserSessionList'),
  adminUserSessionListEmpty: document.getElementById('adminUserSessionListEmpty'),
  membershipCouponCode: document.getElementById('membershipCouponCode'),
  membershipApplyCouponBtn: document.getElementById('membershipApplyCouponBtn'),
  membershipCouponPreview: document.getElementById('membershipCouponPreview'),
  userCouponCode: document.getElementById('userCouponCode'),
  userApplyCouponBtn: document.getElementById('userApplyCouponBtn'),
  userCouponPreview: document.getElementById('userCouponPreview'),

  adminHistoryToggleBtn: document.getElementById('adminHistoryToggleBtn'),
  adminHistoryToggleBtnWrap: document.getElementById('adminHistoryToggleBtnWrap'),
  adminHistorySection: document.getElementById('adminHistorySection'),
  adminTableTitle: document.getElementById('adminTableTitle'),

  adminSessionSearch: document.getElementById('adminSessionSearch'),
  adminMembershipSearch: document.getElementById('adminMembershipSearch'),

  openBookingBtn: document.getElementById('openBookingBtn'),
  dialog: document.getElementById('bookingDialog'),
  dialogTitle: document.getElementById('dialogTitle'),
  closeDialogBtn: document.getElementById('closeDialogBtn'),
  cancelDialogBtn: document.getElementById('cancelDialogBtn'),
  bookingForm: document.getElementById('bookingForm'),
  bookingId: document.getElementById('bookingId'),
  serviceName: document.getElementById('serviceName'),
  bookingDate: document.getElementById('bookingDate'),
  bookingTime: document.getElementById('bookingTime'),
  bookingNotes: document.getElementById('bookingNotes'),
  experienceBookBtn: document.getElementById('experienceBookBtn'),
};

let isRegisterMode = false;
let isForgotPasswordMode = false;
let signupStage = 'details';
let pendingSignupEmail = '';
let forgotPasswordStage = 'email';
let pendingForgotEmail = '';
let profilePreviewObjectUrl = '';
let availabilityRequestId = 0;
let adminCustomerRefreshTimer = 0;
let adminDiscountSearchTimer = 0;

bootstrap();

async function bootstrap() {
  attachEvents();
  populateTimeSlots();
  await loadCurrentUser();
  if (state.user) {
    await loadProfile();
    await loadDashboardData();
  }
  render();
}

function attachEvents() {
  elements.authSwitchBtn.addEventListener('click', () => {
    isRegisterMode = !isRegisterMode;
    isForgotPasswordMode = false;
    signupStage = 'details';
    pendingSignupEmail = '';
    forgotPasswordStage = 'email';
    pendingForgotEmail = '';
    elements.authOtp.value = '';
    elements.authForm.reset();
    renderAuthMode();
  });

  elements.forgotPasswordBtn.addEventListener('click', () => {
    if (isForgotPasswordMode) {
      isForgotPasswordMode = false;
      forgotPasswordStage = 'email';
      pendingForgotEmail = '';
      elements.authOtp.value = '';
      elements.authPassword.value = '';
      renderAuthMode();
      return;
    }

    isRegisterMode = false;
    isForgotPasswordMode = true;
    forgotPasswordStage = 'email';
    pendingForgotEmail = '';
    elements.authOtp.value = '';
    elements.authPassword.value = '';
    renderAuthMode();
  });

  elements.authForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    await submitAuth();
  });

  elements.logoutBtn.addEventListener('click', async () => {
    const response = await fetch(`${API_URL}/api/auth/logout`, { method: 'POST' });
    if (!response.ok) {
      let message = 'Logout failed.';
      try {
        const data = await response.json();
        message = data?.message || message;
      } catch {
        // ignore json parsing errors for empty responses
      }
      alert(message);
      return;
    }
    state.user = null;
    state.bookings = [];
    state.services = [];
    state.adminMembershipOrders = [];
    state.adminDiscountPhones = [];
    state.adminUsers = [];
    state.adminCoupons = [];
    state.adminSelectedUserId = null;
    state.adminResolvedCustomer = null;
    state.adminCustomerForm = { name: '', email: '', phone: '' };
    state.postLoginChoice = '';
    state.activeUserTab = 'services';
    clearTimeout(adminCustomerRefreshTimer);
    state.membership = { plans: [], active: false, current: null };
    state.membershipAdditions = {};
    state.membershipCheckout = null;
    state.membershipCouponPreview = null;
    state.cartCouponCode = '';
    state.cartCouponPreview = null;
    state.ivSelections = {};
    state.adminDiscountUnlocked = false;
    state.adminDiscountSearch = '';
    state.adminDiscountDropdownOpen = false;
    state.adminDiscountSearchResults = [];
    state.adminDiscountSearchLoading = false;
    state.adminDiscountSelectedUsers = [];
    state.adminDiscountSelectedWindowOpen = false;
    state.adminBookingNotesByBooking = {};
    state.adminBookingNotesLoading = false;
    state.adminBookingNoteEdits = {};
    state.adminBookingNotesByBooking = {};
    state.adminBookingNotesLoading = false;
    state.adminBookingNoteEdits = {};
    state.selectedServiceCategory = null;
    state.selectedSingleSessionServiceName = '';
    state.singleSessionEditingBookingId = '';
    state.selectedHydrogenServiceName = '';
    state.selectedHydrogenExtraSessions = 0;
    state.selectedHydrogenSlots = [];
    state.selectedHydrogenAddOnServiceName = '';
    state.selectedHydrogenAddOnSessionIndex = 0;
    state.hydrogenEditingGroupId = '';
    state.activeHydrogenSessionIndex = 0;
    state.activeHydrogenSessionDate = '';
    state.activeHydrogenSessionTime = '';
    state.selectedServiceDate = '';
    state.slotAvailability = {};
    state.slotCapacityByService = {};
    state.slotAvailabilityLoading = false;
    state.slotAutoShiftedNotice = '';
    isForgotPasswordMode = false;
    signupStage = 'details';
    pendingSignupEmail = '';
    forgotPasswordStage = 'email';
    pendingForgotEmail = '';
    elements.authOtp.value = '';
    if (elements.dialog.open) elements.dialog.close();
    if (elements.profileDialog.open) elements.profileDialog.close();
    if (elements.membershipDialog?.open) elements.membershipDialog.close();
    if (elements.adminUserSessionDialog?.open) elements.adminUserSessionDialog.close();
    renderAuthMode();
    render();
  });
  const updateAdminCustomerField = (field) => (event) => {
    state.adminCustomerForm[field] = String(event.target.value || '').trim();
    if (state.user?.role === 'admin') {
      clearTimeout(adminCustomerRefreshTimer);
      adminCustomerRefreshTimer = window.setTimeout(() => {
        refreshAdminCustomerContext().catch((error) => {
          setAdminCustomerMessage(error.message || 'Unable to load customer services.');
        });
      }, 300);
    }
  };
  elements.adminCustomerName?.addEventListener('input', updateAdminCustomerField('name'));
  elements.adminCustomerPhone?.addEventListener('input', updateAdminCustomerField('phone'));
  elements.adminCustomerEmail?.addEventListener('input', updateAdminCustomerField('email'));
  elements.adminCustomerName?.addEventListener('change', async () => {
    await refreshAdminCustomerContext().catch(() => {});
  });
  elements.adminCustomerEmail?.addEventListener('change', async () => {
    await refreshAdminCustomerContext().catch(() => {});
  });
  elements.adminCustomerPhone?.addEventListener('change', async () => {
    await refreshAdminCustomerContext().catch(() => {});
  });

  elements.profileBtn.addEventListener('click', openProfileDialog);
  elements.joinAsMemberBtn?.addEventListener('click', () => {
    state.postLoginChoice = 'join-member';
    state.activeUserTab = 'membership';
    render();
    requestAnimationFrame(() => {
      document.querySelector('[aria-label="Membership"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
  elements.continueAsMemberBtn?.addEventListener('click', () => {
    if (!isCurrentUserMembershipActive()) {
      state.postLoginChoice = 'join-member';
      state.activeUserTab = 'membership';
      render();
      requestAnimationFrame(() => {
        document.querySelector('[aria-label="Membership"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      alert('No active membership was found for this account. Join as member first to get membership pricing.');
      return;
    }
    state.postLoginChoice = 'continue-member';
    state.activeUserTab = 'services';
    render();
    requestAnimationFrame(() => {
      document.querySelector('[aria-label="Services"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
  elements.continueAsNonMemberBtn?.addEventListener('click', () => {
    state.postLoginChoice = 'continue-non-member';
    state.activeUserTab = 'services';
    render();
    requestAnimationFrame(() => {
      document.querySelector('[aria-label="Services"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
  elements.userTabServices?.addEventListener('click', () => {
    if (state.activeUserTab !== 'services') {
      resetServiceBrowserState();
    }
    state.activeUserTab = 'services';
    render();
  });
  elements.userTabMembership?.addEventListener('click', () => {
    resetServiceBrowserState();
    state.activeUserTab = 'membership';
    render();
  });
  elements.userTabBookings?.addEventListener('click', () => {
    resetServiceBrowserState();
    state.activeUserTab = 'bookings';
    render();
  });
  elements.membershipBackBtn?.addEventListener('click', () => {
    state.postLoginChoice = '';
    state.activeUserTab = 'services';
    render();
    requestAnimationFrame(() => {
      elements.memberChoiceGate?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
  elements.membershipNextBtn?.addEventListener('click', () => {
    resetServiceBrowserState();
    state.activeUserTab = 'services';
    render();
    requestAnimationFrame(() => {
      elements.servicesSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
  elements.membershipQuickBookBtn?.addEventListener('click', () => {
    resetServiceBrowserState();
    state.activeUserTab = 'services';
    render();
    requestAnimationFrame(() => {
      elements.servicesSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
  elements.membershipQuickHistoryBtn?.addEventListener('click', () => {
    resetServiceBrowserState();
    state.activeUserTab = 'bookings';
    render();
    requestAnimationFrame(() => {
      elements.userBookingsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
  elements.servicesBackBtn?.addEventListener('click', () => {
    resetServiceBrowserState();
    if (state.postLoginChoice === 'join-member') {
      state.activeUserTab = 'membership';
      render();
      requestAnimationFrame(() => {
        elements.membershipSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      return;
    }
    state.postLoginChoice = '';
    state.activeUserTab = 'services';
    render();
    requestAnimationFrame(() => {
      elements.memberChoiceGate?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
  elements.servicesNextBtn?.addEventListener('click', () => {
    resetServiceBrowserState();
    state.activeUserTab = 'bookings';
    render();
    requestAnimationFrame(() => {
      elements.userBookingsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
  elements.bookingsBackBtn?.addEventListener('click', () => {
    resetServiceBrowserState();
    state.activeUserTab = 'services';
    render();
    requestAnimationFrame(() => {
      elements.servicesSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
  elements.bookingsPayAllBtn?.addEventListener('click', async () => {
    try {
      await payAllUserBookings();
    } catch (error) {
      alert(error?.message || 'Unable to start payment right now.');
    }
  });
  elements.closeProfileDialogBtn.addEventListener('click', closeProfileDialog);
  elements.cancelProfileBtn.addEventListener('click', closeProfileDialog);
  elements.adminUserSessionCloseBtn?.addEventListener('click', closeAdminUserSessionDialog);
  elements.profileForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitBtn = elements.profileForm.querySelector('button[type="submit"]');
    const originalLabel = submitBtn ? submitBtn.textContent : '';
    try {
      elements.profileFormMessage.textContent = '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';
      }
      await saveProfile();
    } catch (error) {
      elements.profileFormMessage.textContent = error.message || 'Unable to save profile.';
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel || 'Save Profile';
      }
    }
  });
  elements.profileAvatarFile.addEventListener('change', handleProfileAvatarSelection);

  elements.closeMembershipDialogBtn?.addEventListener('click', closeMembershipDialog);
  elements.cancelMembershipBtn?.addEventListener('click', closeMembershipDialog);
  elements.membershipForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    await submitMembershipCheckout();
  });
  elements.membershipApplyCouponBtn?.addEventListener('click', async () => {
    await previewMembershipCoupon();
  });
  elements.membershipCouponCode?.addEventListener('input', () => {
    state.membershipCouponPreview = null;
    renderMembershipCouponPreview();
    renderMembershipCheckoutSummary();
  });

  elements.adminDiscountForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const fallbackUser = findAdminUserByContact(
      elements.adminDiscountEmail?.value,
      elements.adminDiscountPhone?.value
    );
    if (fallbackUser) {
      await applyAdminUserDiscount({
        userId: fallbackUser.id,
        email: elements.adminDiscountEmail?.value,
        phone: elements.adminDiscountPhone?.value,
        discountPercent: elements.adminDiscountPercent?.value,
      });
      return;
    }
    await saveAdminDiscountPhone();
  });
  elements.adminDiscountGateBtn?.addEventListener('click', async () => {
    await unlockAdminDiscounts();
  });
  elements.adminDiscountUserSearch?.addEventListener('input', (event) => {
    const nextQuery = String(event.target.value || '').trim();
    state.adminDiscountSearch = nextQuery;
    scheduleAdminDiscountSearch(nextQuery);
  });
  elements.adminDiscountUserSearch?.addEventListener('focus', () => {
    if (!state.adminDiscountDropdownOpen) {
      state.adminDiscountDropdownOpen = true;
      scheduleAdminDiscountSearch(state.adminDiscountSearch);
      render();
    }
  });
  elements.adminDiscountUserSearch?.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      state.adminDiscountDropdownOpen = false;
      render();
    }
  });
  elements.adminDiscountBulkApplyBtn?.addEventListener('click', async () => {
    await applyAdminDiscountToSelected();
  });
  elements.adminDiscountSelectedBtn?.addEventListener('click', () => {
    state.adminDiscountSelectedWindowOpen = !state.adminDiscountSelectedWindowOpen;
    render();
  });
  elements.bookingNotesAddBtn?.addEventListener('click', async () => {
    await addBookingNote();
  });
  elements.bookingNotesCloseBtn?.addEventListener('click', closeBookingNotesDialog);
  elements.adminCouponForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    await saveAdminCoupon({ sendEmail: true });
  });
  elements.adminCouponSaveOnlyBtn?.addEventListener('click', async () => {
    await saveAdminCoupon({ sendEmail: false });
  });
  elements.userApplyCouponBtn?.addEventListener('click', async () => {
    await previewCartCoupon();
  });
  elements.userCouponCode?.addEventListener('input', () => {
    state.cartCouponPreview = null;
    renderCartCouponPreview();
    renderUserCheckoutSummary(state.bookings || []);
  });

  elements.openBookingBtn?.addEventListener('click', () => openDialog());
  elements.experienceBookBtn?.addEventListener('click', () => {
    state.forceExperienceBooking = true;
    openDialog();
  });
  elements.experienceBookBtn?.addEventListener('click', () => {
    openDialog();
    const experienceService =
      state.services.find((service) => String(service.name || '').trim().toLowerCase() === 'experience session') ||
      state.services.find((service) => String(service.name || '').trim().toLowerCase().includes('experience')) ||
      null;
    if (experienceService && elements.serviceName) {
      elements.serviceName.value = experienceService.name;
    }
  });
  elements.bookingForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    await upsertBooking();
  });
  elements.closeDialogBtn.addEventListener('click', closeDialog);
  elements.cancelDialogBtn.addEventListener('click', closeDialog);

  elements.searchInput.addEventListener('input', (event) => {
    state.filters.search = event.target.value.trim().toLowerCase();
    render();
  });
  elements.statusFilter.addEventListener('change', (event) => {
    state.filters.status = event.target.value;
    render();
  });
  elements.dateFilter.addEventListener('change', (event) => {
    state.filters.date = event.target.value;
    render();
  });
  elements.resetFiltersBtn.addEventListener('click', () => {
    state.filters = { search: '', status: 'all', date: '' };
    elements.searchInput.value = '';
    elements.statusFilter.value = 'all';
    elements.dateFilter.value = '';
    render();
  });

  elements.adminHistoryToggleBtn?.addEventListener('click', () => {
    state.adminHistoryVisible = !state.adminHistoryVisible;
    render();
    if (state.adminHistoryVisible) {
      requestAnimationFrame(() => {
        elements.adminHistorySection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  });



  elements.adminSessionSearch?.addEventListener('input', (event) => {
    state.adminSessionSearch = String(event.target.value || '').trim().toLowerCase();
    render();
  });

  elements.adminMembershipSearch?.addEventListener('input', (event) => {
    state.adminMembershipSearch = String(event.target.value || '').trim().toLowerCase();
    render();
  });

  elements.adminStatTotal?.addEventListener('click', () => {
    state.adminHistoryVisible = false;
    render();
    requestAnimationFrame(() => {
      elements.adminHistorySection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  elements.adminHistoryCard?.addEventListener('click', () => {
    state.adminHistoryVisible = !state.adminHistoryVisible;
    render();
    if (state.adminHistoryVisible) {
      requestAnimationFrame(() => {
        elements.adminHistorySection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  });

  document.addEventListener('click', (event) => {
    const target = event.target;

    if (state.adminDiscountDropdownOpen) {
      if (elements.adminDiscountDropdown?.contains(target) || elements.adminDiscountUserSearch?.contains(target)) {
        return;
      }
      state.adminDiscountDropdownOpen = false;
      render();
    }

    if (!state.adminDiscountSelectedWindowOpen) return;
    if (elements.adminDiscountSelectedWindow?.contains(target) || elements.adminDiscountSelectedBtn?.contains(target)) {
      return;
    }
    state.adminDiscountSelectedWindowOpen = false;
    render();
  });

  renderAuthMode();
}

function renderAuthMode(preserveMessage = false) {
  if (!preserveMessage) elements.authError.textContent = '';
  const isSignupDetailsStep = isRegisterMode && signupStage === 'details';
  const isSignupOtpStep = isRegisterMode && signupStage === 'otp';
  const isSignupPasswordStep = isRegisterMode && signupStage === 'password';
  const isForgotEmailStep = !isRegisterMode && isForgotPasswordMode && forgotPasswordStage === 'email';
  const isForgotOtpStep = !isRegisterMode && isForgotPasswordMode && forgotPasswordStage === 'otp';
  const isForgotPasswordStep = !isRegisterMode && isForgotPasswordMode && forgotPasswordStage === 'password';
  const isLoginStep = !isRegisterMode && !isForgotPasswordMode;
  const authPasswordWrap = elements.authPassword.parentElement;

  elements.authNameWrap.hidden = !isSignupDetailsStep;
  elements.authRoleWrap.hidden = true;
  elements.authOtpWrap.hidden = !(isSignupOtpStep || isForgotOtpStep);
  authPasswordWrap.hidden = !(isLoginStep || isSignupPasswordStep || isForgotPasswordStep);

  elements.authName.required = isSignupDetailsStep;
  elements.authPassword.required = isLoginStep || isSignupPasswordStep || isForgotPasswordStep;
  elements.authOtp.required = isSignupOtpStep || isForgotOtpStep;
  elements.authEmail.readOnly = isSignupOtpStep || isSignupPasswordStep || isForgotOtpStep || isForgotPasswordStep;

  if ((isSignupOtpStep || isSignupPasswordStep) && pendingSignupEmail) {
    elements.authEmail.value = pendingSignupEmail;
  }
  if ((isForgotOtpStep || isForgotPasswordStep) && pendingForgotEmail) {
    elements.authEmail.value = pendingForgotEmail;
  }

  if (isSignupDetailsStep) {
    elements.authTitle.textContent = 'Create your account';
    elements.authSubmitBtn.textContent = 'Send Signup OTP';
  } else if (isSignupOtpStep) {
    elements.authTitle.textContent = 'Verify signup OTP';
    elements.authSubmitBtn.textContent = 'Verify OTP';
  } else if (isSignupPasswordStep) {
    elements.authTitle.textContent = 'Set password';
    elements.authSubmitBtn.textContent = 'Complete Signup';
  } else if (isForgotEmailStep) {
    elements.authTitle.textContent = 'Forgot password';
    elements.authSubmitBtn.textContent = 'Send Reset OTP';
  } else if (isForgotOtpStep) {
    elements.authTitle.textContent = 'Verify reset OTP';
    elements.authSubmitBtn.textContent = 'Verify OTP';
  } else if (isForgotPasswordStep) {
    elements.authTitle.textContent = 'Set new password';
    elements.authSubmitBtn.textContent = 'Reset Password';
  } else {
    elements.authTitle.textContent = 'Sign in to continue';
    elements.authSubmitBtn.textContent = 'Sign in';
  }

  elements.authSwitchText.textContent = isRegisterMode
    ? 'Already have an account?'
    : "Don't have an account?";
  elements.authSwitchBtn.textContent = isRegisterMode ? 'Sign in' : 'Register';
  elements.forgotPasswordBtn.textContent = isForgotPasswordMode ? 'Back to sign in' : 'Forgot password?';
  elements.forgotPasswordBtn.hidden = isRegisterMode;
}

async function submitAuth() {
  elements.authError.textContent = '';

  try {
    if (!isRegisterMode && !isForgotPasswordMode) {
      const email = elements.authEmail.value.trim();
      const password = elements.authPassword.value;
      const result = await api('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      state.user = result.user;
      state.postLoginChoice = '';
      state.activeUserTab = 'services';
      elements.authForm.reset();
      await loadProfile();
      await loadDashboardData();
      render();
      return;
    }

    if (isForgotPasswordMode) {
      if (forgotPasswordStage === 'email') {
        const email = elements.authEmail.value.trim();
        const result = await api('/api/auth/password/forgot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        pendingForgotEmail = email;
        forgotPasswordStage = 'otp';
        elements.authOtp.value = '';
        elements.authError.textContent = result.message || 'Password reset OTP sent.';
        renderAuthMode(true);
        return;
      }

      if (forgotPasswordStage === 'otp') {
        const otp = elements.authOtp.value.trim();
        const result = await api('/api/auth/password/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: pendingForgotEmail || elements.authEmail.value.trim(),
            otp,
          }),
        });

        forgotPasswordStage = 'password';
        elements.authPassword.value = '';
        elements.authError.textContent = result.message || 'OTP verified. Set your new password.';
        renderAuthMode(true);
        return;
      }

      const password = elements.authPassword.value;
      const result = await api('/api/auth/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: pendingForgotEmail || elements.authEmail.value.trim(),
          password,
        }),
      });

      isForgotPasswordMode = false;
      forgotPasswordStage = 'email';
      pendingForgotEmail = '';
      elements.authOtp.value = '';
      elements.authPassword.value = '';
      elements.authError.textContent = result.message || 'Password reset successful. Please login.';
      renderAuthMode(true);
      return;
    }

    if (signupStage === 'details') {
      const name = elements.authName.value.trim();
      const email = elements.authEmail.value.trim();
      if (!name) {
        elements.authError.textContent = 'Name is required.';
        return;
      }

      const result = await api('/api/auth/register/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });

      pendingSignupEmail = email;
      signupStage = 'otp';
      elements.authOtp.value = '';
      elements.authError.textContent = result.message || 'Signup OTP sent.';
      renderAuthMode(true);
      return;
    }

    if (signupStage === 'otp') {
      const otp = elements.authOtp.value.trim();
      const result = await api('/api/auth/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: pendingSignupEmail || elements.authEmail.value.trim(),
          otp,
        }),
      });

      signupStage = 'password';
      elements.authPassword.value = '';
      elements.authError.textContent = result.message || 'OTP verified. Set your password.';
      renderAuthMode(true);
      return;
    }

    const password = elements.authPassword.value;
    const result = await api('/api/auth/register/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: pendingSignupEmail || elements.authEmail.value.trim(),
        password,
      }),
    });

    state.user = result.user;
    state.postLoginChoice = '';
    state.activeUserTab = 'services';
    signupStage = 'details';
    pendingSignupEmail = '';
    elements.authForm.reset();
    await loadProfile();
    await loadDashboardData();
    render();
  } catch (error) {
    elements.authError.textContent = error.message;
  }
}

async function loadCurrentUser() {
  try {
    const result = await api('/api/auth/me');
    state.user = result.user;
    syncPostLoginChoiceWithMembership();
  } catch {
    state.user = null;
  }
}

async function loadProfile() {
  const result = await api('/api/profile');
  state.user = { ...state.user, ...result.profile };
  syncPostLoginChoiceWithMembership();
}

function syncPostLoginChoiceWithMembership() {
  if (state.user?.role !== 'user') return;
  if (isCurrentUserMembershipActive()) {
    state.postLoginChoice = 'continue-member';
  }
}

function isAdminCustomerFormReady() {
  return Boolean(
    String(state.adminCustomerForm.name || '').trim() &&
      String(state.adminCustomerForm.email || '').trim() &&
      String(state.adminCustomerForm.phone || '').trim()
  );
}

function setAdminCustomerMessage(message = '') {
  if (!elements.adminCustomerMessage) return;
  const text = String(message || '').trim();
  elements.adminCustomerMessage.textContent = text;
  elements.adminCustomerMessage.hidden = !text;
}

async function refreshAdminCustomerContext() {
  if (state.user?.role !== 'admin') return;
  clearTimeout(adminCustomerRefreshTimer);
    state.ivSelections = {};
    state.selectedSingleSessionServiceName = '';
    state.singleSessionEditingBookingId = '';
    resetHydrogenComposer();
  state.selectedServiceDate = getTodayIsoDate();
  state.slotAvailability = {};
  state.slotCapacityByService = {};
  state.slotAvailabilityLoading = false;
  state.slotAutoShiftedNotice = '';
  try {
    await loadDashboardData();
    if (!isAdminCustomerFormReady()) {
      setAdminCustomerMessage('Booking page is ready. Enter customer details before saving the booking.');
    } else if (Number(state.adminResolvedCustomer?.discountPercent || 0) > 0) {
      setAdminCustomerMessage(
        `Customer details loaded. A ${Number(state.adminResolvedCustomer.discountPercent)}% service discount will apply for this phone number.`
      );
    } else if (state.adminResolvedCustomer?.membershipStatus === 'active') {
      setAdminCustomerMessage('Active membership found. Member pricing and membership-only services are loaded.');
    } else {
      setAdminCustomerMessage('Customer details loaded. Standard booking flow is ready.');
    }
  } catch (error) {
    setAdminCustomerMessage(error.message || 'Unable to refresh customer-specific pricing. Standard booking flow is still available.');
  }
  render();
}

async function loadDashboardData() {
  if (state.user?.role === 'admin') {
    const [
      bookingsResult,
      membershipOrdersResult,
      discountPhonesResult,
      couponsResult,
      genericServicesResult,
      adminUsersResult,
    ] = await Promise.all([
      api('/api/bookings'),
      api('/api/admin/membership-orders'),
      api('/api/admin/discount-phones'),
      api('/api/admin/coupons'),
      api('/api/services'),
      api('/api/admin/users'),
    ]);
    state.bookings = bookingsResult.bookings || [];
    state.adminMembershipOrders = membershipOrdersResult.orders || [];
    state.adminDiscountPhones = discountPhonesResult.discountPhones || [];
    state.adminCoupons = couponsResult.coupons || [];
    state.adminUsers = adminUsersResult.users || [];
    state.membership = { plans: [], active: false, current: null };
    state.services = genericServicesResult.services || [];
    state.adminResolvedCustomer = null;

    if (isAdminCustomerFormReady()) {
      try {
        const servicesResult = await api('/api/admin/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerName: state.adminCustomerForm.name,
            customerEmail: state.adminCustomerForm.email,
            customerPhone: state.adminCustomerForm.phone,
          }),
        });
        state.services = servicesResult.services || state.services;
        state.adminResolvedCustomer = servicesResult.resolvedCustomer || null;
      } catch {
        state.adminResolvedCustomer = null;
      }
    }
  } else {
    const [servicesResult, bookingsResult, membershipResult] = await Promise.all([
      api('/api/services'),
      api('/api/bookings'),
      api('/api/membership/plans'),
    ]);
    state.services = servicesResult.services || [];
    state.bookings = bookingsResult.bookings || [];
    state.membership = {
      plans: membershipResult.plans || [],
      active: Boolean(membershipResult.active),
      current: membershipResult.current || null,
    };
    state.adminMembershipOrders = [];
    state.adminDiscountPhones = [];
    state.adminCoupons = [];
    state.adminResolvedCustomer = null;
    state.adminCustomerForm = { name: '', email: '', phone: '' };
    state.membershipCouponPreview = null;
    state.cartCouponPreview = null;
  }

  if (state.selectedServiceCategory) {
    const stillExists = state.services.some(
      (service) => String(service.category || '').toUpperCase() === state.selectedServiceCategory
    );
    if (!stillExists) state.selectedServiceCategory = null;
  }
  if (state.selectedHydrogenServiceName) {
    const hydrogenServiceExists = state.services.some((service) => String(service.name || '') === state.selectedHydrogenServiceName);
    if (!hydrogenServiceExists) state.selectedHydrogenServiceName = '';
  }
  if (!state.selectedServiceDate) {
    state.selectedServiceDate = getTodayIsoDate();
  }
  if (state.selectedServiceCategory) {
    await loadServiceAvailability();
  }
  state.slotAutoShiftedNotice = '';
}

async function loadServiceAvailability() {
  if (!state.selectedServiceCategory || !state.selectedServiceDate) {
    state.slotAvailabilityLoading = false;
    renderServices();
    return;
  }
  if (state.user?.role === 'admin' && !isAdminCustomerFormReady()) {
    state.slotAvailabilityLoading = false;
    renderServices();
    return;
  }
  const requestId = ++availabilityRequestId;
  state.slotAvailabilityLoading = true;
  renderServices();

  const params = new URLSearchParams({
    bookingDate: state.selectedServiceDate,
    category: state.selectedServiceCategory,
  });
  if (state.user?.role === 'admin' && isAdminCustomerFormReady()) {
    params.set('customerEmail', state.adminCustomerForm.email);
  }
  const apiBase = API_URL || window.location.origin;
  const url = `${apiBase}/api/services/availability?${params.toString()}`;

  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      if (requestId !== availabilityRequestId) return;
      console.log('API DATA:', data);

      // 🔥 THIS IS THE FIX
      state.slotAvailability = data.slots || data.availability || {};
      state.slotCapacityByService = data.slotCapacityByService || {};
      state.slotHoldCounts = data.holds || {};
      state.bookingHoldMinutes = Number(data.holdMinutes || BOOKING_HOLD_MINUTES) || BOOKING_HOLD_MINUTES;

      const todayIso = getTodayIsoDate();
      const hasFutureSlots = SLOT_OPTIONS.some(
        (slot) => !isBookingSlotInPast(state.selectedServiceDate, slot.value)
      );
      if (!hasFutureSlots && state.selectedServiceDate === todayIso) {
        state.slotAutoShiftedNotice = 'Today has no remaining slots. Showing the next available day.';
        state.selectedServiceDate = getTomorrowIsoDate();
        state.slotAvailability = {};
        state.slotCapacityByService = {};
        state.slotHoldCounts = {};
        state.slotAvailabilityLoading = true;
        renderServices();
        loadServiceAvailability();
        return;
      }

      state.slotAvailabilityLoading = false;
      renderServices();
    })
    .catch((err) => {
      if (requestId !== availabilityRequestId) return;
      console.error(err);
      state.slotAvailability = {};
      state.slotCapacityByService = {};
      state.slotHoldCounts = {};
      state.slotAvailabilityLoading = false;
      renderServices();
    });
}

function refreshSelectedCategoryAvailability(bookingDate = '') {
  state.selectedServiceDate = bookingDate || getTodayIsoDate();
  state.slotAvailability = {};
  state.slotCapacityByService = {};
  state.slotHoldCounts = {};
  state.slotAvailabilityLoading = true;
  render();
  loadServiceAvailability();
}

function resetServiceBrowserState() {
  resetHydrogenComposer();
  resetSingleSessionComposer();
  state.selectedServiceCategory = null;
  state.selectedServiceDate = getTodayIsoDate();
  state.slotAvailability = {};
  state.slotCapacityByService = {};
  state.slotHoldCounts = {};
  state.slotAvailabilityLoading = false;
  state.slotAutoShiftedNotice = '';
}

function getHydrogenSlotsForSubmit(requiredSlots) {
  const slots = state.selectedHydrogenSlots.slice(0, requiredSlots);
  const activeIndex = Number(state.activeHydrogenSessionIndex || 0);
  if (activeIndex >= 0 && activeIndex < requiredSlots && state.activeHydrogenSessionDate && state.activeHydrogenSessionTime) {
    slots[activeIndex] = {
      bookingDate: state.activeHydrogenSessionDate,
      bookingTime: state.activeHydrogenSessionTime,
    };
  }
  return slots;
}

function populateAvailableTimeOptions(selectElement, serviceName, bookingDate, currentReservedSlot = null, preferredTime = '') {
  if (!selectElement) return;
  const selectedValue = String(selectElement.value || preferredTime || currentReservedSlot?.bookingTime || '').trim();
  selectElement.innerHTML = '';

  const serviceAvailability = state.slotAvailability[String(serviceName || '')] || {};
  const serviceHolds = state.slotHoldCounts[String(serviceName || '')] || {};
  const capacity = Number(state.slotCapacityByService[String(serviceName || '')] || 1);
  const reservedDate = String(currentReservedSlot?.bookingDate || '').trim();
  const reservedTime = String(currentReservedSlot?.bookingTime || '').trim();
  const holdMinutes = Number(state.bookingHoldMinutes || BOOKING_HOLD_MINUTES) || BOOKING_HOLD_MINUTES;

  for (const optionData of SLOT_OPTIONS) {
    const booked = Number(serviceAvailability[optionData.value] || 0);
    const held = Number(serviceHolds[optionData.value] || 0);
    const isCurrentReserved = bookingDate === reservedDate && optionData.value === reservedTime;
    const isPastSlot = isBookingSlotInPast(bookingDate, optionData.value);
    const isFull = booked >= capacity && !isCurrentReserved;
    const option = document.createElement('option');
    option.value = optionData.value;
    option.textContent = isPastSlot
      ? `${optionData.label} (Unavailable)`
      : isFull
        ? held > 0
          ? `${optionData.label} (On hold - try in ${holdMinutes} min)`
          : `${optionData.label} (Full)`
        : optionData.label;
    option.disabled = isPastSlot || isFull;
    selectElement.appendChild(option);
  }

  const hasSelected = [...selectElement.options].some((option) => option.value === selectedValue && !option.disabled);
  if (hasSelected) {
    selectElement.value = selectedValue;
    return;
  }

  const fallback = [...selectElement.options].find((option) => !option.disabled);
  selectElement.value = fallback?.value || SLOT_OPTIONS[0].value;
}

function populateTimeSlots() {
  elements.bookingTime.innerHTML = '';
  for (const slot of SLOT_OPTIONS) {
    const option = document.createElement('option');
    option.value = slot.value;
    option.textContent = slot.label;
    elements.bookingTime.appendChild(option);
  }
}

function populateServiceOptions(selectedService = '') {
  elements.serviceName.innerHTML = '';
  for (const service of state.services) {
    const category = String(service.category || '').toUpperCase();
    const isExperience = category === 'EXPERIENCE SESSION' || String(service.name || '').toLowerCase().includes('experience');
    if (isExperience && !state.forceExperienceBooking && selectedService !== service.name) {
      continue;
    }
    const option = document.createElement('option');
    option.value = service.name;
    const isIncluded = Boolean(service.membershipOnly) && isCurrentUserMembershipActive();
    option.textContent = isIncluded
      ? `${service.name} - Included in Membership`
      : service.membershipOnly
        ? `${service.name} - Free for Members Only`
        : `${service.name} - Rs. ${Number(service.effectivePriceInr ?? service.priceInr ?? 0).toLocaleString('en-IN')}`;
    option.dataset.category = service.category;
    elements.serviceName.appendChild(option);
  }

  if (selectedService) {
    const hasMatch = state.services.some((service) => service.name === selectedService);
    if (hasMatch) elements.serviceName.value = selectedService;
  }
}

async function loadAdminDiscountUsers() {
  if (state.user?.role !== 'admin') return;
  const result = await api('/api/admin/users');
  state.adminUsers = result.users || [];
}

async function unlockAdminDiscounts() {
  const password = window.prompt('Enter the discount admin password');
  if (!password) return;
  try {
    await api('/api/admin/discount-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    state.adminDiscountUnlocked = true;
    if (elements.adminDiscountGateMessage) {
      elements.adminDiscountGateMessage.textContent = 'Discounts unlocked for this session.';
      elements.adminDiscountGateMessage.hidden = false;
    }
    await loadAdminDiscountUsers();
    render();
  } catch (error) {
    alert(error.message || 'Invalid discount password.');
  }
}

function populateBookingDateOptions(selectedDate = '') {
  const options = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  for (let i = 0; i <= BOOKING_WINDOW_DAYS; i += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    const year = day.getFullYear();
    const month = String(day.getMonth() + 1).padStart(2, '0');
    const date = String(day.getDate()).padStart(2, '0');
    const iso = `${year}-${month}-${date}`;
    const label = new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(day);
    options.push({ value: iso, label });
  }

  elements.bookingDate.innerHTML = '';
  for (const optionData of options) {
    const option = document.createElement('option');
    option.value = optionData.value;
    option.textContent = optionData.label;
    elements.bookingDate.appendChild(option);
  }

  if (options.length === 0) return;
  const hasSelected = options.some((option) => option.value === selectedDate);
  elements.bookingDate.value = hasSelected ? selectedDate : options[0].value;
}

function openDialog(booking = null) {
  populateServiceOptions();
  populateTimeSlots();
  elements.serviceName.disabled = false;

  if (booking) {
    elements.dialogTitle.textContent = 'Edit Booking';
    elements.bookingId.value = String(booking.id);
    populateServiceOptions(booking.serviceName);
    populateBookingDateOptions(booking.bookingDate);
    elements.bookingTime.value = booking.bookingTime;
    elements.bookingNotes.value = booking.notes || '';
    elements.serviceName.disabled = Boolean(booking.bookingGroupId);
  } else {
    elements.dialogTitle.textContent = 'Book Slot';
    elements.bookingForm.reset();
    elements.bookingId.value = '';
    populateServiceOptions();
    populateBookingDateOptions();
    elements.bookingTime.value = SLOT_OPTIONS[0].value;
  }

  if (!booking && state.forceExperienceBooking) {
    const experienceService =
      state.services.find((service) => String(service.name || '').trim().toLowerCase() === 'experience session') ||
      state.services.find((service) => String(service.name || '').trim().toLowerCase().includes('experience')) ||
      null;
    if (experienceService && elements.serviceName) {
      elements.serviceName.value = experienceService.name;
      elements.serviceName.disabled = true;
    }
    const experienceLabel = document.getElementById('experienceServiceLabel');
    if (experienceLabel) {
      experienceLabel.hidden = false;
    }
    if (elements.serviceName) {
      elements.serviceName.hidden = true;
    }
  }

  elements.dialog.showModal();
}

function closeDialog() {
  elements.dialog.close();
  state.forceExperienceBooking = false;
  const experienceLabel = document.getElementById('experienceServiceLabel');
  if (experienceLabel) {
    experienceLabel.hidden = true;
  }
  if (elements.serviceName) {
    elements.serviceName.hidden = false;
    elements.serviceName.disabled = false;
  }
}

function openProfileDialog() {
  if (!state.user) return;

  elements.profileFormMessage.textContent = '';
  elements.profileName.value = state.user.name || '';
  elements.profileAge.value = state.user.age ?? '';
  elements.profileGender.value = state.user.gender || '';
  elements.profileMobile.value = state.user.mobile || '';
  elements.profileAvatarFile.value = '';
  setProfilePreview(state.user.avatarUrl || '');
  elements.profileDialog.showModal();
}

function closeProfileDialog() {
  elements.profileFormMessage.textContent = '';
  clearProfilePreviewObjectUrl();
  elements.profileDialog.close();
  renderProfileAvatar();
}

function openAdminUserSessionDialog(userId) {
  if (!elements.adminUserSessionDialog) return;
  state.adminSelectedUserId = userId == null ? null : String(userId);
  renderAdminUserSessionDialog();
  if (elements.adminUserSessionDialog.open) {
    elements.adminUserSessionDialog.close();
  }
  elements.adminUserSessionDialog.showModal();
}

function closeAdminUserSessionDialog() {
  if (!elements.adminUserSessionDialog) return;
  elements.adminUserSessionDialog.close();
}

async function saveProfile() {
  if (elements.profileAvatarFile.files && elements.profileAvatarFile.files[0]) {
    const formData = new FormData();
    formData.append('avatar', elements.profileAvatarFile.files[0]);
    const uploadResult = await api('/api/profile/avatar', {
      method: 'POST',
      body: formData,
    });
    state.user = {
      ...state.user,
      ...uploadResult.profile,
      avatarUrl: withCacheBuster(uploadResult.profile.avatarUrl || ''),
    };
  }

  const payload = {
    name: elements.profileName.value.trim(),
    age: elements.profileAge.value.trim(),
    gender: elements.profileGender.value,
    mobile: elements.profileMobile.value.trim(),
  };

  const result = await api('/api/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  state.user = {
    ...state.user,
    ...result.profile,
    avatarUrl: withCacheBuster(result.profile.avatarUrl || state.user.avatarUrl || ''),
  };

  closeProfileDialog();
  render();
}

function handleProfileAvatarSelection() {
  clearProfilePreviewObjectUrl();
  const file = elements.profileAvatarFile.files?.[0];
  if (!file) {
    setProfilePreview(state.user?.avatarUrl || '');
    renderProfileAvatar();
    return;
  }

  profilePreviewObjectUrl = URL.createObjectURL(file);
  setProfilePreview(profilePreviewObjectUrl);
  elements.profileAvatar.textContent = '';
  elements.profileAvatar.style.backgroundImage = `url("${profilePreviewObjectUrl}")`;
  elements.profileAvatar.classList.add('has-image');
}

function clearProfilePreviewObjectUrl() {
  if (profilePreviewObjectUrl) {
    URL.revokeObjectURL(profilePreviewObjectUrl);
    profilePreviewObjectUrl = '';
  }
}

function setProfilePreview(src) {
  const normalized = normalizeAvatarUrl(src);
  if (!normalized) {
    elements.profileAvatarPreview.removeAttribute('src');
    elements.profileAvatarPreview.classList.remove('has-preview');
    return;
  }

  elements.profileAvatarPreview.src = normalized;
  elements.profileAvatarPreview.classList.add('has-preview');
}

async function upsertBooking() {
  const payload = {
    serviceName: elements.serviceName.value,
    bookingDate: elements.bookingDate.value,
    bookingTime: elements.bookingTime.value,
    notes: elements.bookingNotes.value.trim(),
  };
  const isAdmin = state.user?.role === 'admin';
  if (isAdmin) {
    if (!isAdminCustomerFormReady()) {
      alert('Enter customer name, email, and contact number first.');
      return;
    }
    payload.customerName = state.adminCustomerForm.name;
    payload.customerEmail = state.adminCustomerForm.email;
    payload.customerPhone = state.adminCustomerForm.phone;
  }

  const id = elements.bookingId.value;
  if (id) {
    await api(`/api/bookings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } else {
    await api(isAdmin ? '/api/admin/bookings' : '/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  await loadDashboardData();
  closeDialog();
  render();
}

async function changeStatus(id, status) {
  await api(`/api/bookings/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  await loadDashboardData();
  render();
}

async function copyBookingPaymentLink(id) {
  const result = await api(`/api/bookings/${id}/payment-link`);
  copyTextToClipboard(result.paymentLinkUrl || '');
  alert(`Payment Link\n\n${result.paymentLinkUrl}\n\nPayment link copied.`);
}

async function payBooking(id) {
  const result = await api('/api/payments/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookingId: id }),
  });

  if (!window.Razorpay) {
    throw new Error('Razorpay SDK not loaded');
  }

  const options = {
    key: result.keyId,
    amount: result.amount,
    currency: result.currency || 'INR',
    name: 'H2 House Of Health',
    description: `${result.booking.serviceName}`,
    order_id: result.orderId,
    prefill: {
      name: result.user?.name || '',
      email: result.user?.email || '',
    },
    theme: {
      color: '#8b5e3c',
    },
    handler: async (response) => {
      try {
        const verifyResult = await api('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          }),
        });
        await loadDashboardData();
        render();
        const bookingCount = Number(verifyResult.bookingCount || result.bookingCount || 1);
        const totalAmountInr = Number(result.summary?.totalAmountInr || result.booking?.amountInr || 0);
        alert(
          bookingCount > 1
            ? `Payment successful. ${bookingCount} booking(s) marked as booked. Total paid: Rs. ${totalAmountInr.toLocaleString(
                'en-IN'
              )}.`
            : `Payment successful. Booking marked as booked. Amount paid: Rs. ${totalAmountInr.toLocaleString('en-IN')}.`
        );
      } catch (error) {
        await loadDashboardData();
        render();
        alert(error.message || 'Payment verification failed.');
      }
    },
    modal: {
      ondismiss: async () => {
        await loadDashboardData();
        render();
        alert('Payment was canceled.');
      },
    },
  };

  const checkout = new window.Razorpay(options);
  checkout.open();
}

async function payAllUserBookings() {
  const payButton = elements.bookingsPayAllBtn;
  const originalLabel = payButton?.textContent || 'Pay Now';
  const couponCode = String(elements.userCouponCode?.value || '').trim();

  if (payButton) {
    payButton.disabled = true;
    payButton.textContent = 'Starting payment...';
  }

  try {
    const result = await api('/api/payments/create-cart-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ couponCode }),
    });

    if (!window.Razorpay) {
      throw new Error('Razorpay SDK not loaded');
    }

    const options = {
      key: result.keyId,
      amount: result.amount,
      currency: result.currency || 'INR',
      name: 'H2 House Of Health',
      description: `My Bookings Payment`,
      order_id: result.orderId,
      prefill: {
        name: result.user?.name || '',
        email: result.user?.email || '',
      },
      theme: {
        color: '#8b5e3c',
      },
      handler: async (response) => {
        try {
          const verifyResult = await api('/api/payments/verify-cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          await loadDashboardData();
          state.cartCouponPreview = null;
          if (elements.userCouponCode) elements.userCouponCode.value = '';
          renderCartCouponPreview();
          render();
          alert(
            `Payment successful. ${Number(verifyResult.unitCount || 0)} item(s) paid in one checkout. Total paid: Rs. ${Number(
              verifyResult.totalAmountInr || result.summary?.totalAmountInr || 0
            ).toLocaleString('en-IN')}.`
          );
        } catch (error) {
          await loadDashboardData();
          render();
          alert(error.message || 'Payment verification failed.');
        } finally {
          if (payButton) {
            payButton.disabled = false;
            payButton.textContent = originalLabel;
          }
        }
      },
      modal: {
        ondismiss: async () => {
          await loadDashboardData();
          render();
          if (payButton) {
            payButton.disabled = false;
            payButton.textContent = originalLabel;
          }
          alert('Payment was canceled.');
        },
      },
    };

    try {
      const checkout = new window.Razorpay(options);
      checkout.open();
    } catch (error) {
      throw new Error(error?.message || 'Unable to open Razorpay checkout.');
    }
  } catch (error) {
    if (payButton) {
      payButton.disabled = false;
      payButton.textContent = originalLabel;
    }
    throw error;
  }
}

async function saveHydrogenPackBookings({ serviceName, extraSessions, slots, addOnServiceName, addOnSessionIndex }) {
  const isAdmin = state.user?.role === 'admin';
  if (isAdmin && !isAdminCustomerFormReady()) {
    alert('Enter customer name, email, and contact number first.');
    return;
  }
  const dailyLimitConflict = findHydrogenDailyLimitConflictClient(slots);
  if (dailyLimitConflict) {
    alert(
      `Only ${MAX_HYDROGEN_SESSIONS_PER_DAY_PER_USER} hydrogen sessions can be booked in one day. Check ${dailyLimitConflict.bookingDate}.`
    );
    return;
  }
  if (!isAdmin && addOnServiceName) {
    const addOnSlot = slots?.[Number(addOnSessionIndex || 0)];
    const cooldownConflict = findIvCooldownConflictClient(addOnServiceName, addOnSlot?.bookingDate || '');
    if (cooldownConflict) {
      alert(getIvCooldownAlertMessage(cooldownConflict));
      return;
    }
  }

  const result = await api(isAdmin ? '/api/admin/hydrogen/book-pack' : '/api/hydrogen/book-pack', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...(isAdmin
        ? {
            customerName: state.adminCustomerForm.name,
            customerEmail: state.adminCustomerForm.email,
            customerPhone: state.adminCustomerForm.phone,
          }
        : {}),
      serviceName,
      extraSessions,
      slots,
      addOnServiceName,
      addOnSessionIndex,
    }),
  });

  const summary = result.summary || {};
  const addOn = summary.addOn || null;
  const lines = [
    `Service: ${serviceName}`,
    `Hydrogen Amount: Rs. ${Number(summary.packagePriceInr || 0).toLocaleString('en-IN')}`,
    `Extra Sessions: ${Number(summary.extraSessions || 0)} x Rs. ${Number(summary.extraSessionPriceInr || 0).toLocaleString('en-IN')}`,
    addOn ? `IV Add-on: ${addOn.serviceName} - Rs. ${Number(addOn.amountInr || 0).toLocaleString('en-IN')}` : 'IV Add-on: None',
    `Total Session Payment: Rs. ${Number(summary.totalAmountInr || 0).toLocaleString('en-IN')}`,
    '',
    isAdmin ? 'Saved to All User Bookings.' : 'Saved to My Bookings.',
    isAdmin ? 'Payment can be managed later from the bookings list.' : 'Use Pay Now there when you are ready to complete the payment.',
  ];

  state.selectedHydrogenSlots = [];
  state.selectedHydrogenExtraSessions = 0;
  state.selectedHydrogenAddOnServiceName = '';
  state.selectedHydrogenAddOnSessionIndex = 0;
  state.activeHydrogenSessionIndex = 0;
  state.activeHydrogenSessionDate = '';
  state.activeHydrogenSessionTime = '';
  state.selectedServiceCategory = null;
  state.selectedHydrogenServiceName = '';
  await loadDashboardData();
  render();
  if (isAdmin && result.paymentLinkUrl) {
    copyTextToClipboard(result.paymentLinkUrl);
    lines.push('', `Payment Link: ${result.paymentLinkUrl}`, 'Payment link copied.');
  }
  alert(`${isAdmin ? 'Booking Saved' : 'Booking Saved'}\n\n${lines.join('\n')}`);
}

async function updateHydrogenPackBookings({ bookingGroupId, serviceName, extraSessions, slots, addOnServiceName, addOnSessionIndex }) {
  const dailyLimitConflict = findHydrogenDailyLimitConflictClient(slots, bookingGroupId);
  if (dailyLimitConflict) {
    alert(
      `Only ${MAX_HYDROGEN_SESSIONS_PER_DAY_PER_USER} hydrogen sessions can be booked in one day. Check ${dailyLimitConflict.bookingDate}.`
    );
    return;
  }
  if (addOnServiceName) {
    const addOnSlot = slots?.[Number(addOnSessionIndex || 0)];
    const cooldownConflict = findIvCooldownConflictClient(addOnServiceName, addOnSlot?.bookingDate || '', '', bookingGroupId);
    if (cooldownConflict) {
      alert(getIvCooldownAlertMessage(cooldownConflict));
      return;
    }
  }

  const result = await api(`/api/hydrogen/packages/${encodeURIComponent(bookingGroupId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      serviceName,
      extraSessions,
      slots,
      addOnServiceName,
      addOnSessionIndex,
    }),
  });

  const summary = result.summary || {};
  const addOn = summary.addOn || null;
  const lines = [
    `Service: ${serviceName}`,
    `Hydrogen Amount: Rs. ${Number(summary.packagePriceInr || 0).toLocaleString('en-IN')}`,
    `Extra Sessions: ${Number(summary.extraSessions || 0)} x Rs. ${Number(summary.extraSessionPriceInr || 0).toLocaleString('en-IN')}`,
    addOn ? `IV Add-on: ${addOn.serviceName} - Rs. ${Number(addOn.amountInr || 0).toLocaleString('en-IN')}` : 'IV Add-on: None',
    `Total Session Payment: Rs. ${Number(summary.totalAmountInr || 0).toLocaleString('en-IN')}`,
  ];

  resetHydrogenComposer();
  await loadDashboardData();
  if (state.user?.role !== 'admin') {
    state.activeUserTab = 'bookings';
  }
  render();
  if (state.user?.role !== 'admin') {
    requestAnimationFrame(() => {
      elements.userBookingsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
  alert(`Booking Updated\n\n${lines.join('\n')}`);
}

async function deleteBooking(booking) {
  const ok = confirm(
    booking.bookingGroupId
      ? `Delete the full hydrogen booking package for ${booking.serviceName}?`
      : `Delete booking for ${booking.serviceName}?`
  );
  if (!ok) return;

  await api(`/api/bookings/${booking.id}`, { method: 'DELETE' });
  await loadDashboardData();
  if (state.selectedServiceCategory) {
    await loadServiceAvailability();
  }
  if (booking.bookingGroupId && booking.bookingGroupId === state.hydrogenEditingGroupId) {
    resetHydrogenComposer();
  }
  render();
}

function openBookingNotesDialog(bookingId) {
  if (!elements.bookingNotesDialog || !elements.bookingNotesBookingId) return;
  elements.bookingNotesBookingId.value = String(bookingId || '');
  if (elements.bookingNotesInput) elements.bookingNotesInput.value = '';
  if (elements.bookingNotesDialog.open) {
    elements.bookingNotesDialog.close();
  }
  elements.bookingNotesDialog.showModal();
  fetchBookingNotes(bookingId);
}

function closeBookingNotesDialog() {
  if (!elements.bookingNotesDialog) return;
  elements.bookingNotesDialog.close();
}

function getBookingNotes(bookingId) {
  const key = String(bookingId || '');
  const notes = state.adminBookingNotesByBooking?.[key];
  return Array.isArray(notes) ? notes : [];
}

async function fetchBookingNotes(bookingId) {
  if (!bookingId) return;
  state.adminBookingNotesLoading = true;
  renderBookingNotes();
  try {
    const result = await api(`/api/bookings/${encodeURIComponent(bookingId)}/notes`);
    const notes = Array.isArray(result?.notes) ? result.notes : [];
    state.adminBookingNotesByBooking = {
      ...(state.adminBookingNotesByBooking || {}),
      [String(bookingId)]: notes,
    };
    if (!Array.isArray(result?.notes)) {
      alert('Notes are unavailable. Please confirm the server is updated.');
    }
  } catch (error) {
    alert(error.message || 'Unable to load booking notes.');
  } finally {
    state.adminBookingNotesLoading = false;
    renderBookingNotes();
  }
}

async function addBookingNote() {
  const bookingId = Number(elements.bookingNotesBookingId?.value || 0);
  if (!bookingId) {
    alert('Select a booking first.');
    return;
  }
  const noteText = String(elements.bookingNotesInput?.value || '').trim();
  if (!noteText) {
    alert('Enter a note before saving.');
    return;
  }
  try {
    const result = await api('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, noteText }),
    });
    const note = result?.note;
    if (!note?.id) {
      alert('Unable to save this note right now.');
      return;
    }
    state.adminBookingNotesByBooking = {
      ...(state.adminBookingNotesByBooking || {}),
      [String(bookingId)]: [note, ...getBookingNotes(bookingId)],
    };
    if (elements.bookingNotesInput) elements.bookingNotesInput.value = '';
    renderBookingNotes();
  } catch (error) {
    alert(error.message || 'Unable to save this note right now.');
  }
}

async function updateBookingNote(noteId) {
  const edit = state.adminBookingNoteEdits?.[noteId];
  const nextText = String(edit?.text || '').trim();
  if (!nextText) {
    alert('Note text cannot be empty.');
    return;
  }
  try {
    const result = await api(`/api/notes/${encodeURIComponent(noteId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteText: nextText }),
    });
    const updated = result?.note;
    if (!updated?.id) {
      alert('Unable to update this note right now.');
      return;
    }
    const bookingId = String(updated.bookingId || elements.bookingNotesBookingId?.value || '');
    const notes = getBookingNotes(bookingId).map((note) =>
      String(note.id) === String(updated.id) ? updated : note
    );
    state.adminBookingNotesByBooking = {
      ...(state.adminBookingNotesByBooking || {}),
      [bookingId]: notes,
    };
    if (state.adminBookingNoteEdits) {
      delete state.adminBookingNoteEdits[noteId];
    }
    renderBookingNotes();
  } catch (error) {
    alert(error.message || 'Unable to update this note right now.');
  }
}

async function deleteBookingNote(noteId) {
  const ok = confirm('Delete this note?');
  if (!ok) return;
  try {
    await api(`/api/notes/${encodeURIComponent(noteId)}`, { method: 'DELETE' });
    const bookingId = String(elements.bookingNotesBookingId?.value || '');
    const notes = getBookingNotes(bookingId).filter((note) => String(note.id) !== String(noteId));
    state.adminBookingNotesByBooking = {
      ...(state.adminBookingNotesByBooking || {}),
      [bookingId]: notes,
    };
    if (state.adminBookingNoteEdits) {
      delete state.adminBookingNoteEdits[noteId];
    }
    renderBookingNotes();
  } catch (error) {
    alert(error.message || 'Unable to delete this note right now.');
  }
}

function renderBookingNotes() {
  if (!elements.bookingNotesList || !elements.bookingNotesEmpty) return;
  const bookingId = String(elements.bookingNotesBookingId?.value || '');
  const notes = getBookingNotes(bookingId);
  const isLoading = state.adminBookingNotesLoading;
  elements.bookingNotesList.innerHTML = '';
  elements.bookingNotesEmpty.textContent = isLoading ? 'Loading notes...' : 'No notes yet.';
  elements.bookingNotesEmpty.hidden = isLoading ? false : notes.length > 0;

  notes.forEach((note) => {
    const card = document.createElement('article');
    card.className = 'admin-note-card';
    const createdAt = note.createdAt ? new Date(note.createdAt) : null;
    const createdLabel = createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt.toLocaleString() : '-';
    const edit = state.adminBookingNoteEdits?.[note.id] || null;
    const isEditing = Boolean(edit);

    if (isEditing) {
      const meta = document.createElement('div');
      meta.className = 'admin-note-meta';
      meta.innerHTML = `<span>Created ${escapeHtml(createdLabel)}</span>`;
      const textarea = document.createElement('textarea');
      textarea.className = 'admin-note-edit';
      textarea.rows = 3;
      textarea.value = edit.text || '';
      const actions = document.createElement('div');
      actions.className = 'admin-note-actions';
      const saveBtn = document.createElement('button');
      saveBtn.className = 'btn btn-primary';
      saveBtn.type = 'button';
      saveBtn.textContent = 'Save';
      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'btn btn-secondary';
      cancelBtn.type = 'button';
      cancelBtn.textContent = 'Cancel';
      actions.append(saveBtn, cancelBtn);
      card.append(meta, textarea, actions);
      textarea.addEventListener('input', (event) => {
        state.adminBookingNoteEdits[note.id] = { text: event.target.value };
      });
      saveBtn.addEventListener('click', () => updateBookingNote(note.id));
      cancelBtn.addEventListener('click', () => {
        delete state.adminBookingNoteEdits[note.id];
        renderBookingNotes();
      });
    } else {
      card.innerHTML = `
        <div class="admin-note-meta">
          <span>Created ${escapeHtml(createdLabel)}</span>
        </div>
        <p>${escapeHtml(note.noteText || '')}</p>
        <div class="admin-note-actions">
          <button class="btn btn-secondary" type="button">Edit</button>
          <button class="btn btn-danger" type="button">Delete</button>
        </div>
      `;
      const [editBtn, deleteBtn] = card.querySelectorAll('button');
      editBtn?.addEventListener('click', () => {
        state.adminBookingNoteEdits[note.id] = { text: note.noteText || '' };
        renderBookingNotes();
      });
      deleteBtn?.addEventListener('click', () => deleteBookingNote(note.id));
    }

    elements.bookingNotesList.appendChild(card);
  });
}

async function saveSingleSessionServiceBooking(serviceName) {
  const selection = state.ivSelections?.[serviceName] || {};
  const editingBookingId = String(selection.editingBookingId || state.singleSessionEditingBookingId || '');
  const effectiveBookingDate = String(
    editingBookingId ? selection.editingDate || selection.bookingDate || '' : selection.bookingDate || ''
  ).trim();
  const effectiveBookingTime = String(
    editingBookingId ? selection.editingTime || selection.bookingTime || '' : selection.bookingTime || ''
  ).trim();
  if (!effectiveBookingDate || !effectiveBookingTime) {
    alert('Set session date and time first.');
    return;
  }
  const selectedService = getServiceCatalogEntry(serviceName);
  if (selectedService?.membershipOnly && !isCurrentUserMembershipActive()) {
    alert('✨ An exclusive benefit for our members. Activate your membership to enjoy this service at no cost.');
    return;
  }
  if (getBookingCategory(serviceName) === 'IV ADD-ON' && hasHydrogenPackageAddOnOnDateClient(effectiveBookingDate)) {
    alert(
      'A hydrogen package on this date already includes an IV add-on. Separate IV Therapy/IV Shot bookings are not allowed on the same day.'
    );
    return;
  }
  const cooldownConflict = findIvCooldownConflictClient(serviceName, effectiveBookingDate, editingBookingId);
  if (cooldownConflict) {
    alert(getIvCooldownAlertMessage(cooldownConflict));
    return;
  }

  const isAdmin = state.user?.role === 'admin';
  if (isAdmin && !isAdminCustomerFormReady()) {
    alert('Enter customer name, email, and contact number first.');
    return;
  }

  const result = await api(editingBookingId ? `/api/bookings/${encodeURIComponent(editingBookingId)}` : isAdmin ? '/api/admin/bookings' : '/api/bookings', {
    method: editingBookingId ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...(isAdmin
        ? {
            customerName: state.adminCustomerForm.name,
            customerEmail: state.adminCustomerForm.email,
            customerPhone: state.adminCustomerForm.phone,
          }
        : {}),
      serviceName,
      bookingDate: effectiveBookingDate,
      bookingTime: effectiveBookingTime,
      notes: selection.notes || '',
    }),
  });

  state.ivSelections[serviceName] = {
    editingDate: effectiveBookingDate,
    editingTime: effectiveBookingTime,
    bookingDate: '',
    bookingTime: '',
  };
  state.singleSessionEditingBookingId = '';
  await loadDashboardData();
  if (editingBookingId && !isAdmin) {
    state.activeUserTab = 'bookings';
  }
  render();
  if (editingBookingId && !isAdmin) {
    requestAnimationFrame(() => {
      elements.userBookingsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
  if (isAdmin && result.paymentLinkUrl) {
    copyTextToClipboard(result.paymentLinkUrl);
    alert(`Booking saved to All User Bookings.\n\nPayment Link: ${result.paymentLinkUrl}\n\nPayment link copied.`);
    return;
  }
  alert(editingBookingId ? 'Booking updated.' : isAdmin ? 'Booking saved to All User Bookings.' : 'Booking saved to My Bookings.');
}

function resetHydrogenComposer({ keepCategory = false } = {}) {
  state.selectedHydrogenServiceName = '';
  state.selectedHydrogenExtraSessions = 0;
  state.selectedHydrogenSlots = [];
  state.selectedHydrogenAddOnServiceName = '';
  state.selectedHydrogenAddOnSessionIndex = 0;
  state.hydrogenEditingGroupId = '';
  state.activeHydrogenSessionIndex = 0;
  state.activeHydrogenSessionDate = '';
  state.activeHydrogenSessionTime = '';
  if (!keepCategory) {
    state.selectedServiceCategory = null;
  }
}

function resetSingleSessionComposer() {
  state.selectedSingleSessionServiceName = '';
  state.singleSessionEditingBookingId = '';
  state.ivSelections = {};
}

function openSingleSessionBookingEditor(booking) {
  const category = getBookingCategory(booking?.serviceName || '');
  if (!booking || !category || category === 'HYDROGEN SESSION') {
    openDialog(booking || null);
    return;
  }

  state.activeUserTab = 'services';
  state.selectedServiceCategory = category;
  state.selectedSingleSessionServiceName = booking.serviceName;
  state.singleSessionEditingBookingId = String(booking.id);
  state.ivSelections[booking.serviceName] = {
    editingBookingId: String(booking.id),
    bookingDate: booking.bookingDate,
    bookingTime: booking.bookingTime,
    editingDate: booking.bookingDate,
    editingTime: booking.bookingTime,
    notes: booking.notes || '',
    paymentStatus: booking.paymentStatus || 'unpaid',
  };
  refreshSelectedCategoryAvailability(booking.bookingDate);
  requestAnimationFrame(() => {
    document.querySelector(`[data-service-category="${category}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function openHydrogenPackageEditor(row) {
  const hydrogenEntries = [...(row.hydrogenEntries || [])].sort((a, b) =>
    `${a.bookingDate}T${a.bookingTime}`.localeCompare(`${b.bookingDate}T${b.bookingTime}`)
  );
  if (!hydrogenEntries.length) {
    alert('Hydrogen package data is incomplete.');
    return;
  }

  const addOnEntry = (row.addOnEntries || [])[0] || null;
  const addOnSessionIndex = addOnEntry
    ? Math.max(
        0,
        hydrogenEntries.findIndex(
          (entry) => entry.bookingDate === addOnEntry.bookingDate && entry.bookingTime === addOnEntry.bookingTime
        )
      )
    : 0;

  state.activeUserTab = 'services';
  state.selectedServiceCategory = 'HYDROGEN SESSION';
  state.selectedHydrogenServiceName = row.baseServiceName || hydrogenEntries[0].serviceName;
  state.selectedHydrogenExtraSessions = Math.max(0, Number(row.extraSessions || 0));
  state.selectedHydrogenSlots = hydrogenEntries.map((entry) => ({
    bookingDate: entry.bookingDate,
    bookingTime: entry.bookingTime,
  }));
  state.selectedHydrogenAddOnServiceName = addOnEntry?.serviceName || '';
  state.selectedHydrogenAddOnSessionIndex = addOnSessionIndex;
  state.hydrogenEditingGroupId = row.bookingGroupId || '';
  state.activeHydrogenSessionIndex = 0;
  state.activeHydrogenSessionDate = hydrogenEntries[0].bookingDate || getTodayIsoDate();
  state.activeHydrogenSessionTime = hydrogenEntries[0].bookingTime || SLOT_OPTIONS[0].value;
  state.selectedServiceDate = hydrogenEntries[0].bookingDate || getTodayIsoDate();
  refreshSelectedCategoryAvailability(hydrogenEntries[0].bookingDate || getTodayIsoDate());
  requestAnimationFrame(() => {
    const target = document.querySelector('[data-hydrogen-editor="true"]') || document.querySelector('[data-service-category="HYDROGEN SESSION"]');
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function getFilteredBookings(sourceBookings = state.bookings) {
  const { search, status, date } = state.filters;
  return sourceBookings
    .filter((item) => {
      if (status !== 'all' && item.status !== status) return false;
      if (date && item.bookingDate !== date) return false;
      if (!search) return true;

      const searchable = [item.clientName, item.clientMobile, item.serviceName]
        .join(' ')
        .toLowerCase();

      return searchable.includes(search);
    })
    .sort((a, b) => `${a.bookingDate}T${a.bookingTime}`.localeCompare(`${b.bookingDate}T${b.bookingTime}`));
}

function getFilteredAdminUsers() {
  const users = Array.isArray(state.adminUsers) ? state.adminUsers : [];
  const query = String(state.adminSessionSearch || '').trim().toLowerCase();
  if (!query) return users;
  return users.filter((user) => {
    const haystack = [user?.id, user?.name, user?.email, user?.mobile].join(' ').toLowerCase();
    return haystack.includes(query);
  });
}

function getFilteredAdminMembershipOrders() {
  const orders = Array.isArray(state.adminMembershipOrders) ? state.adminMembershipOrders : [];
  const query = String(state.adminMembershipSearch || '').trim().toLowerCase();
  const paidOrders = orders.filter((order) => String(order?.status || '').trim().toLowerCase() === 'paid');
  
  // Keep only the latest order per user
  const userLatestOrders = new Map();
  for (const order of paidOrders) {
    const userId = String(order?.userId || '');
    if (!userId) continue;
    
    const existing = userLatestOrders.get(userId);
    if (!existing) {
      userLatestOrders.set(userId, order);
    } else {
      const existingDate = new Date(existing.paidAt || existing.createdAt || 0).getTime();
      const currentDate = new Date(order.paidAt || order.createdAt || 0).getTime();
      if (currentDate > existingDate) {
        userLatestOrders.set(userId, order);
      }
    }
  }
  
  const deduplicatedOrders = Array.from(userLatestOrders.values());
  
  if (!query) return deduplicatedOrders;
  return deduplicatedOrders.filter((order) => {
    const haystack = [order?.userId, order?.userName, order?.userEmail, order?.userMobile, order?.planId].join(' ').toLowerCase();
    return haystack.includes(query);
  });
}

function getTodayAdminBookings(bookings = state.bookings) {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayKey = `${yyyy}-${mm}-${dd}`;
  return (Array.isArray(bookings) ? bookings : []).filter((booking) => String(booking?.bookingDate || '') === todayKey);
}

function render() {
  const isAuthenticated = Boolean(state.user);
  document.body.classList.toggle('auth-mode', !isAuthenticated);
  elements.authCard.hidden = isAuthenticated;
  elements.appArea.hidden = !isAuthenticated;

  document.querySelectorAll('.app-only').forEach((el) => {
    el.hidden = !isAuthenticated;
  });

  if (!isAuthenticated) {
    document.querySelectorAll('.app-only, .user-only, .admin-only').forEach((el) => {
      el.hidden = true;
    });
    elements.bookingTableBody.innerHTML = '';
    elements.adminBookingTableBody.innerHTML = '';
    if (elements.adminMembershipOrdersList) elements.adminMembershipOrdersList.innerHTML = '';
    return;
  }

  const isAdmin = state.user.role === 'admin';
  const needsPostLoginChoice = state.user.role === 'user' && !state.postLoginChoice;
  document.querySelectorAll('.user-only').forEach((el) => {
    el.hidden = isAdmin;
  });
  document.querySelectorAll('.admin-only').forEach((el) => {
    el.hidden = !isAdmin;
  });

  if (elements.memberChoiceGate) {
    elements.memberChoiceGate.hidden = !needsPostLoginChoice;
  }
  if (elements.userTabNav) {
    elements.userTabNav.hidden = isAdmin || needsPostLoginChoice;
  }

  if (needsPostLoginChoice) {
    document.querySelectorAll('.app-only').forEach((el) => {
      if (el !== elements.memberChoiceGate) {
        el.hidden = true;
      }
    });
  }

  elements.userName.textContent = state.user.name;
  elements.userRole.textContent = state.user.role;
  renderProfileAvatar();
  renderProfileMembershipBadge();
  renderServicePanelContext();

  if (needsPostLoginChoice) {
    return;
  }

  if (!isAdmin) {
    const activeTab = state.activeUserTab || 'services';
    if (elements.userTabServices) elements.userTabServices.classList.toggle('is-active', activeTab === 'services');
    if (elements.userTabMembership) elements.userTabMembership.classList.toggle('is-active', activeTab === 'membership');
    if (elements.userTabBookings) elements.userTabBookings.classList.toggle('is-active', activeTab === 'bookings');
    if (elements.membershipSection) elements.membershipSection.hidden = activeTab !== 'membership';
    if (elements.servicesSection) elements.servicesSection.hidden = activeTab !== 'services';
    if (elements.userBookingsSection) elements.userBookingsSection.hidden = activeTab !== 'bookings';
  } else {
    if (elements.bookingFiltersSection) elements.bookingFiltersSection.hidden = false;
  }

  const filtered = getFilteredBookings(state.bookings);
  renderStats(state.bookings);
  renderMembership();
  renderServices();
  renderMembershipCouponPreview();
  renderMembershipCheckoutSummary();
  renderCartCouponPreview();

  if (isAdmin) {
    const todayBookings = getTodayAdminBookings(state.bookings);
    renderAdminUserCards();
    
    // Determine what to show in the table
    let adminFiltered;
    let tableTitle = "Today's Bookings";
    if (state.adminHistoryVisible) {
      // Show ALL bookings when history is open
      adminFiltered = state.bookings;
      tableTitle = "History of All Bookings";
    } else {
      // Show today's bookings
      adminFiltered = todayBookings;
    }
    
    // Update title and button visibility
    if (elements.adminTableTitle) {
      elements.adminTableTitle.textContent = tableTitle;
    }
    if (elements.adminHistoryToggleBtnWrap) {
      elements.adminHistoryToggleBtnWrap.hidden = !state.adminHistoryVisible;
    }
    
    renderAdminRows(adminFiltered);
    renderAdminUserSessionDialog();
    renderAdminMembershipOrders();
    renderAdminDiscountPhones();
    renderAdminDiscountUsers();
    renderAdminCoupons();
  } else {
    renderUserRows(filtered);
  }
}

function renderServicePanelContext() {
  if (elements.servicePanelLead) {
    if (state.user?.role === 'admin') {
      elements.servicePanelLead.textContent =
        'Enter customer details, then choose the service and slot. After booking, share the generated payment link.';
      elements.servicePanelLead.hidden = false;
    } else {
      elements.servicePanelLead.textContent = '';
      elements.servicePanelLead.hidden = true;
    }
  }

  if (elements.servicePageNote) {
    elements.servicePageNote.hidden = state.user?.role === 'admin';
  }

  if (elements.adminCustomerName) elements.adminCustomerName.value = state.adminCustomerForm.name || '';
  if (elements.adminCustomerEmail) elements.adminCustomerEmail.value = state.adminCustomerForm.email || '';
  if (elements.adminCustomerPhone) elements.adminCustomerPhone.value = state.adminCustomerForm.phone || '';

  if (elements.adminClientMeta) {
    const resolvedCustomer = state.adminResolvedCustomer;
    if (state.user?.role !== 'admin' || !isAdminCustomerFormReady()) {
      elements.adminClientMeta.hidden = true;
      elements.adminClientMeta.innerHTML = '';
      if (state.user?.role === 'admin' && !elements.adminCustomerMessage?.textContent) {
        setAdminCustomerMessage('Enter customer name, email, and contact number to load services.');
      }
      return;
    }

    const membershipStatus = String(resolvedCustomer?.membershipStatus || 'inactive');
    const membershipSummary =
      membershipStatus === 'active'
        ? `Active${resolvedCustomer?.membershipPeopleCount ? ` • ${resolvedCustomer.membershipPeopleCount} member${resolvedCustomer.membershipPeopleCount > 1 ? 's' : ''}` : ''}`
        : 'Inactive';
    const activeDiscount = Number(resolvedCustomer?.discountPercent || 0);
    elements.adminClientMeta.hidden = false;
    elements.adminClientMeta.innerHTML = `
      <div class="admin-client-chip">
        <strong>Customer</strong>
        <span>${escapeHtml(state.adminCustomerForm.name || '-')}</span>
      </div>
      <div class="admin-client-chip">
        <strong>Contact</strong>
        <span>${escapeHtml(state.adminCustomerForm.phone || state.adminCustomerForm.email || '-')}</span>
      </div>
      <div class="admin-client-chip">
        <strong>Membership</strong>
        <span>${escapeHtml(membershipSummary)}</span>
      </div>
      <div class="admin-client-chip">
        <strong>Valid Till</strong>
        <span>${resolvedCustomer?.membershipExpiresAt ? escapeHtml(new Date(resolvedCustomer.membershipExpiresAt).toLocaleDateString()) : '-'}</span>
      </div>
      <div class="admin-client-chip">
        <strong>Discount</strong>
        <span>${activeDiscount > 0 ? `${activeDiscount}%` : '-'}</span>
      </div>
    `;
  }
}

function isCurrentUserMembershipActive() {
  if (state.user?.role !== 'user') return false;
  if (state.membership?.active) return true;
  const membershipStatus = String(state.user?.membershipStatus || '').trim().toLowerCase();
  if (membershipStatus !== 'active') return false;
  const startedAt = state.user?.membershipStartedAt ? new Date(state.user.membershipStartedAt).getTime() : NaN;
  const storedExpiresAt = state.user?.membershipExpiresAt ? new Date(state.user.membershipExpiresAt).getTime() : NaN;
  const expiresAt = Number.isFinite(startedAt)
    ? startedAt + 365 * 24 * 60 * 60 * 1000
    : storedExpiresAt;
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

function getEffectiveMembershipExpiryDate(startedAtValue, expiresAtValue) {
  const startedAt = startedAtValue ? new Date(startedAtValue).getTime() : NaN;
  if (Number.isFinite(startedAt)) {
    return new Date(startedAt + 365 * 24 * 60 * 60 * 1000);
  }
  const expiresAt = expiresAtValue ? new Date(expiresAtValue) : null;
  return expiresAt && !Number.isNaN(expiresAt.getTime()) ? expiresAt : null;
}

function renderProfileMembershipBadge() {
  if (!elements.userMembershipBadge) return;
  const isActiveMember = isCurrentUserMembershipActive();
  const isVisible = state.user?.role === 'user' && isActiveMember;
  elements.userMembershipBadge.hidden = !isVisible;
  if (!isVisible) {
    elements.userMembershipBadge.removeAttribute('title');
    return;
  }
  const expiresAt = getEffectiveMembershipExpiryDate(state.user?.membershipStartedAt, state.user?.membershipExpiresAt);
  elements.userMembershipBadge.textContent = '★ Member';
  elements.userMembershipBadge.title =
    expiresAt && !Number.isNaN(expiresAt.getTime()) ? `Membership active until ${expiresAt.toLocaleDateString()}` : 'Membership active';
}

function renderServices() {
  if (!elements.serviceGrid) return;

  const experienceCard = document.getElementById('experienceCard');
  if (experienceCard) {
    const isMember = isCurrentUserMembershipActive();
    experienceCard.hidden = isMember;
  }

  elements.serviceGrid.innerHTML = '';
  if (!state.services.length) {
    elements.serviceEmpty.hidden = false;
    elements.serviceEmpty.textContent =
      state.user?.role === 'admin' ? 'No services available for this customer.' : 'No services configured.';
    return;
  }

  elements.serviceEmpty.hidden = true;
  const orderedCategories = ['HYDROGEN SESSION', 'IV THERAPIES', 'IV SHOTS'];
  const grouped = new Map();
  
  for (const category of orderedCategories) grouped.set(category, []);
  for (const service of state.services) {
    const category = String(service.category || '').toUpperCase();
    if (grouped.has(category)) grouped.get(category).push(service);
  }

  // Initialize state for tracking expanded categories
  if (!state.expandedServiceCategories) {
    state.expandedServiceCategories = {};
  }

  // Display all service categories as collapsible cards
  for (const category of orderedCategories) {
    const services = grouped.get(category) || [];
    if (!services.length) continue;

    const categoryCard = document.createElement('div');
    categoryCard.className = 'service-category-card';
    categoryCard.dataset.category = category;

    const header = document.createElement('button');
    header.type = 'button';
    header.className = 'service-category-header';
    const isExpanded = state.expandedServiceCategories[category];
    header.innerHTML = `
      <div class="category-info">
        <h3 class="category-name">${escapeHtml(category)}</h3>
        <span class="category-count">${services.length} service${services.length === 1 ? '' : 's'}</span>
      </div>
      <span class="expand-icon" aria-label="${isExpanded ? 'collapse' : 'expand'}">${isExpanded ? '−' : '+'}</span>
    `;

    header.addEventListener('click', () => {
      state.expandedServiceCategories[category] = !state.expandedServiceCategories[category];
      renderServices();
    });

    categoryCard.appendChild(header);

    // Render service details if category is expanded
    if (isExpanded) {
      const detailsContainer = document.createElement('div');
      detailsContainer.className = 'service-category-details';

      for (const service of services) {
        const serviceCard = createServiceDetailItem(service);
        detailsContainer.appendChild(serviceCard);
      }

      categoryCard.appendChild(detailsContainer);
    }

    elements.serviceGrid.appendChild(categoryCard);
  }
}

function createServiceDetailItem(service) {
  const card = document.createElement('article');
  card.className = 'service-detail-item';

  const effectivePrice = Number(service.effectivePriceInr ?? service.priceInr ?? 0);
  const hasMemberAccess = isCurrentUserMembershipActive();
  const isMembershipOnly = Boolean(service.membershipOnly);

  const infoSection = document.createElement('div');
  infoSection.className = 'service-item-info';
  infoSection.innerHTML = `
    <h4>${escapeHtml(service.name)}</h4>
    ${service.description ? `<p class="service-description">${escapeHtml(service.description)}</p>` : ''}
  `;

  const priceSection = document.createElement('div');
  priceSection.className = 'service-item-pricing';
  
  const priceDisplay = document.createElement('span');
  priceDisplay.className = 'service-price';
  if (isMembershipOnly && !hasMemberAccess) {
    priceDisplay.textContent = 'Members Only';
  } else if (isMembershipOnly && hasMemberAccess) {
    priceDisplay.textContent = 'Included';
  } else {
    priceDisplay.textContent = `₹${effectivePrice.toLocaleString('en-IN')}`;
  }
  priceSection.appendChild(priceDisplay);

  // Show session count for multi-session services
  const sessionCount = getHydrogenSessionCountFromServiceName(service.name);
  if (sessionCount > 1) {
    const sessionBadge = document.createElement('span');
    sessionBadge.className = 'service-sessions';
    sessionBadge.textContent = `${sessionCount}×`;
    priceSection.appendChild(sessionBadge);
  }

  const buttonSection = document.createElement('div');
  buttonSection.className = 'service-item-actions';
  
  const bookButton = document.createElement('button');
  bookButton.type = 'button';
  bookButton.className = 'service-book-btn btn btn-primary';
  bookButton.textContent = 'Book';
  bookButton.disabled = isMembershipOnly && !hasMemberAccess;
  bookButton.addEventListener('click', () => {
    openDialog();
    elements.serviceName.value = service.name;
    elements.bookingDate.value = getTodayIsoDate();
    elements.bookingTime.value = SLOT_OPTIONS[0].value;
  });
  buttonSection.appendChild(bookButton);

  card.appendChild(infoSection);
  card.appendChild(priceSection);
  card.appendChild(buttonSection);

  return card;
}

function getHydrogenSessionCountFromServiceName(serviceName) {
  const raw = String(serviceName || '').trim();
  const normalized = raw.toLowerCase();
  if (normalized.includes('single')) return 1;

  // Prefer explicit session count mentions like "(4 Sessions)".
  let match = raw.match(/\((\d+)\s*session/i);
  if (match) return Number(match[1]);

  match = raw.match(/\b(\d+)\s*session/i);
  if (match) return Number(match[1]);

  // Fallback: ignore "H2" prefix and use first standalone number.
  const cleaned = normalized.replace(/\bh2\b/g, ' ');
  match = cleaned.match(/\b(\d+)\b/);
  return match ? Number(match[1]) : 1;
}

function getHydrogenPlanOptions(services) {
  section.innerHTML = `
    <header class="service-cluster-head">
      <div>
        <h3 class="service-section-title">${escapeHtml(selectedCategory)}</h3>
        <p class="service-section-copy">${selectedServices.length} option${selectedServices.length === 1 ? '' : 's'}</p>
      </div>
    </header>
  `;
  if (isMembershipServicesCategory && !isCurrentUserMembershipActive()) {
    const copy = section.querySelector('.service-section-copy');
    if (copy) {
      copy.textContent = 'Visible to all users. These services are free only if you joined as a member.';
    }
  }

  const backButton = document.createElement('button');
  backButton.type = 'button';
  backButton.className = 'btn btn-secondary service-back-btn';
  backButton.textContent = 'Back to categories';
  backButton.addEventListener('click', () => {
    state.selectedServiceCategory = null;
    state.adminServiceDetailsExpanded = {};
    resetHydrogenComposer();
    resetSingleSessionComposer();
    state.slotAvailability = {};
    state.slotCapacityByService = {};
    state.slotAvailabilityLoading = false;
    renderServices();
  });
  section.querySelector('.service-cluster-head').appendChild(backButton);

  if (!isHydrogenCategory) {
    resetHydrogenComposer({ keepCategory: true });
  }

  if (isHydrogenCategory) {
    const isEditingHydrogenGroup = Boolean(state.hydrogenEditingGroupId);
    const planOptions = getHydrogenPlanOptions(selectedServices);
    if (!planOptions.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'Hydrogen session plans are not configured.';
      section.appendChild(empty);
      elements.serviceGrid.appendChild(section);
      return;
    }

    if (!state.selectedHydrogenServiceName || !planOptions.some((opt) => opt.service.name === state.selectedHydrogenServiceName)) {
      state.selectedHydrogenServiceName = planOptions[0].service.name;
    }

    const selectedPlan = planOptions.find((opt) => opt.service.name === state.selectedHydrogenServiceName) || planOptions[0];
    const packageSessions = Number(selectedPlan.sessions || 1);
    const extraSessions = Math.max(0, Number(state.selectedHydrogenExtraSessions || 0));
    const requiredSlots = packageSessions + extraSessions;
    if (state.selectedHydrogenSlots.length > requiredSlots) {
      state.selectedHydrogenSlots = state.selectedHydrogenSlots.slice(0, requiredSlots);
    }

    const selectedService = selectedPlan.service;
    const memberPrice = Number(selectedService.memberPriceInr || 0);
    const nonMemberPrice = Number(selectedService.nonMemberPriceInr || 0);
    const singleSession = selectedServices.find((service) => getHydrogenSessionCountFromServiceName(service.name) === 1) || selectedService;
    const extraSessionPrice = Number(singleSession.effectivePriceInr || singleSession.memberPriceInr || singleSession.nonMemberPriceInr || 0);
    const addOnServices = state.services.filter((service) => {
      const category = String(service.category || '').toUpperCase();
      return category === 'IV THERAPIES' || category === 'IV SHOTS';
    });
    if (!addOnServices.some((service) => service.name === state.selectedHydrogenAddOnServiceName)) {
      state.selectedHydrogenAddOnServiceName = '';
    }
    if (!Number.isInteger(state.selectedHydrogenAddOnSessionIndex) || state.selectedHydrogenAddOnSessionIndex < 0) {
      state.selectedHydrogenAddOnSessionIndex = 0;
    }
    if (state.selectedHydrogenAddOnSessionIndex >= requiredSlots) {
      state.selectedHydrogenAddOnSessionIndex = 0;
    }
    const selectedAddOnService = addOnServices.find((service) => service.name === state.selectedHydrogenAddOnServiceName) || null;
    const selectedAddOnPriceInr = Number(selectedAddOnService?.effectivePriceInr || selectedAddOnService?.priceInr || 0);
    const consolidatedAmount = Number(selectedService.effectivePriceInr || 0) + extraSessions * extraSessionPrice + selectedAddOnPriceInr;

    const layout = document.createElement('div');
    layout.className = 'hydrogen-layout';
    layout.dataset.hydrogenEditor = 'true';

    const sidebar = document.createElement('aside');
    sidebar.className = 'hydrogen-sidebar';
    const consultationBenefit = isCurrentUserMembershipActive()
      ? '<div class="hydrogen-benefit-tag">Free Consultation Session</div>'
      : '';
    sidebar.innerHTML = `
      <h4 class="hydrogen-sidebar-title">Hydrogen Therapy</h4>
      ${consultationBenefit}
      <div class="hydrogen-plan-controls">
        <label>
          Session Package
          <select class="hydrogen-plan-select"></select>
        </label>
        <label>
          Add Extra Sessions
          <input class="hydrogen-extra-input" type="number" min="0" step="1" value="${extraSessions}" />
        </label>
      </div>
    `;
    const planSelect = sidebar.querySelector('.hydrogen-plan-select');
    for (const opt of planOptions) {
      const option = document.createElement('option');
      option.value = opt.service.name;
      option.textContent = `${opt.sessions} Sessions`;
      planSelect.appendChild(option);
    }
    planSelect.value = state.selectedHydrogenServiceName;
    planSelect.disabled = isEditingHydrogenGroup;
    planSelect.addEventListener('change', () => {
      state.selectedHydrogenServiceName = planSelect.value;
      state.selectedHydrogenSlots = [];
      state.activeHydrogenSessionIndex = 0;
      state.activeHydrogenSessionDate = '';
      state.activeHydrogenSessionTime = '';
      renderServices();
    });
    const extraInput = sidebar.querySelector('.hydrogen-extra-input');
    extraInput.disabled = isEditingHydrogenGroup;
    extraInput.addEventListener('input', () => {
      const parsed = Math.max(0, Number(extraInput.value || 0));
      state.selectedHydrogenExtraSessions = Number.isFinite(parsed) ? Math.floor(parsed) : 0;
      state.selectedHydrogenSlots = [];
      state.selectedHydrogenAddOnSessionIndex = 0;
      state.activeHydrogenSessionIndex = 0;
      state.activeHydrogenSessionDate = '';
      state.activeHydrogenSessionTime = '';
      renderServices();
    });
    const addOnSelect = document.createElement('select');
    addOnSelect.className = 'hydrogen-addon-select';
    const noAddOnOption = document.createElement('option');
    noAddOnOption.value = '';
    noAddOnOption.textContent = 'No add-on';
    addOnSelect.appendChild(noAddOnOption);
    for (const addOn of addOnServices) {
      const option = document.createElement('option');
      option.value = addOn.name;
      option.textContent = `${addOn.name} - Rs. ${Number(addOn.effectivePriceInr || addOn.priceInr || 0).toLocaleString('en-IN')}`;
      addOnSelect.appendChild(option);
    }
    addOnSelect.value = state.selectedHydrogenAddOnServiceName;
    addOnSelect.addEventListener('change', () => {
      state.selectedHydrogenAddOnServiceName = addOnSelect.value;
      renderServices();
    });
    const addOnSessionSelect = document.createElement('select');
    addOnSessionSelect.className = 'hydrogen-addon-session-select';
    for (let idx = 0; idx < requiredSlots; idx += 1) {
      const option = document.createElement('option');
      option.value = String(idx);
      option.textContent = `Session ${idx + 1}`;
      addOnSessionSelect.appendChild(option);
    }
    addOnSessionSelect.value = String(state.selectedHydrogenAddOnSessionIndex || 0);
    addOnSessionSelect.disabled = !state.selectedHydrogenAddOnServiceName;
    addOnSessionSelect.addEventListener('change', () => {
      state.selectedHydrogenAddOnSessionIndex = Math.max(0, Number(addOnSessionSelect.value || 0));
    });

    const sessionsList = document.createElement('div');
    sessionsList.className = 'hydrogen-session-list';
    if (state.activeHydrogenSessionIndex >= requiredSlots) {
      state.activeHydrogenSessionIndex = 0;
    }
    for (let idx = 0; idx < requiredSlots; idx += 1) {
      const sessionBtn = document.createElement('button');
      sessionBtn.type = 'button';
      const assigned = Boolean(state.selectedHydrogenSlots[idx]);
      sessionBtn.className = `hydrogen-session-item${idx === state.activeHydrogenSessionIndex ? ' is-active' : ''}${
        assigned ? ' is-assigned' : ''
      }`;
      sessionBtn.textContent = `Session ${idx + 1}${assigned ? ' ✓' : ''}`;
      sessionBtn.addEventListener('click', () => {
        state.activeHydrogenSessionIndex = idx;
        state.activeHydrogenSessionDate = state.selectedHydrogenSlots[idx]?.bookingDate || getTodayIsoDate();
        state.activeHydrogenSessionTime = state.selectedHydrogenSlots[idx]?.bookingTime || SLOT_OPTIONS[0].value;
        refreshSelectedCategoryAvailability(state.activeHydrogenSessionDate);
      });
      sessionsList.appendChild(sessionBtn);
    }
    sidebar.appendChild(sessionsList);
    layout.appendChild(sidebar);

    const main = document.createElement('div');
    main.className = 'hydrogen-main';
    const assignedCount = state.selectedHydrogenSlots.slice(0, requiredSlots).filter(Boolean).length;
    const activeSlot = state.selectedHydrogenSlots[state.activeHydrogenSessionIndex] || null;
    const editorDate = state.activeHydrogenSessionDate || activeSlot?.bookingDate || getTodayIsoDate();
    const editorTime = state.activeHydrogenSessionTime || activeSlot?.bookingTime || SLOT_OPTIONS[0].value;
    state.activeHydrogenSessionDate = editorDate;
    state.activeHydrogenSessionTime = editorTime;
    if (state.selectedServiceDate !== editorDate) {
      state.selectedServiceDate = editorDate;
    }

    const card = document.createElement('article');
    card.className = 'doctor-card service-card';
    card.innerHTML = `
      <div class="service-card-head">
        <h3>${escapeHtml(selectedService.name)}</h3>
      </div>
    `;
    if (String(selectedService.name || '') === 'H2 Single Session' && isCurrentUserMembershipActive()) {
      const initiationBlock = document.createElement('div');
      initiationBlock.className = 'service-info-block';
      initiationBlock.innerHTML = `
        <strong>Initiation Session (1 hr)</strong>
        <span>Full doctor consultation + diagnostic &amp; genetic testing</span>
      `;
      card.appendChild(initiationBlock);
    }

    const addOnPanel = document.createElement('div');
    addOnPanel.className = 'hydrogen-addon-panel';
    addOnPanel.innerHTML = `
      <div class="hydrogen-addon-head">
        <strong>Optional IV Add-on</strong>
        <span>Choose 1 IV Therapy or IV Shot with this hydrogen booking.</span>
      </div>
      <div class="hydrogen-addon-grid">
        <label>
          Add-on Service
        </label>
        <label>
          Add-on Session
        </label>
      </div>
    `;
    const addOnGrid = addOnPanel.querySelector('.hydrogen-addon-grid');
    addOnGrid.children[0].appendChild(addOnSelect);
    addOnGrid.children[1].appendChild(addOnSessionSelect);
    const addOnNote = document.createElement('p');
    addOnNote.className = 'hydrogen-addon-note';
    addOnNote.textContent =
      'Only one add-on can be booked in a single time slot. If you would like to book more sessions, please contact or visit H2 House of Health.';
    addOnPanel.appendChild(addOnNote);
    sidebar.appendChild(addOnPanel);

    const editor = document.createElement('div');
    editor.className = 'hydrogen-session-editor';
    editor.innerHTML = `
      <h4>Session ${state.activeHydrogenSessionIndex + 1}</h4>
      <div class="hydrogen-editor-grid">
        <label>
          Date
          <input class="hydrogen-editor-date" type="date" min="${getTodayIsoDate()}" max="${getMaxBookingIsoDate()}" value="${editorDate}" />
        </label>
        <label>
          Time
          <select class="hydrogen-editor-time"></select>
        </label>
      </div>
    `;
    const timeSelect = editor.querySelector('.hydrogen-editor-time');
    populateAvailableTimeOptions(timeSelect, selectedService.name, editorDate, activeSlot, editorTime);
    state.activeHydrogenSessionTime = timeSelect.value || SLOT_OPTIONS[0].value;
    const dateInput = editor.querySelector('.hydrogen-editor-date');
    dateInput.addEventListener('change', () => {
      state.activeHydrogenSessionDate = dateInput.value || getTodayIsoDate();
      refreshSelectedCategoryAvailability(state.activeHydrogenSessionDate);
    });
    timeSelect.addEventListener('change', () => {
      state.activeHydrogenSessionTime = timeSelect.value || SLOT_OPTIONS[0].value;
    });

    const editorActions = document.createElement('div');
    editorActions.className = 'hydrogen-editor-actions';
    const saveSessionBtn = document.createElement('button');
    saveSessionBtn.type = 'button';
    saveSessionBtn.className = 'btn btn-secondary';
    saveSessionBtn.textContent = 'Set Session Date & Time';
    saveSessionBtn.addEventListener('click', () => {
      state.selectedHydrogenSlots[state.activeHydrogenSessionIndex] = {
        bookingDate: state.activeHydrogenSessionDate || getTodayIsoDate(),
        bookingTime: state.activeHydrogenSessionTime || SLOT_OPTIONS[0].value,
      };
      renderServices();
    });
    const clearSessionBtn = document.createElement('button');
    clearSessionBtn.type = 'button';
    clearSessionBtn.className = 'btn btn-secondary';
    clearSessionBtn.textContent = 'Clear Session';
    clearSessionBtn.addEventListener('click', () => {
      state.selectedHydrogenSlots[state.activeHydrogenSessionIndex] = undefined;
      renderServices();
    });
    editorActions.appendChild(saveSessionBtn);
    editorActions.appendChild(clearSessionBtn);
    editor.appendChild(editorActions);
    card.appendChild(editor);

    const selectedSummary = document.createElement('div');
    selectedSummary.className = 'hydrogen-selected-list';
    for (let idx = 0; idx < requiredSlots; idx += 1) {
      const slot = state.selectedHydrogenSlots[idx];
      const summaryItem = document.createElement('span');
      summaryItem.className = 'hydrogen-selected-item';
      summaryItem.textContent = slot ? `S${idx + 1}: ${slot.bookingDate} ${slot.bookingTime}` : `S${idx + 1}: Pending`;
      selectedSummary.appendChild(summaryItem);
    }
    if (selectedAddOnService) {
      const addOnSummary = document.createElement('span');
      addOnSummary.className = 'hydrogen-selected-item';
      addOnSummary.textContent = `IV Add-on: ${selectedAddOnService.name} (Session ${state.selectedHydrogenAddOnSessionIndex + 1})`;
      selectedSummary.appendChild(addOnSummary);
    }
    card.appendChild(selectedSummary);

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'btn btn-primary';
    saveBtn.textContent = assignedCount === requiredSlots ? (isEditingHydrogenGroup ? 'Update Package' : 'Book Now') : `Set ${requiredSlots - assignedCount} more session(s)`;
    saveBtn.disabled = assignedCount !== requiredSlots || requiredSlots <= 0;
    saveBtn.addEventListener('click', async () => {
      try {
        const submitSlots = getHydrogenSlotsForSubmit(requiredSlots);
        if (selectedAddOnService) {
          const addOnSlot = submitSlots[state.selectedHydrogenAddOnSessionIndex];
          if (addOnSlot && hasStandaloneIvOnDateClient(addOnSlot.bookingDate, state.hydrogenEditingGroupId)) {
            alert(
              'A separate IV Therapy/IV Shot is already booked on this date. Hydrogen packages with an IV add-on cannot be combined with separate IV bookings on the same day.'
            );
            return;
          }
        }
        if (isEditingHydrogenGroup) {
          await updateHydrogenPackBookings({
            bookingGroupId: state.hydrogenEditingGroupId,
            serviceName: selectedService.name,
            extraSessions,
            slots: submitSlots,
            addOnServiceName: selectedAddOnService?.name || '',
            addOnSessionIndex: selectedAddOnService ? state.selectedHydrogenAddOnSessionIndex : null,
          });
        } else {
          await saveHydrogenPackBookings({
            serviceName: selectedService.name,
            extraSessions,
            slots: submitSlots,
            addOnServiceName: selectedAddOnService?.name || '',
            addOnSessionIndex: selectedAddOnService ? state.selectedHydrogenAddOnSessionIndex : null,
          });
        }
      } catch (error) {
        alert(error.message || `Unable to ${isEditingHydrogenGroup ? 'update' : 'save'} hydrogen booking.`);
      }
    });
    if (isEditingHydrogenGroup) {
      const cancelEditBtn = document.createElement('button');
      cancelEditBtn.type = 'button';
      cancelEditBtn.className = 'btn btn-secondary';
      cancelEditBtn.textContent = 'Cancel Package Edit';
      cancelEditBtn.addEventListener('click', () => {
        resetHydrogenComposer();
        render();
      });
      card.appendChild(cancelEditBtn);
    }
    card.appendChild(saveBtn);
    main.appendChild(card);
    layout.appendChild(main);
    section.appendChild(layout);
    elements.serviceGrid.appendChild(section);
    return;
  }

  if (isSingleSessionCategory) {
    if (
      !state.selectedSingleSessionServiceName ||
      !selectedServices.some((service) => service.name === state.selectedSingleSessionServiceName)
    ) {
      state.selectedSingleSessionServiceName = selectedServices[0]?.name || '';
    }

    const selectedService =
      selectedServices.find((service) => service.name === state.selectedSingleSessionServiceName) || selectedServices[0];
    if (!selectedService) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'No services are configured in this category.';
      section.appendChild(empty);
      elements.serviceGrid.appendChild(section);
      return;
    }

    const effectivePrice = Number(selectedService.effectivePriceInr ?? selectedService.priceInr ?? 0);
    const isMembershipOnly = Boolean(selectedService.membershipOnly);
    const hasMemberAccess = isCurrentUserMembershipActive();
    const selection = state.ivSelections[selectedService.name] || {};
    const activeSingleSessionEditId = String(state.singleSessionEditingBookingId || '').trim();
    const isEditingSingleSession =
      Boolean(activeSingleSessionEditId) && String(selection.editingBookingId || '').trim() === activeSingleSessionEditId;
    const editorDate = selection.editingDate || selection.bookingDate || getTodayIsoDate();
    const editorTime = selection.editingTime || selection.bookingTime || SLOT_OPTIONS[0].value;
    if (state.selectedServiceDate !== editorDate) {
      state.selectedServiceDate = editorDate;
    }

    const layout = document.createElement('div');
    layout.className = 'hydrogen-layout';

    const sidebar = document.createElement('aside');
    sidebar.className = 'hydrogen-sidebar';
    sidebar.innerHTML = `
      <h4 class="hydrogen-sidebar-title">${escapeHtml(selectedCategory)}</h4>
      <div class="hydrogen-plan-controls">
        <label>
          Choose Service
          <select class="hydrogen-plan-select single-session-service-select"></select>
        </label>
      </div>
    `;
    const serviceSelect = sidebar.querySelector('.single-session-service-select');
    for (const service of selectedServices) {
      const option = document.createElement('option');
      option.value = service.name;
      option.textContent = service.name;
      serviceSelect.appendChild(option);
    }
    serviceSelect.value = selectedService.name;
    serviceSelect.disabled = isEditingSingleSession;
    serviceSelect.addEventListener('change', () => {
      state.selectedSingleSessionServiceName = serviceSelect.value;
      const nextSelection = state.ivSelections[serviceSelect.value] || {};
      state.singleSessionEditingBookingId = String(nextSelection.editingBookingId || '');
      state.selectedServiceDate = nextSelection.editingDate || nextSelection.bookingDate || getTodayIsoDate();
      state.slotAvailability = {};
      state.slotCapacityByService = {};
      state.slotAvailabilityLoading = true;
      render();
      loadServiceAvailability();
    });

    const sessionsList = document.createElement('div');
    sessionsList.className = 'hydrogen-session-list';
    const sessionBtn = document.createElement('button');
    sessionBtn.type = 'button';
    sessionBtn.className = `hydrogen-session-item is-active${selection.bookingDate && selection.bookingTime ? ' is-assigned' : ''}`;
    sessionBtn.textContent = `Session 1${selection.bookingDate && selection.bookingTime ? ' ✓' : ''}`;
    sessionsList.appendChild(sessionBtn);
    sidebar.appendChild(sessionsList);
    layout.appendChild(sidebar);

    const main = document.createElement('div');
    main.className = 'hydrogen-main';
    const card = document.createElement('article');
    card.className = 'doctor-card service-card';
    card.innerHTML = `
      <div class="service-card-head">
        <h3>${escapeHtml(selectedService.name)}</h3>
      </div>
      <div class="service-price-panel">
        <p class="service-price-line">
          <span class="price-label">Your Price</span>
          <strong>${isMembershipOnly ? (hasMemberAccess ? 'Included in Membership' : 'Free for Members Only') : `Rs. ${effectivePrice.toLocaleString('en-IN')}`}</strong>
        </p>
        ${isMembershipOnly && !hasMemberAccess ? '<p class="service-price-meta">Booking is only available for active members.</p>' : ''}
      </div>
    `;
    if (String(selectedService.name || '') === 'H2 Single Session') {
      const initiationBlock = document.createElement('div');
      initiationBlock.className = 'service-info-block';
      initiationBlock.innerHTML = `
        <strong>Initiation Session (1 hr)</strong>
        <span>Full doctor consultation + diagnostic &amp; genetic testing</span>
      `;
      card.appendChild(initiationBlock);
    }

    const editor = document.createElement('div');
    editor.className = 'hydrogen-session-editor';
    editor.innerHTML = `
      <h4>Session 1</h4>
      <div class="hydrogen-editor-grid">
        <label>
          Date
          <input class="hydrogen-editor-date" type="date" min="${getTodayIsoDate()}" max="${getMaxBookingIsoDate()}" value="${editorDate}" />
        </label>
        <label>
          Time
          <select class="hydrogen-editor-time"></select>
        </label>
      </div>
    `;
    const ivDateInput = editor.querySelector('.hydrogen-editor-date');
    const ivTimeSelect = editor.querySelector('.hydrogen-editor-time');
    populateAvailableTimeOptions(
      ivTimeSelect,
      selectedService.name,
      editorDate,
      {
        bookingDate: selection.bookingDate || '',
        bookingTime: selection.bookingTime || '',
      },
      editorTime
    );
    state.ivSelections[selectedService.name] = {
      ...(state.ivSelections[selectedService.name] || {}),
      editingTime: ivTimeSelect.value || editorTime || SLOT_OPTIONS[0].value,
    };
    ivDateInput.addEventListener('change', () => {
      state.ivSelections[selectedService.name] = {
        ...(state.ivSelections[selectedService.name] || {}),
        editingDate: ivDateInput.value || getTodayIsoDate(),
      };
      refreshSelectedCategoryAvailability(ivDateInput.value || getTodayIsoDate());
    });
    ivTimeSelect.addEventListener('change', () => {
      state.ivSelections[selectedService.name] = {
        ...(state.ivSelections[selectedService.name] || {}),
        editingTime: ivTimeSelect.value || SLOT_OPTIONS[0].value,
      };
    });

    const editorActions = document.createElement('div');
    editorActions.className = 'hydrogen-editor-actions';
    const setSessionBtn = document.createElement('button');
    setSessionBtn.type = 'button';
    setSessionBtn.className = 'btn btn-secondary';
    setSessionBtn.textContent = 'Set Session Date & Time';
    setSessionBtn.addEventListener('click', () => {
      state.ivSelections[selectedService.name] = {
        editingDate: ivDateInput.value || getTodayIsoDate(),
        editingTime: ivTimeSelect.value || SLOT_OPTIONS[0].value,
        bookingDate: ivDateInput.value || getTodayIsoDate(),
        bookingTime: ivTimeSelect.value || SLOT_OPTIONS[0].value,
      };
      renderServices();
    });
    const clearSessionBtn = document.createElement('button');
    clearSessionBtn.type = 'button';
    clearSessionBtn.className = 'btn btn-secondary';
    clearSessionBtn.textContent = 'Clear Session';
    clearSessionBtn.addEventListener('click', () => {
      state.ivSelections[selectedService.name] = {
        editingDate: ivDateInput.value || getTodayIsoDate(),
        editingTime: ivTimeSelect.value || SLOT_OPTIONS[0].value,
        bookingDate: '',
        bookingTime: '',
      };
      renderServices();
    });
    editorActions.appendChild(setSessionBtn);
    editorActions.appendChild(clearSessionBtn);
    editor.appendChild(editorActions);
    card.appendChild(editor);

    const selectedSummary = document.createElement('div');
    selectedSummary.className = 'hydrogen-selected-list';
    const summaryItem = document.createElement('span');
    summaryItem.className = 'hydrogen-selected-item';
    summaryItem.textContent =
      selection.bookingDate && selection.bookingTime
        ? `Session: ${formatDateTime(selection.bookingDate, selection.bookingTime)}`
        : 'Session: Pending';
    selectedSummary.appendChild(summaryItem);
    card.appendChild(selectedSummary);

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'btn btn-primary';
    saveBtn.textContent = selection.bookingDate && selection.bookingTime ? (isEditingSingleSession ? 'Update Booking' : 'Book Now') : 'Set Session Date & Time';
    saveBtn.disabled = !(selection.bookingDate && selection.bookingTime);
    saveBtn.addEventListener('click', async () => {
      try {
        await saveSingleSessionServiceBooking(selectedService.name);
      } catch (error) {
        alert(error.message || 'Unable to save booking.');
      }
    });
    card.appendChild(saveBtn);
    if (isEditingSingleSession) {
      const cancelEditBtn = document.createElement('button');
      cancelEditBtn.type = 'button';
      cancelEditBtn.className = 'btn btn-secondary';
      cancelEditBtn.textContent = 'Cancel Edit';
      cancelEditBtn.addEventListener('click', () => {
        resetSingleSessionComposer();
        render();
      });
      card.appendChild(cancelEditBtn);
    }
    main.appendChild(card);
    layout.appendChild(main);
    section.appendChild(layout);
    elements.serviceGrid.appendChild(section);
    return;
  }

  if (!isSingleSessionCategory) {
    const dateRow = document.createElement('div');
    dateRow.className = 'service-date-row';
    const dateLabel = document.createElement('label');
    dateLabel.textContent = 'Select Date';
    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.value = state.selectedServiceDate || getTodayIsoDate();
    dateInput.min = getTodayIsoDate();
    dateInput.max = getMaxBookingIsoDate();
    dateInput.className = 'service-date-input';
    dateInput.addEventListener('change', () => {
      state.selectedServiceDate = dateInput.value || getTodayIsoDate();
      state.slotAvailability = {};
      state.slotAvailabilityLoading = true;
      state.slotAutoShiftedNotice = '';
      renderServices();
      loadServiceAvailability();
    });
    dateLabel.appendChild(dateInput);
    dateRow.appendChild(dateLabel);
    section.appendChild(dateRow);
  }

  const grid = document.createElement('div');
  grid.className = 'service-card-grid';
  for (const service of selectedServices) {
    const card = document.createElement('article');
    card.className = 'doctor-card service-card';
    const effectivePrice = Number(service.effectivePriceInr ?? service.priceInr ?? 0);
    const isMembershipOnly = Boolean(service.membershipOnly);
    const hasMemberAccess = isCurrentUserMembershipActive();
    const hasDualHydrogenPrices =
      String(service.category || '').toUpperCase() === 'HYDROGEN SESSION' &&
      Number(service.memberPriceInr) > 0 &&
      Number(service.nonMemberPriceInr) > 0;
    const memberPriceText = Number(service.memberPriceInr).toLocaleString('en-IN');
    const nonMemberPriceText = Number(service.nonMemberPriceInr).toLocaleString('en-IN');

    card.innerHTML = `
      <div class="service-card-head">
        <h3>${escapeHtml(service.name)}</h3>
      </div>
      <div class="service-price-panel">
        <p class="service-price-line">
          <span class="price-label">Your Price</span>
          <strong>${isMembershipOnly ? (hasMemberAccess ? 'Included in Membership' : 'Free for Members Only') : `Rs. ${effectivePrice.toLocaleString('en-IN')}`}</strong>
        </p>
        ${
          hasDualHydrogenPrices
            ? `<p class="service-price-meta">Member: Rs. ${memberPriceText} | Non-member: Rs. ${nonMemberPriceText}</p>
               <div class="hydrogen-pricing-grid">
                 <span class="hydrogen-pricing-head">No. of Services</span>
                 <span class="hydrogen-pricing-head">Non Member</span>
                 <span class="hydrogen-pricing-head">Member</span>
                 <span>${escapeHtml(service.name)}</span>
                 <span>Rs. ${nonMemberPriceText}</span>
                 <span>Rs. ${memberPriceText}</span>
               </div>`
            : ''
        }
        ${isMembershipOnly && !hasMemberAccess ? '<p class="service-price-meta">Booking is only available for active members.</p>' : ''}
      </div>
    `;

    const slotsWrap = document.createElement('div');
    slotsWrap.className = 'service-slots-wrap';
    const slotsTitle = document.createElement('p');
    slotsTitle.className = 'service-slots-title';
    slotsTitle.textContent = state.slotAvailabilityLoading ? 'Loading slots...' : 'Available time slots';
    slotsWrap.appendChild(slotsTitle);
    if (state.slotAutoShiftedNotice) {
      const notice = document.createElement('p');
      notice.className = 'slot-auto-notice';
      notice.textContent = state.slotAutoShiftedNotice;
      slotsWrap.appendChild(notice);
    }

    const slotGrid = document.createElement('div');
    slotGrid.className = 'service-slot-grid';
    const serviceAvailability = state.slotAvailability[service.name] || {};
    const serviceHolds = state.slotHoldCounts[service.name] || {};
    for (const slot of SLOT_OPTIONS) {
      const booked = Number(serviceAvailability[slot.value] || 0);
      const holdCount = Number(serviceHolds[slot.value] || 0);
      const capacity = Number(state.slotCapacityByService[service.name] || 8);
      const isPastSlot = isBookingSlotInPast(state.selectedServiceDate, slot.value);
      const slotRow = document.createElement('div');
      slotRow.className = 'service-slot-row';
      const slotTime = document.createElement('span');
      slotTime.className = 'slot-time';
      slotTime.textContent = slot.label;
      const seatWrap = document.createElement('div');
      seatWrap.className = 'slot-seat-grid';
      for (let seatIndex = 0; seatIndex < capacity; seatIndex += 1) {
        const seatBooked = seatIndex < booked;
        const seatHold = !seatBooked && seatIndex < booked + holdCount;
        const seatBtn = document.createElement('button');
        seatBtn.type = 'button';
        seatBtn.className = `slot-seat-box${seatBooked ? ' is-booked' : seatHold ? ' is-hold' : ' is-available'}`;
        seatBtn.disabled = seatBooked || seatHold || isPastSlot || state.slotAvailabilityLoading;
        const holdMinutes = Number(state.bookingHoldMinutes || BOOKING_HOLD_MINUTES) || BOOKING_HOLD_MINUTES;
        seatBtn.title = seatBooked
          ? 'Booked'
          : seatHold
            ? `On hold (${holdMinutes} min)`
            : isPastSlot
              ? 'Unavailable'
              : `Book ${slot.label}`;
        seatBtn.setAttribute(
          'aria-label',
          `${slot.label} seat ${seatIndex + 1} ${
            seatBooked ? 'booked' : seatHold ? 'on hold' : isPastSlot ? 'unavailable' : 'available'
          }`
        );
        seatBtn.addEventListener('click', () => {
          openDialog();
          elements.serviceName.value = service.name;
          if (state.selectedServiceDate) {
            elements.bookingDate.value = state.selectedServiceDate;
          }
          elements.bookingTime.value = slot.value;
        });
        seatWrap.appendChild(seatBtn);
      }
      const slotMetaWrap = document.createElement('div');
      slotMetaWrap.className = 'slot-meta-wrap';
      const slotMeta = document.createElement('span');
      slotMeta.className = 'slot-meta';
      slotMeta.textContent = `${booked}/${capacity}`;
      slotMetaWrap.appendChild(slotMeta);
      if (holdCount > 0) {
        const holdNote = document.createElement('span');
        holdNote.className = 'slot-hold-note';
        const holdMinutes = Number(state.bookingHoldMinutes || BOOKING_HOLD_MINUTES) || BOOKING_HOLD_MINUTES;
        holdNote.textContent = `On hold: ${holdCount} • try again in ${holdMinutes} min`;
        slotMetaWrap.appendChild(holdNote);
      }
      slotRow.appendChild(slotTime);
      slotRow.appendChild(seatWrap);
      slotRow.appendChild(slotMetaWrap);
      slotGrid.appendChild(slotRow);
    }
    slotsWrap.appendChild(slotGrid);
    card.appendChild(slotsWrap);
    grid.appendChild(card);
  }

  section.appendChild(grid);
  elements.serviceGrid.appendChild(section);
}

function getHydrogenSessionCountFromServiceName(serviceName) {
  const raw = String(serviceName || '').trim();
  const normalized = raw.toLowerCase();
  if (normalized.includes('single')) return 1;

  // Prefer explicit session count mentions like "(4 Sessions)".
  let match = raw.match(/\((\d+)\s*session/i);
  if (match) return Number(match[1]);

  match = raw.match(/\b(\d+)\s*session/i);
  if (match) return Number(match[1]);

  // Fallback: ignore "H2" prefix and use first standalone number.
  const cleaned = normalized.replace(/\bh2\b/g, ' ');
  match = cleaned.match(/\b(\d+)\b/);
  return match ? Number(match[1]) : 1;
}

function getHydrogenPlanOptions(services) {
  const preferredOrder = [1, 4, 8, 16, 30, 90];
  const bySessions = new Map();
  for (const service of services) {
    bySessions.set(getHydrogenSessionCountFromServiceName(service.name), service);
  }
  const options = [];
  for (const sessions of preferredOrder) {
    const service = bySessions.get(sessions);
    if (service) options.push({ sessions, service });
  }
  return options;
}

function formatSessionLabel(sessions) {
  if (sessions === 1) return '1 Session';
  return `${sessions} Sessions`;
}

function getTodayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTomorrowIsoDate() {
  const now = new Date();
  now.setDate(now.getDate() + 1);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isBookingSlotInPast(bookingDate, bookingTime) {
  const normalizedDate = String(bookingDate || '').trim();
  const normalizedTime = String(bookingTime || '').trim();
  if (!normalizedDate || !normalizedTime) return false;
  const slotDateTime = new Date(`${normalizedDate}T${normalizedTime}:00`);
  if (Number.isNaN(slotDateTime.getTime())) return false;
  return slotDateTime.getTime() < Date.now();
}

function getMaxBookingIsoDate() {
  const now = new Date();
  now.setDate(now.getDate() + BOOKING_WINDOW_DAYS);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCalendarMonthLabel(date) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function getCalendarDateKey(year, monthIndex, day) {
  const month = String(monthIndex + 1).padStart(2, '0');
  const dayValue = String(day).padStart(2, '0');
  return `${year}-${month}-${dayValue}`;
}

function buildBookingsByDate(bookings, year, monthIndex) {
  const map = new Map();
  const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}-`;
  for (const booking of bookings) {
    const rawDate = String(booking?.bookingDate || '').trim();
    if (!rawDate.startsWith(monthKey)) continue;
    const match = rawDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) continue;
    if (!map.has(rawDate)) map.set(rawDate, []);
    map.get(rawDate).push(booking);
  }
  return map;
}

function renderMembershipCalendarDetails(dateKey, bookings) {
  if (!elements.membershipCalendarDetails) return;
  if (!dateKey) {
    elements.membershipCalendarDetails.textContent = 'Select a date to view sessions.';
    return;
  }
  const label = formatBookingDateLabel(dateKey);
  if (!bookings.length) {
    elements.membershipCalendarDetails.innerHTML = `
      <div>${escapeHtml(label)}</div>
      <span>No sessions booked.</span>
    `;
    return;
  }
  const limited = bookings.slice(0, 3);
  const lines = limited
    .map(
      (booking) => `
        <div class="membership-calendar-detail-item">
          <strong>${escapeHtml(booking.serviceName || 'Session')}</strong>
          <span>${escapeHtml(formatBookingTimeLabel(booking.bookingTime))}</span>
        </div>
      `
    )
    .join('');
  const moreCount = bookings.length - limited.length;
  const moreLine = moreCount > 0 ? `<span>+${moreCount} more</span>` : '';
  elements.membershipCalendarDetails.innerHTML = `
    <div>${escapeHtml(label)}</div>
    ${lines}
    ${moreLine}
  `;
}

function renderMembershipCalendar(bookings) {
  if (!elements.membershipCalendarGrid || !elements.membershipCalendarMonth) return;
  const today = new Date();
  const year = today.getFullYear();
  const monthIndex = today.getMonth();
  elements.membershipCalendarMonth.textContent = getCalendarMonthLabel(today);

  const firstOfMonth = new Date(year, monthIndex, 1);
  const startDay = firstOfMonth.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const bookedByDate = buildBookingsByDate(bookings, year, monthIndex);
  const bookedDates = Array.from(bookedByDate.keys()).sort();
  const todayKey = getCalendarDateKey(year, monthIndex, today.getDate());
  if (!state.membershipCalendarSelectedDate || !state.membershipCalendarSelectedDate.startsWith(`${year}-`)) {
    state.membershipCalendarSelectedDate = bookedDates[0] || todayKey;
  }
  if (!state.membershipCalendarSelectedDate.startsWith(`${year}-${String(monthIndex + 1).padStart(2, '0')}-`)) {
    state.membershipCalendarSelectedDate = bookedDates[0] || todayKey;
  }

  elements.membershipCalendarGrid.innerHTML = '';
  const totalCells = 42;
  for (let index = 0; index < totalCells; index += 1) {
    const dayNumber = index - startDay + 1;
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'membership-calendar-day';
    if (dayNumber < 1 || dayNumber > daysInMonth) {
      cell.classList.add('is-outside');
      cell.disabled = true;
      cell.textContent = '';
    } else {
      const dateKey = getCalendarDateKey(year, monthIndex, dayNumber);
      cell.textContent = String(dayNumber);
      if (dateKey === todayKey) cell.classList.add('is-today');
      if (dateKey === state.membershipCalendarSelectedDate) cell.classList.add('is-selected');
      if (bookedByDate.has(dateKey)) cell.classList.add('is-booked');
      cell.addEventListener('click', () => {
        state.membershipCalendarSelectedDate = dateKey;
        renderMembershipCalendar(bookings);
      });
    }
    elements.membershipCalendarGrid.appendChild(cell);
  }

  renderMembershipCalendarDetails(
    state.membershipCalendarSelectedDate,
    bookedByDate.get(state.membershipCalendarSelectedDate) || []
  );
}

function renderMembership() {
  if (!elements.membershipPlans || !elements.membershipStatusText) return;
  if (state.user?.role !== 'user') return;

  if (elements.memberFlowLabel) {
    elements.memberFlowLabel.textContent =
      state.postLoginChoice === 'join-member'
        ? 'Join as member selected'
        : state.postLoginChoice === 'continue-member'
          ? 'Active membership will be used for member pricing in services.'
          : state.postLoginChoice === 'continue-non-member'
            ? 'Non-member mode selected. Membership is available if you want to switch later.'
            : '';
  }

  const current = state.membership.current || {};
  const active = Boolean(state.membership.active);
  const currentPeopleCount = Number(current.peopleCount || 0);
  const activePlan =
    (state.membership.plans || []).find((plan) => String(plan.id) === String(current.plan || '')) ||
    null;
  const activePlanName = activePlan?.name || current.plan || 'Membership';
  const effectiveExpiry = getEffectiveMembershipExpiryDate(current.startedAt, current.expiresAt);
  if (elements.membershipStatusText) {
    elements.membershipStatusText.textContent = active ? '' : 'No active membership';
    elements.membershipStatusText.hidden = active;
  }

  if (elements.membershipBrowsePanel) {
    elements.membershipBrowsePanel.hidden = active;
  }

  if (elements.membershipDashboard) {
    elements.membershipDashboard.hidden = !active;
  }

  if (active) {
    const firstName = String(state.user?.name || 'Member').trim().split(/\s+/)[0] || 'Member';
    if (elements.membershipWelcomeName) {
      elements.membershipWelcomeName.textContent = `Welcome, ${firstName}`;
    }
    if (elements.membershipDashboardStatus) {
      elements.membershipDashboardStatus.textContent = `${activePlanName}${
        effectiveExpiry ? ` • valid till ${effectiveExpiry.toLocaleDateString()}` : ''
      }`;
    }
  } else if (elements.membershipDashboardStatus) {
    elements.membershipDashboardStatus.textContent = '';
  }

  if (elements.membershipStatSessions) {
    const sessions = Number(activePlan?.h2SessionsIncluded || current.h2SessionsIncluded || 0);
    elements.membershipStatSessions.textContent = Number.isFinite(sessions) ? String(sessions) : '0';
  }
  if (elements.membershipStatMembers) {
    elements.membershipStatMembers.textContent = currentPeopleCount ? String(currentPeopleCount) : '0';
  }
  if (elements.membershipStatValid) {
    elements.membershipStatValid.textContent = effectiveExpiry ? effectiveExpiry.toLocaleDateString() : '-';
  }

  const hydrogenSessions = (state.bookings || []).filter(
    (booking) =>
      getBookingCategory(booking.serviceName) === 'HYDROGEN SESSION' &&
      String(booking.status || '').toLowerCase() !== 'cancelled'
  );
  const totalSessions = Number(activePlan?.h2SessionsIncluded || 0);
  const usedSessions = active ? hydrogenSessions.length : 0;
  const remainingSessions = totalSessions > 0 ? Math.max(0, totalSessions - usedSessions) : 0;
  const usagePercent = totalSessions > 0 ? Math.min(100, Math.round((usedSessions / totalSessions) * 100)) : 0;

  if (elements.membershipUsageLabel) {
    elements.membershipUsageLabel.textContent = totalSessions
      ? `${usedSessions} of ${totalSessions} used`
      : '0 of 0 used';
  }
  if (elements.membershipUsageBar) {
    elements.membershipUsageBar.style.width = `${usagePercent}%`;
  }
  if (elements.membershipUsageNote) {
    elements.membershipUsageNote.textContent = active
      ? `${remainingSessions} sessions remaining`
      : 'Start a membership to begin tracking sessions.';
  }

  const upcoming = hydrogenSessions
    .filter((booking) => !isBookingSlotInPast(booking.bookingDate, booking.bookingTime))
    .sort((a, b) => `${a.bookingDate}T${a.bookingTime}`.localeCompare(`${b.bookingDate}T${b.bookingTime}`))[0];

  if (elements.membershipNextSessionTitle) {
    elements.membershipNextSessionTitle.textContent = upcoming ? 'Hydrogen Session' : 'No sessions scheduled';
  }
  if (elements.membershipNextSessionMeta) {
    elements.membershipNextSessionMeta.textContent = upcoming
      ? formatDateTime(upcoming.bookingDate, upcoming.bookingTime)
      : 'Book your next session to keep momentum.';
  }
  if (active) {
    renderMembershipCalendar((state.bookings || []).filter((booking) => String(booking.status || '').toLowerCase() !== 'cancelled'));
  }

  const orderedPlanIds = ['h2_single', 'h2_two', 'h2_four'];
  const plans = orderedPlanIds
    .map((id) => (state.membership.plans || []).find((plan) => String(plan.id) === id))
    .filter(Boolean);
  const addPersonPriceInr = getMembershipAddPersonPriceInr();

  if (!plans.length) {
    elements.membershipPlans.innerHTML = '<p class="empty-state">Membership plans are not configured.</p>';
    return;
  }

  elements.membershipPlans.innerHTML = '';
  for (const plan of plans) {
    const isSinglePlan = String(plan.id) === 'h2_single';
    const additionalPeople = isSinglePlan ? 0 : Math.max(0, Number(state.membershipAdditions?.[plan.id] || 0));
    const targetPeopleCount = Number(plan.peopleCount || 1) + additionalPeople;
    const estimatedAmountInr = Number(plan.priceInr || 0) + additionalPeople * addPersonPriceInr;
    const isCurrentBasePlan = active && String(current.plan || '') === String(plan.id);
    const theme = getMembershipPlanTheme(plan);
    const featureItems = getMembershipFeatureItems(plan);

    const card = document.createElement('article');
    card.className = 'membership-card';
    if (theme.featured) card.classList.add('is-featured');
    if (isCurrentBasePlan) card.classList.add('is-current');
    const planPerks = String(plan.perks || '').trim();
    card.innerHTML = `
      <div class="membership-card-top">
        <span class="membership-card-kicker">${escapeHtml(theme.kicker)}</span>
        <span class="membership-card-pill">${escapeHtml(theme.pill)}</span>
      </div>
      <div class="membership-card-head">
        <div>
          <h3>${escapeHtml(plan.name)}</h3>
          <p class="membership-card-subtitle">${escapeHtml(theme.subtitle)}</p>
        </div>
        <div class="membership-card-status-slot">
          ${isCurrentBasePlan ? '<span class="membership-card-active">Current Plan</span>' : ''}
        </div>
      </div>
      <div class="membership-card-price-block">
        <p class="membership-price">Rs. ${estimatedAmountInr.toLocaleString('en-IN')}</p>
        <p class="membership-price-caption">1-year access • ${escapeHtml(plan.validityDays)} days</p>
      </div>
      <div class="membership-card-metrics">
        <div class="membership-card-metric">
          <strong>${escapeHtml(plan.peopleCount)}</strong>
          <span>Base Members</span>
        </div>
        <div class="membership-card-metric">
          <strong>${escapeHtml(plan.h2SessionsIncluded || 0)}</strong>
          <span>H2 Sessions</span>
        </div>
        <div class="membership-card-metric">
          <strong>${escapeHtml(targetPeopleCount)}</strong>
          <span>Selected Cover</span>
        </div>
      </div>
      <ul class="membership-feature-list">
        ${featureItems.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
      </ul>
      ${
        isSinglePlan
          ? ''
          : `<div class="membership-add-price-box">
              <span class="membership-add-price-line">Add Person Price</span>
              <strong>Rs. ${addPersonPriceInr.toLocaleString('en-IN')} each</strong>
            </div>`
      }
      ${!isSinglePlan && planPerks ? `<p class="membership-plan-caption">${escapeHtml(planPerks)}</p>` : ''}
    `;

    const addControls = document.createElement('div');
    addControls.className = 'membership-add-controls';
    if (!isSinglePlan) {
      addControls.innerHTML = `
        <span class="membership-add-label">Add Person: +${additionalPeople}${additionalPeople > 0 ? ` • +Rs. ${(additionalPeople * addPersonPriceInr).toLocaleString('en-IN')}` : ''}</span>
      `;
      const decBtn = document.createElement('button');
      decBtn.type = 'button';
      decBtn.className = 'btn btn-secondary';
      decBtn.textContent = '-';
      decBtn.disabled = additionalPeople <= 0;
      decBtn.addEventListener('click', () => {
        state.membershipAdditions[plan.id] = Math.max(0, additionalPeople - 1);
        renderMembership();
      });
      const incBtn = document.createElement('button');
      incBtn.type = 'button';
      incBtn.className = 'btn btn-secondary';
      incBtn.textContent = '+ Add Person';
      incBtn.addEventListener('click', () => {
        state.membershipAdditions[plan.id] = Math.min(8, additionalPeople + 1);
        renderMembership();
      });
      addControls.appendChild(decBtn);
      addControls.appendChild(incBtn);
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-primary';
    button.textContent = isCurrentBasePlan && additionalPeople === 0 ? 'Active' : 'Continue to Details';
    button.disabled = isCurrentBasePlan && additionalPeople === 0;
    button.addEventListener('click', () => {
      openMembershipCheckoutDialog(plan, additionalPeople);
    });

    if (!isSinglePlan) {
      card.appendChild(addControls);
    }
    const actionWrap = document.createElement('div');
    actionWrap.className = 'membership-card-actions';
    actionWrap.appendChild(button);
    card.appendChild(actionWrap);
    elements.membershipPlans.appendChild(card);
  }
}

function getMembershipPlanTheme(plan) {
  const planId = String(plan?.id || '');
  if (planId === 'h2_two') {
    return {
      kicker: 'Most Popular',
      pill: 'Duo Care',
      subtitle: 'Balanced membership for two people with stronger shared value.',
      featured: true,
    };
  }
  if (planId === 'h2_four') {
    return {
      kicker: 'Group Plan',
      pill: 'Best Value',
      subtitle: 'Tailored for groups seeking hydrogen therapy with complete diagnostic support.',
      featured: false,
    };
  }
  return {
    kicker: 'Starter Plan',
    pill: 'Individual Care',
    subtitle: 'Best for one person starting a structured wellness plan.',
    featured: false,
  };
}

function getMembershipFeatureItems(plan) {
  const sessions = Number(plan?.h2SessionsIncluded || 0);
  return [
    `${sessions} hydrogen session${sessions === 1 ? '' : 's'} included`,
    'Lab Tests included',
    'Oxidative Stress Marker Test included',
    'Radiology Services included',
    'Member pricing across eligible services',
  ];
}

function getMembershipAddPersonPriceInr() {
  const addPersonPlan = (state.membership.plans || []).find((plan) => String(plan.id) === 'h2_add_person');
  return Number(addPersonPlan?.priceInr || 0);
}

function openMembershipCheckoutDialog(plan, additionalPeople) {
  if (!elements.membershipDialog || !elements.membershipMembersGrid) return;
  const targetPeopleCount = Number(plan.peopleCount || 1) + Number(additionalPeople || 0);
  const addPersonPriceInr = getMembershipAddPersonPriceInr();
  const estimatedAmountInr = Number(plan.priceInr || 0) + Number(additionalPeople || 0) * addPersonPriceInr;
  const members = [];
  for (let i = 0; i < targetPeopleCount; i += 1) {
    members.push({
      name: i === 0 ? state.user?.name || '' : '',
      place: '',
      email: i === 0 ? state.user?.email || '' : '',
      contactNumber: i === 0 ? state.user?.mobile || '' : '',
    });
  }

  state.membershipCheckout = {
    planId: plan.id,
    planName: plan.name,
    additionalPeople: Number(additionalPeople || 0),
    targetPeopleCount,
    estimatedAmountInr,
    members,
  };
  state.membershipCouponPreview = null;
  if (elements.membershipCouponCode) {
    elements.membershipCouponCode.value = '';
  }

  if (elements.membershipDialogTitle) {
    elements.membershipDialogTitle.textContent = `Membership Details • ${plan.name}`;
  }
  renderMembershipCheckoutSummary();
  renderMembershipCouponPreview();

  elements.membershipMembersGrid.innerHTML = '';
  for (let i = 0; i < members.length; i += 1) {
    const member = members[i];
    const row = document.createElement('div');
    row.className = 'membership-member-row';
    row.innerHTML = `
      <h4>Person ${i + 1}</h4>
      <div class="form-grid">
        <label>
          Full Name
          <input type="text" required data-member-index="${i}" data-member-field="name" value="${escapeHtml(member.name)}" />
        </label>
        <label>
          Place
          <input type="text" required data-member-index="${i}" data-member-field="place" value="${escapeHtml(member.place)}" />
        </label>
        <label>
          Email
          <input type="email" required data-member-index="${i}" data-member-field="email" value="${escapeHtml(member.email)}" />
        </label>
        <label>
          Contact Number
          <input type="tel" required data-member-index="${i}" data-member-field="contactNumber" value="${escapeHtml(member.contactNumber)}" />
        </label>
      </div>
    `;
    elements.membershipMembersGrid.appendChild(row);
  }

  elements.membershipDialog.showModal();
}

function closeMembershipDialog() {
  if (elements.membershipDialog?.open) {
    elements.membershipDialog.close();
  }
  state.membershipCheckout = null;
}

function collectMembershipMemberDetails() {
  if (!state.membershipCheckout || !elements.membershipMembersGrid) return [];
  const members = [];
  for (let i = 0; i < state.membershipCheckout.targetPeopleCount; i += 1) {
    const getValue = (field) => {
      const input = elements.membershipMembersGrid.querySelector(
        `[data-member-index="${i}"][data-member-field="${field}"]`
      );
      return String(input?.value || '').trim();
    };
    members.push({
      name: getValue('name'),
      place: getValue('place'),
      email: getValue('email'),
      contactNumber: getValue('contactNumber'),
    });
  }
  return members;
}

function renderMembershipCheckoutSummary() {
  if (!elements.membershipPlanSummary || !state.membershipCheckout) return;
  const targetPeopleCount = Number(state.membershipCheckout.targetPeopleCount || 0);
  const estimatedAmountInr = Number(state.membershipCheckout.estimatedAmountInr || 0);
  const preview = state.membershipCouponPreview;

  if (preview) {
    const original = Number(preview.originalAmountInr || estimatedAmountInr || 0);
    const discount = Number(preview.discountAmountInr || 0);
    const payable = Number(preview.payableAmountInr || Math.max(0, original - discount));
    elements.membershipPlanSummary.textContent =
      `Members: ${targetPeopleCount} • Estimated: Rs. ${original.toLocaleString('en-IN')}` +
      ` • Coupon: -Rs. ${discount.toLocaleString('en-IN')}` +
      ` • Payable: Rs. ${payable.toLocaleString('en-IN')}`;
    return;
  }

  elements.membershipPlanSummary.textContent = `Members: ${targetPeopleCount} • Estimated Amount: Rs. ${estimatedAmountInr.toLocaleString(
    'en-IN'
  )}`;
}

function renderCouponPreview(preview, target) {
  if (!target) return;
  if (!preview) {
    target.hidden = true;
    target.innerHTML = '';
    return;
  }

  const description = String(preview.description || '').trim();
  const original = Number(preview.originalAmountInr || 0);
  const discount = Number(preview.discountAmountInr || 0);
  const payable = Number(preview.payableAmountInr || 0);
  target.hidden = false;
  target.innerHTML = `
    <strong>${escapeHtml(preview.code || '')}</strong>
    ${description ? `<span>${escapeHtml(description)}</span>` : ''}
    <span>Discount: Rs. ${discount.toLocaleString('en-IN')} off</span>
    <span>Payable: Rs. ${payable.toLocaleString('en-IN')} (was Rs. ${original.toLocaleString('en-IN')})</span>
  `;
}

function renderMembershipCouponPreview() {
  renderCouponPreview(state.membershipCouponPreview, elements.membershipCouponPreview);
}

function renderCartCouponPreview() {
  renderCouponPreview(state.cartCouponPreview, elements.userCouponPreview);
}

async function previewMembershipCoupon() {
  if (!state.membershipCheckout) {
    alert('Select a membership plan first.');
    return;
  }
  const couponCode = String(elements.membershipCouponCode?.value || '').trim();
  if (!couponCode) {
    state.membershipCouponPreview = null;
    renderMembershipCouponPreview();
    renderMembershipCheckoutSummary();
    return;
  }

  try {
    const result = await api('/api/membership/preview-coupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId: state.membershipCheckout.planId,
        additionalPeople: state.membershipCheckout.additionalPeople,
        couponCode,
      }),
    });
    state.membershipCouponPreview = result.coupon || null;
    renderMembershipCouponPreview();
    renderMembershipCheckoutSummary();
  } catch (error) {
    state.membershipCouponPreview = null;
    renderMembershipCouponPreview();
    renderMembershipCheckoutSummary();
    alert(error.message || 'Unable to apply this coupon.');
  }
}

async function previewCartCoupon() {
  const couponCode = String(elements.userCouponCode?.value || '').trim();
  state.cartCouponCode = couponCode;
  if (!couponCode) {
    state.cartCouponPreview = null;
    renderCartCouponPreview();
    renderUserCheckoutSummary(state.bookings || []);
    return;
  }

  try {
    const result = await api('/api/payments/preview-cart-coupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ couponCode }),
    });
    state.cartCouponPreview = result.coupon || null;
    renderCartCouponPreview();
    renderUserCheckoutSummary(state.bookings || []);
  } catch (error) {
    state.cartCouponPreview = null;
    renderCartCouponPreview();
    renderUserCheckoutSummary(state.bookings || []);
    alert(error.message || 'Unable to apply this coupon.');
  }
}

async function submitMembershipCheckout() {
  if (!state.membershipCheckout) return;
  const plan = (state.membership.plans || []).find((item) => String(item.id) === String(state.membershipCheckout.planId));
  if (!plan) {
    alert('Membership plan not found.');
    return;
  }

  const memberDetails = collectMembershipMemberDetails();
  try {
    await activateMembershipWithPayment(plan, state.membershipCheckout.additionalPeople, memberDetails);
  } catch (error) {
    alert(error.message || 'Unable to continue with membership payment.');
  }
}

async function activateMembershipWithPayment(plan, additionalPeople = 0, memberDetails = []) {
  const couponCode = state.membershipCouponPreview?.code || String(elements.membershipCouponCode?.value || '').trim();
  const order = await api('/api/membership/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ planId: plan.id, additionalPeople, memberDetails, couponCode }),
  });

  if (!window.Razorpay) {
    throw new Error('Razorpay SDK not loaded');
  }

  closeMembershipDialog();

  const options = {
    key: order.keyId,
    amount: order.amount,
    currency: order.currency || 'INR',
    name: 'H2 House Of Health',
    description: `Membership: ${order.plan?.name || plan.name}`,
    order_id: order.orderId,
    prefill: {
      name: order.user?.name || state.user?.name || '',
      email: order.user?.email || state.user?.email || '',
    },
    theme: {
      color: '#8b5e3c',
    },
    handler: async (response) => {
      try {
        const result = await api('/api/membership/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planId: plan.id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          }),
        });
        state.user = { ...state.user, ...(result.profile || {}) };
        await loadDashboardData();
        state.membershipCouponPreview = null;
        if (elements.membershipCouponCode) elements.membershipCouponCode.value = '';
        renderMembershipCouponPreview();
        renderMembershipCheckoutSummary();
        state.activeUserTab = 'services';
        render();
        requestAnimationFrame(() => {
          elements.servicesSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        alert(result.message || 'Membership activated. Redirecting to Services.');
      } catch (error) {
        alert(error.message || 'Membership payment verification failed.');
      }
    },
    modal: {
      ondismiss: () => {
        alert('Membership payment was canceled.');
      },
    },
  };

  const checkout = new window.Razorpay(options);
  checkout.open();
}

function renderProfileAvatar() {
  const initials = getInitials(state.user?.name || 'User');
  const avatarUrl = normalizeAvatarUrl(state.user?.avatarUrl || '');
  elements.profileAvatar.textContent = initials;
  if (avatarUrl) {
    elements.profileAvatar.style.backgroundImage = `url("${avatarUrl}")`;
    elements.profileAvatar.classList.add('has-image');
  } else {
    elements.profileAvatar.style.backgroundImage = '';
    elements.profileAvatar.classList.remove('has-image');
  }
}

function normalizeAvatarUrl(urlValue) {
  const raw = String(urlValue || '').trim();
  if (!raw) return '';
  if (raw.startsWith('blob:')) return raw;
  try {
    return new URL(raw, window.location.origin).toString();
  } catch {
    return '';
  }
}

function withCacheBuster(urlValue) {
  const normalized = normalizeAvatarUrl(urlValue);
  if (!normalized) return '';
  try {
    const u = new URL(normalized);
    u.searchParams.set('v', String(Date.now()));
    return u.toString();
  } catch {
    return normalized;
  }
}

function getInitials(name) {
  const parts = String(name).trim().split(/\s+/).filter(Boolean).slice(0, 2);
  if (parts.length === 0) return 'U';
  return parts.map((part) => part[0].toUpperCase()).join('');
}

function renderStats(bookings) {
  if (!elements.totalCount) {
    return;
  }
  const source = state.user?.role === 'admin' ? getTodayAdminBookings(bookings) : bookings;
  const total = source.length;
  const allBookingsCount = Array.isArray(bookings) ? bookings.length : 0;

  elements.totalCount.textContent = String(total);
  if (elements.historyCount) elements.historyCount.textContent = String(allBookingsCount);

  // Apply visual feedback for active state
  if (state.user?.role === 'admin') {
    elements.adminHistoryCard?.classList.toggle('is-active', state.adminHistoryVisible);
  }
}

function getAdminUserBookings(userId) {
  const normalizedId = String(userId || '');
  return (Array.isArray(state.bookings) ? state.bookings : [])
    .filter((booking) => String(booking?.userId || '') === normalizedId)
    .sort((a, b) => `${a.bookingDate}T${a.bookingTime}`.localeCompare(`${b.bookingDate}T${b.bookingTime}`));
}

function getBookingStartTime(booking) {
  const bookingDate = String(booking?.bookingDate || '').trim();
  const bookingTime = String(booking?.bookingTime || '').trim();
  if (!bookingDate || !bookingTime) return Number.NaN;
  const timestamp = new Date(`${bookingDate}T${bookingTime}:00`).getTime();
  return Number.isFinite(timestamp) ? timestamp : Number.NaN;
}

function isBookingMissed(booking) {
  const status = String(booking?.status || '').trim().toLowerCase();
  if (status === 'missed') return true;
  if (status === 'completed' || status === 'cancelled') return false;
  const bookingStart = getBookingStartTime(booking);
  return Number.isFinite(bookingStart) && bookingStart < Date.now();
}

function buildAdminUserSessionSummary(user) {
  const bookings = getAdminUserBookings(user?.id);
  const activeBookings = bookings.filter((booking) => String(booking?.status || '').toLowerCase() !== 'cancelled');
  const completed = activeBookings.filter((booking) => String(booking?.status || '').toLowerCase() === 'completed').length;
  const missed = activeBookings.filter(isBookingMissed).length;
  const remaining = activeBookings.filter((booking) => {
    const status = String(booking?.status || '').toLowerCase();
    return status !== 'completed' && !isBookingMissed(booking);
  }).length;

  return {
    bookings,
    total: activeBookings.length,
    completed,
    remaining,
    missed,
  };
}

function getMembershipPlanSessionAllowance(user) {
  const planId = String(user?.membershipPlan || '').trim();
  const peopleCount = Math.max(1, Number(user?.membershipPeopleCount || 1));
  const planSessionsById = {
    h2_single: 16,
    h2_two: 32,
    h2_four: 64,
    h2_add_person: 16,
  };
  const totalSessions = Number(planSessionsById[planId] || 0);
  if (!totalSessions) {
    return {
      planLabel: 'No active plan',
      totalSessions: 0,
      perUserSessions: 0,
    };
  }
  return {
    planLabel: getMembershipPlanDisplayName(planId),
    totalSessions,
    perUserSessions: Math.floor(totalSessions / peopleCount),
  };
}

function renderAdminUserCards() {
  if (!elements.adminUserCards || !elements.adminUserCardsEmpty) return;

  const users = getFilteredAdminUsers();
  elements.adminUserCards.innerHTML = '';

  if (!users.length) {
    elements.adminUserCardsEmpty.hidden = false;
    return;
  }

  elements.adminUserCardsEmpty.hidden = true;
  users.forEach((user) => {
    const summary = buildAdminUserSessionSummary(user);
    const membership = getMembershipPlanSessionAllowance(user);
    const completionPercent = summary.total > 0 ? Math.round((summary.completed / summary.total) * 100) : 0;
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'admin-user-card';
    card.innerHTML = `
      <div class="admin-user-card-top">
        <span class="admin-user-card-avatar">${escapeHtml(getInitials(user?.name || 'User'))}</span>
        <span class="admin-user-card-tag">User #${escapeHtml(String(user?.id || '-'))}</span>
      </div>
      <div class="admin-user-card-main">
        <div class="admin-user-card-body">
          <h3>${escapeHtml(user?.name || 'Unnamed User')}</h3>
          <p>${escapeHtml(user?.email || user?.mobile || 'No contact info')}</p>
          <p class="admin-user-plan-copy">${escapeHtml(
            membership.totalSessions
              ? `${membership.planLabel} ? ${membership.perUserSessions} sessions per user`
              : membership.planLabel
          )}</p>
        </div>
        <div class="admin-user-donut-wrap">
          <div class="admin-user-donut" style="--donut-angle:${completionPercent}%;"><span>${escapeHtml(
            String(summary.completed)
          )}/${escapeHtml(String(summary.total))}</span></div>
          <small>Completed</small>
        </div>
      </div>
      <div class="admin-user-card-footer">
        <span><strong>${summary.total}</strong> total sessions</span>
        <span><strong>${summary.completed}</strong> completed</span>
      </div>
    `;
    card.addEventListener('click', () => {
      openAdminUserSessionDialog(user.id);
    });
    elements.adminUserCards.appendChild(card);
  });
}

function renderAdminUserSessionDialog() {
  if (
    !elements.adminUserSessionTitle ||
    !elements.adminUserSessionMeta ||
    !elements.adminUserSessionKpis ||
    !elements.adminUserSessionList ||
    !elements.adminUserSessionListEmpty
  ) {
    return;
  }

  const selectedUser = (Array.isArray(state.adminUsers) ? state.adminUsers : []).find(
    (user) => String(user?.id || '') === String(state.adminSelectedUserId || '')
  );

  if (!selectedUser) {
    elements.adminUserSessionTitle.textContent = 'User Sessions';
    elements.adminUserSessionMeta.textContent = '';
    elements.adminUserSessionKpis.innerHTML = '';
    elements.adminUserSessionList.innerHTML = '';
    elements.adminUserSessionListEmpty.hidden = false;
    return;
  }

  const summary = buildAdminUserSessionSummary(selectedUser);
  elements.adminUserSessionTitle.textContent = selectedUser.name || 'User Sessions';
  elements.adminUserSessionMeta.textContent = [selectedUser.email, selectedUser.mobile ? `ID ${selectedUser.id} • ${selectedUser.mobile}` : `ID ${selectedUser.id}`]
    .filter(Boolean)
    .join(' • ');

  const kpis = [
    { title: 'Total Sessions', value: summary.total, tone: 'total' },
    { title: 'Completed Sessions', value: summary.completed, tone: 'completed' },
    { title: 'Remaining Sessions', value: summary.remaining, tone: 'remaining' },
    { title: 'Missed Sessions', value: summary.missed, tone: 'missed' },
  ];

  elements.adminUserSessionKpis.innerHTML = '';
  kpis.forEach((metric) => {
    const card = document.createElement('article');
    card.className = `admin-user-kpi-card tone-${metric.tone}`;
    card.innerHTML = `
      <span>${escapeHtml(metric.title)}</span>
      <strong>${escapeHtml(String(metric.value))}</strong>
    `;
    elements.adminUserSessionKpis.appendChild(card);
  });

  elements.adminUserSessionList.innerHTML = '';
  if (!summary.bookings.length) {
    elements.adminUserSessionListEmpty.hidden = false;
    return;
  }

  elements.adminUserSessionListEmpty.hidden = true;
  [...summary.bookings]
    .sort((a, b) => `${b.bookingDate}T${b.bookingTime}`.localeCompare(`${a.bookingDate}T${a.bookingTime}`))
    .forEach((booking) => {
      const status = String(booking?.status || '').toLowerCase();
      const derivedStatus =
        isBookingMissed(booking) && !['completed', 'cancelled', 'missed'].includes(status)
          ? 'missed'
          : status || 'pending';
      const row = document.createElement('article');
      row.className = 'admin-user-session-row';
      row.innerHTML = `
        <div>
          <h4>${escapeHtml(booking?.serviceName || 'Session')}</h4>
          <p>${escapeHtml(formatAdminBookingDateTime(booking?.bookingDate, booking?.bookingTime).replace(/\n/g, ' • '))}</p>
        </div>
        <div class="admin-user-session-badges">
          <span class="status-chip status-${escapeHtml(derivedStatus)}">${escapeHtml(derivedStatus)}</span>
          <span class="status-chip payment-${escapeHtml(String(booking?.paymentStatus || 'unpaid').toLowerCase())}">${escapeHtml(
            String(booking?.paymentStatus || 'unpaid')
          )}</span>
        </div>
      `;
      elements.adminUserSessionList.appendChild(row);
    });
}

function renderUserRows(bookings) {
  elements.bookingTableBody.innerHTML = '';

  if (bookings.length === 0) {
    elements.emptyState.hidden = false;
    renderUserCheckoutSummary([]);
    return;
  }

  elements.emptyState.hidden = true;
  const displayRows = buildUserBookingRows(bookings, state.bookings);
  renderUserCheckoutSummary(state.bookings);

  for (const row of displayRows) {
    const tr = document.createElement('tr');

    tr.appendChild(userBookingServiceCell(row));
    tr.appendChild(userBookingScheduleCell(row));
    tr.appendChild(statusCell(row.status));
    tr.appendChild(paymentCell(row.paymentStatus || 'unpaid'));

    const actionCell = document.createElement('td');
    const actions = document.createElement('div');
    actions.className = 'action-row';

    const canEdit = !['completed', 'cancelled'].includes(String(row.status || '').toLowerCase());
    const canCancel = row.status !== 'cancelled';
    if ((row.paymentStatus || 'unpaid') === 'paid') {
      actions.append(createActionButton('Invoice', () => openBookingInvoice(row.booking?.id || row.id)));
    }
    if (canEdit) {
      actions.append(
        createActionButton(row.isGroupedHydrogen ? 'Edit Package' : 'Edit', () => {
          if (row.isGroupedHydrogen) {
            openHydrogenPackageEditor(row);
            return;
          }
          openSingleSessionBookingEditor(row.booking);
        })
      );
    }
    if (canCancel) {
      actions.append(createActionButton('Cancel', () => changeStatus(row.id, 'cancelled')));
    }
    actions.append(createDangerButton('Delete', () => deleteBooking(row.booking)));

    actionCell.appendChild(actions);
    tr.appendChild(actionCell);
    elements.bookingTableBody.appendChild(tr);
  }
}

function renderUserCheckoutSummary(bookings) {
  if (!elements.userCheckoutSummary || !elements.bookingsPayAllBtn) return;

  const summary = buildUserCartSummary(bookings);
  if (!summary.unitCount) {
    elements.userCheckoutSummary.hidden = true;
    elements.userCheckoutSummary.innerHTML = '';
    elements.bookingsPayAllBtn.hidden = true;
    elements.bookingsPayAllBtn.disabled = true;
    state.cartCouponPreview = null;
    renderCartCouponPreview();
    return;
  }

  const coupon = state.cartCouponPreview;
  const payableAmountInr = Number(coupon?.payableAmountInr || summary.totalAmountInr || 0);
  const discountAmountInr = Number(coupon?.discountAmountInr || 0);
  const holdMinutes = summary.holdActive
    ? Number(summary.holdRemainingMinutes || state.bookingHoldMinutes || BOOKING_HOLD_MINUTES)
    : 0;
  const holdLine = summary.holdActive
    ? `<span class="user-hold-alert">Complete payment within ${holdMinutes} minute${holdMinutes === 1 ? '' : 's'} to keep this booking.</span>`
    : '';
  elements.userCheckoutSummary.hidden = false;
  elements.userCheckoutSummary.innerHTML = `
    <strong>${summary.unitCount} item${summary.unitCount === 1 ? '' : 's'} ready for one payment</strong>
    ${
      coupon
        ? `<span>Subtotal: Rs. ${summary.totalAmountInr.toLocaleString('en-IN')}</span>
           <span>Coupon Savings: -Rs. ${discountAmountInr.toLocaleString('en-IN')}</span>
           <span>Total payable: Rs. ${payableAmountInr.toLocaleString('en-IN')}</span>`
        : `<span>Total payable: Rs. ${summary.totalAmountInr.toLocaleString('en-IN')}</span>`
    }
    ${holdLine}
  `;
  elements.bookingsPayAllBtn.hidden = false;
  elements.bookingsPayAllBtn.disabled = false;
  elements.bookingsPayAllBtn.textContent = `Pay Now`;
}

function buildHoldNotice(entries = []) {
  const normalized = Array.isArray(entries) ? entries : [];
  const activeEntries = normalized.filter((entry) => entry?.holdActive);
  if (activeEntries.length) {
    const minutes = Math.min(
      ...activeEntries
        .map((entry) => Number(entry?.holdRemainingMinutes || 0))
        .filter((value) => Number.isFinite(value) && value > 0)
    );
    const safeMinutes = minutes || Number(state.bookingHoldMinutes || BOOKING_HOLD_MINUTES) || BOOKING_HOLD_MINUTES;
    return {
      tone: 'hold',
      text: `On hold: complete payment within ${safeMinutes} minute${safeMinutes === 1 ? '' : 's'} to keep this booking.`,
    };
  }

  const expired = normalized.some((entry) => entry?.holdExpired);
  if (expired) {
    return { tone: 'expired', text: 'Hold expired. Please book this slot again.' };
  }

  return null;
}

function buildUserBookingRows(bookings, allBookings = bookings) {
  const byGroup = new Map();
  for (const booking of allBookings) {
    const key = booking.bookingGroupId || `single_${booking.id}`;
    if (!byGroup.has(key)) {
      byGroup.set(key, []);
    }
    byGroup.get(key).push(booking);
  }

  const includedKeys = new Set(
    bookings.map((booking) => booking.bookingGroupId || `single_${booking.id}`)
  );
  const rows = [];
  for (const [groupKey, entries] of byGroup.entries()) {
    if (!includedKeys.has(groupKey)) continue;
    const sortedEntries = [...entries].sort((a, b) =>
      `${a.bookingDate}T${a.bookingTime}`.localeCompare(`${b.bookingDate}T${b.bookingTime}`)
    );
    const hydrogenEntries = sortedEntries.filter((entry) => getBookingCategory(entry.serviceName) === 'HYDROGEN SESSION');
    const addOnEntries = sortedEntries.filter((entry) => getBookingCategory(entry.serviceName) === 'IV ADD-ON');
    const isGroupedHydrogen = Boolean(groupKey.startsWith('hydrogen_') || (sortedEntries[0]?.bookingGroupId && hydrogenEntries.length));

    if (!isGroupedHydrogen) {
      const booking = sortedEntries[0];
      const holdNotice = buildHoldNotice([booking]);
      rows.push({
        id: booking.id,
        booking,
        sortKey: `${booking.bookingDate}T${booking.bookingTime}`,
        isGroupedHydrogen: false,
        status: booking.status,
        paymentStatus: booking.paymentStatus || 'unpaid',
        serviceTitle: booking.serviceName,
        serviceMetaLines: [
          getBookingCategoryLabel(booking.serviceName),
          ...(holdNotice ? [holdNotice] : []),
        ],
        scheduleLines: [formatDateTime(booking.bookingDate, booking.bookingTime)],
        serviceText: booking.serviceName,
        dateTimeText: formatDateTime(booking.bookingDate, booking.bookingTime),
      });
      continue;
    }

    const booking = hydrogenEntries[0] || sortedEntries[0];
    const baseServiceName = hydrogenEntries[0]?.serviceName || booking.serviceName || 'Hydrogen Package';
    const breakdown = getHydrogenGroupBreakdown(hydrogenEntries, addOnEntries);
    const addOnDetails = addOnEntries.map((entry) => {
      const linkedIndex = hydrogenEntries.findIndex(
        (slot) => slot.bookingDate === entry.bookingDate && slot.bookingTime === entry.bookingTime
      );
      return linkedIndex >= 0 ? `${entry.serviceName} (Session ${linkedIndex + 1})` : entry.serviceName;
    });
    const holdNotice = buildHoldNotice(sortedEntries);

    const slotLines = hydrogenEntries.map(
      (entry, index) => `S${index + 1}: ${formatDateTime(entry.bookingDate, entry.bookingTime)}`
    );
    if (addOnEntries.length) {
      addOnEntries.forEach((entry) => {
        slotLines.push(`Add-on: ${entry.serviceName} with ${formatDateTime(entry.bookingDate, entry.bookingTime)}`);
      });
    }

    rows.push({
      id: booking.id,
      booking,
      sortKey: `${booking.bookingDate}T${booking.bookingTime}`,
      bookingGroupId: booking.bookingGroupId || '',
      baseServiceName,
      extraSessions: Math.max(0, hydrogenEntries.length - getHydrogenSessionCountFromServiceName(baseServiceName)),
      hydrogenEntries,
      addOnEntries,
      isGroupedHydrogen: true,
      status: summarizeGroupStatus(sortedEntries),
      paymentStatus: summarizeGroupPaymentStatus(sortedEntries),
      serviceTitle: 'Hydrogen Package Booking',
      serviceMetaLines: [
        baseServiceName,
        ...(addOnDetails.length ? [`Add-on: ${addOnDetails.join(', ')}`] : []),
        ...(holdNotice ? [holdNotice] : []),
      ],
      scheduleLines: [hydrogenEntries[0] ? formatDateTime(hydrogenEntries[0].bookingDate, hydrogenEntries[0].bookingTime) : '-'],
      detailSections: [
        { title: 'Sessions', lines: slotLines },
        ...(addOnDetails.length ? [{ title: 'Add-on', lines: addOnDetails }] : []),
        ...(breakdown.totalAmountInr > 0
          ? [
              {
                title: 'Payment',
                lines: [breakdown.breakdownText, `Total: Rs. ${breakdown.totalAmountInr.toLocaleString('en-IN')}`],
              },
            ]
          : []),
      ],
      serviceText: ['Hydrogen Package Booking', baseServiceName].join('\n'),
      dateTimeText: slotLines.join('\n'),
    });
  }

  return rows.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
}

function buildUserCartSummary(bookings = state.bookings) {
  const payableBookings = (Array.isArray(bookings) ? bookings : []).filter((booking) => {
    if (String(booking.status || '').toLowerCase() === 'cancelled') return false;
    if (String(booking.paymentStatus || '').toLowerCase() === 'paid') return false;
    if (booking.holdExpired) return false;
    const service = getServiceCatalogEntry(booking.serviceName);
    return !service?.membershipOnly;
  });

  const rows = buildUserBookingRows(payableBookings, payableBookings);
  let totalAmountInr = 0;
  for (const row of rows) {
    if (row.isGroupedHydrogen) {
      totalAmountInr += Number(getHydrogenGroupBreakdown(row.hydrogenEntries || [], row.addOnEntries || []).totalAmountInr || 0);
    } else {
      totalAmountInr += Number(getDisplayedServicePriceInr(row.booking?.serviceName || row.serviceTitle || '') || 0);
    }
  }

  const holdActiveEntries = payableBookings.filter((booking) => booking.holdActive);
  const holdRemainingMinutes = holdActiveEntries.length
    ? Math.min(
        ...holdActiveEntries
          .map((booking) => Number(booking.holdRemainingMinutes || 0))
          .filter((value) => Number.isFinite(value) && value > 0)
      )
    : 0;

  return {
    unitCount: rows.length,
    bookingCount: payableBookings.length,
    totalAmountInr,
    holdActive: holdActiveEntries.length > 0,
    holdRemainingMinutes,
  };
}

function renderAdminRows(bookings) {
  elements.adminBookingTableBody.innerHTML = '';

  if (bookings.length === 0) {
    elements.adminEmptyState.hidden = false;
    return;
  }

  elements.adminEmptyState.hidden = true;

  for (const booking of bookings) {
    const tr = document.createElement('tr');
    tr.appendChild(multilineCell(`${booking.clientName}\n${booking.clientMobile || '-'}`));
    tr.appendChild(cell(booking.serviceName));
    tr.appendChild(multilineCell(formatAdminBookingDateTime(booking.bookingDate, booking.bookingTime)));
    tr.appendChild(cell(formatBookingCreatedAtIndia(booking.createdAt)));
    tr.appendChild(statusCell(booking.status));
    tr.appendChild(paymentCell(booking.paymentStatus || 'unpaid'));

    const actionCell = document.createElement('td');
    const actions = document.createElement('div');
    actions.className = 'action-row';

    if ((booking.paymentStatus || 'unpaid') !== 'paid' && booking.status !== 'cancelled') {
      actions.append(createActionButton('Copy Payment Link', () => copyBookingPaymentLink(booking.id)));
    }
    if ((booking.paymentStatus || 'unpaid') === 'paid') {
      actions.append(createActionButton('Invoice', () => openBookingInvoice(booking.id)));
    }

    actions.append(
      createActionButton('Confirm', () => changeStatus(booking.id, 'confirmed')),
      createActionButton('Complete', () => changeStatus(booking.id, 'completed')),
      createActionButton('Cancel', () => changeStatus(booking.id, 'cancelled'))
    );
    actions.append(createActionButton('Notes', () => openBookingNotesDialog(booking.id)));

    actionCell.appendChild(actions);
    tr.appendChild(actionCell);
    elements.adminBookingTableBody.appendChild(tr);
  }
}

function renderAdminMembershipOrders() {
  if (!elements.adminMembershipOrdersList || !elements.adminMembershipEmptyState) return;

  elements.adminMembershipOrdersList.innerHTML = '';
  const paidOrders = getFilteredAdminMembershipOrders();
  if (!paidOrders.length) {
    elements.adminMembershipEmptyState.hidden = false;
    return;
  }

  elements.adminMembershipEmptyState.hidden = true;
  
  // Sort by most recent first
  const sorted = [...paidOrders].sort((a, b) => {
    const dateA = new Date(a.paidAt || a.createdAt || 0).getTime();
    const dateB = new Date(b.paidAt || b.createdAt || 0).getTime();
    return dateB - dateA;
  });

  for (const order of sorted) {
    const circle = document.createElement('button');
    circle.type = 'button';
    circle.className = 'admin-membership-circle';
    circle.innerHTML = `
      <div class="admin-membership-circle-name">${escapeHtml(order.userName || 'User')}</div>
      <div class="admin-membership-circle-id">ID: ${escapeHtml(String(order.userId || '-').slice(0, 8))}</div>
    `;
    circle.addEventListener('click', () => {
      openMembershipDetailsModal(order);
    });
    elements.adminMembershipOrdersList.appendChild(circle);
  }
}

function openMembershipDetailsModal(order) {
  if (!elements.membershipDialog) return;
  
  const amountInr = Math.round(Number(order.amountPaise || 0) / 100);
  const memberDetails = Array.isArray(order.memberDetails) ? order.memberDetails : [];
  
  if (elements.membershipDialogTitle) {
    elements.membershipDialogTitle.textContent = `${escapeHtml(order.userName || 'Membership')} Details`;
  }

  const content = document.querySelector('.membership-dialog-content');
  if (content) {
    content.innerHTML = `
      <div class="admin-membership-modal-head">
        <div>
          <h3>${escapeHtml(getMembershipPlanDisplayName(order.planId))}</h3>
          <p>${escapeHtml(order.userEmail || '-')} • ${escapeHtml(order.userMobile || '-')}</p>
        </div>
        <span class="status-chip payment-${escapeHtml(String(order.status || 'created').toLowerCase())}">${escapeHtml(
          String(order.status || 'created')
        )}</span>
      </div>
      <div class="admin-membership-modal-meta">
        <div>
          <strong>People</strong>
          <span>${escapeHtml(String(order.peopleCount || 0))}</span>
        </div>
        <div>
          <strong>Amount</strong>
          <span>Rs. ${amountInr.toLocaleString('en-IN')}</span>
        </div>
        <div>
          <strong>Created</strong>
          <span>${escapeHtml(formatDateOnly(order.createdAt))}</span>
        </div>
        <div>
          <strong>Paid</strong>
          <span>${order.paidAt ? escapeHtml(formatDateOnly(order.paidAt)) : '-'}</span>
        </div>
      </div>
      <div class="admin-membership-modal-members">
        <h4>Covered Persons</h4>
        ${
          !memberDetails.length
            ? '<p class="empty-state">No person details saved.</p>'
            : memberDetails
                .map(
                  (member, idx) => `
          <div class="admin-member-detail">
            <div><strong>Person ${idx + 1}</strong></div>
            <div><strong>Name:</strong> ${escapeHtml(member?.name || '-')}</div>
            <div><strong>Place:</strong> ${escapeHtml(member?.place || '-')}</div>
            <div><strong>Email:</strong> ${escapeHtml(member?.email || '-')}</div>
            <div><strong>Contact:</strong> ${escapeHtml(member?.contactNumber || '-')}</div>
          </div>
        `
                )
                .join('')
        }
      </div>
    `;
  }

  const actions = document.querySelector('.membership-dialog-actions');
  if (actions) {
    actions.innerHTML = '';
    const invoiceBtn = createActionButton('View Invoice', () => openMembershipInvoice(order.orderId));
    actions.appendChild(invoiceBtn);
  }

  elements.membershipDialog.showModal();
}

function renderAdminDiscountPhones() {
  if (!elements.adminDiscountList || !elements.adminDiscountEmptyState) return;

  elements.adminDiscountList.innerHTML = '';
  const items = Array.isArray(state.adminDiscountPhones) ? state.adminDiscountPhones : [];
  if (!items.length) {
    elements.adminDiscountEmptyState.hidden = false;
    return;
  }

  elements.adminDiscountEmptyState.hidden = true;
  items.forEach((item) => {
    const row = document.createElement('article');
    row.className = 'admin-discount-card';
    row.innerHTML = `
      <div>
        <h3>${escapeHtml(item.phoneDisplay || item.phoneKey || '-')}</h3>
        <p>${escapeHtml(String(item.discountPercent || 0))}% service discount</p>
      </div>
    `;
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn btn-secondary';
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', async () => {
      await deleteAdminDiscountPhone(item.id);
    });
    row.appendChild(removeBtn);
    elements.adminDiscountList.appendChild(row);
  });
}

function findAdminUserByContact(email, phone) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPhone = String(phone || '').trim();
  if (!normalizedEmail && !normalizedPhone) return null;
  return (Array.isArray(state.adminUsers) ? state.adminUsers : []).find((user) => {
    const userEmail = String(user.email || '').trim().toLowerCase();
    const userPhone = String(user.mobile || '').trim();
    if (normalizedEmail && userEmail === normalizedEmail) return true;
    if (normalizedPhone && userPhone === normalizedPhone) return true;
    return false;
  });
}

function getSelectedDiscountUsers() {
  return Array.isArray(state.adminDiscountSelectedUsers) ? state.adminDiscountSelectedUsers : [];
}

function addSelectedDiscountUser(user) {
  if (!user || !user.id) return;
  const selected = getSelectedDiscountUsers();
  if (selected.some((item) => String(item.id) === String(user.id))) return;
  state.adminDiscountSelectedUsers = [...selected, user];
  render();
}

function removeSelectedDiscountUser(userId) {
  const normalizedId = String(userId);
  state.adminDiscountSelectedUsers = getSelectedDiscountUsers().filter(
    (user) => String(user.id) !== normalizedId
  );
  if (!state.adminDiscountSelectedUsers.length) {
    state.adminDiscountSelectedWindowOpen = false;
  }
  render();
}

function scheduleAdminDiscountSearch(query) {
  clearTimeout(adminDiscountSearchTimer);
  const trimmed = String(query || '').trim();
  if (!trimmed) {
    state.adminDiscountSearchLoading = false;
    state.adminDiscountSearchResults = [];
    render();
    return;
  }
  state.adminDiscountSearchLoading = true;
  render();
  adminDiscountSearchTimer = window.setTimeout(() => {
    fetchAdminDiscountUsers(trimmed);
  }, 300);
}

async function fetchAdminDiscountUsers(query) {
  const trimmed = String(query || '').trim();
  try {
    const result = await api(`/api/admin/users?search=${encodeURIComponent(trimmed)}`);
    state.adminDiscountSearchResults = result.users || [];
  } catch {
    state.adminDiscountSearchResults = [];
  } finally {
    state.adminDiscountSearchLoading = false;
    render();
  }
}

function renderAdminDiscountUsers() {
  if (
    !elements.adminDiscountPanel ||
    !elements.adminDiscountUserResults ||
    !elements.adminDiscountUsersEmpty
  ) {
    return;
  }

  if (elements.adminDiscountGateMessage) {
    if (state.adminDiscountUnlocked && !elements.adminDiscountGateMessage.textContent) {
      elements.adminDiscountGateMessage.textContent = 'Discounts unlocked for this session.';
    }
    elements.adminDiscountGateMessage.hidden = !state.adminDiscountUnlocked;
  }

  elements.adminDiscountPanel.hidden = !state.adminDiscountUnlocked;
  if (!state.adminDiscountUnlocked) {
    elements.adminDiscountUserResults.innerHTML = '';
    elements.adminDiscountUsersEmpty.hidden = true;
    state.adminDiscountSelectedWindowOpen = false;
    if (elements.adminDiscountSelectedWindow) elements.adminDiscountSelectedWindow.hidden = true;
    return;
  }

  if (elements.adminDiscountDropdown) {
    elements.adminDiscountDropdown.hidden = !state.adminDiscountDropdownOpen;
    elements.adminDiscountDropdown.classList.toggle('is-open', state.adminDiscountDropdownOpen);
  }

  if (elements.adminDiscountSelectedCount) {
    const count = getSelectedDiscountUsers().length;
    elements.adminDiscountSelectedCount.textContent = `${count} selected`;
  }
  renderAdminSelectedDiscountUsers();

  const users = Array.isArray(state.adminDiscountSearchResults) ? state.adminDiscountSearchResults : [];
  elements.adminDiscountUserResults.innerHTML = '';
  if (!state.adminDiscountDropdownOpen) {
    elements.adminDiscountUsersEmpty.hidden = true;
    return;
  }

  if (state.adminDiscountSearchLoading) {
    const emptyTextEl = elements.adminDiscountUsersEmpty.querySelector('p');
    if (emptyTextEl) emptyTextEl.textContent = 'Searching...';
    elements.adminDiscountUsersEmpty.hidden = false;
    return;
  }

  const trimmedQuery = String(state.adminDiscountSearch || '').trim();
  if (!users.length) {
    const emptyText = trimmedQuery
      ? 'No users found.'
      : 'Type to search users.';
    const emptyTextEl = elements.adminDiscountUsersEmpty.querySelector('p');
    if (emptyTextEl) emptyTextEl.textContent = emptyText;
    elements.adminDiscountUsersEmpty.hidden = false;
  } else {
    elements.adminDiscountUsersEmpty.hidden = true;
    users.forEach((user) => {
      const row = document.createElement('div');
      row.className = 'admin-discount-result-row';

      const main = document.createElement('div');
      main.className = 'admin-discount-result-main';

      const left = document.createElement('div');
      left.className = 'admin-discount-result-left';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = getSelectedDiscountUsers().some((item) => String(item.id) === String(user.id));
      checkbox.addEventListener('change', (event) => {
        if (event.target.checked) {
          addSelectedDiscountUser(user);
        } else {
          removeSelectedDiscountUser(user.id);
        }
      });
      const info = document.createElement('div');
      info.className = 'admin-discount-result-info';
      const membershipStatus = String(user.membershipStatus || 'inactive').toLowerCase();
      const isMember = membershipStatus === 'active';
      const statusLabel = isMember ? 'Member' : 'User';
      const email = user.email || 'no-email';
      const phone = user.mobile || 'no-phone';
      info.innerHTML = `
        <strong>${escapeHtml(user.name || 'User')}</strong>
        <span>${escapeHtml(email)} • ${escapeHtml(phone)}</span>
        <span>${escapeHtml(statusLabel)}</span>
      `;
      left.append(checkbox, info);

      const statusChip = document.createElement('span');
      statusChip.className = `status-chip ${isMember ? 'status-paid' : 'status-pending'}`;
      statusChip.textContent = statusLabel;

      main.append(left, statusChip);
      row.appendChild(main);

      elements.adminDiscountUserResults.appendChild(row);
    });
  }
}

async function applyAdminDiscountToSelected() {
  const selectedUsers = getSelectedDiscountUsers();
  if (!selectedUsers.length) {
    alert('Select at least one user to apply a discount.');
    return;
  }
  const percent = Number(elements.adminDiscountBulkPercent?.value || 0);
  if (!Number.isFinite(percent) || percent <= 0 || percent > 100) {
    alert('Enter a valid discount percentage between 1 and 100.');
    return;
  }

  const failures = [];
  for (const user of selectedUsers) {
    const email = String(user.email || '').trim().toLowerCase();
    const phone = String(user.mobile || '').trim();
    if (!phone) {
      failures.push(user.name || `User ${user.id}`);
      continue;
    }
    try {
      await applyAdminUserDiscountRaw({ userId: user.id, email, phone, discountPercent: percent });
    } catch {
      failures.push(user.name || `User ${user.id}`);
    }
  }

  await loadDashboardData();
  await fetchAdminDiscountUsers(state.adminDiscountSearch);
  state.adminDiscountSelectedUsers = [];
  state.adminDiscountSelectedWindowOpen = false;
  if (failures.length) {
    alert(`Discount applied with some issues. Could not apply for: ${failures.join(', ')}.`);
    render();
    return;
  }
  render();
}

function renderAdminSelectedDiscountUsers() {
  if (
    !elements.adminDiscountSelectedBtn ||
    !elements.adminDiscountSelectedWindow ||
    !elements.adminDiscountSelectedWindowCount ||
    !elements.adminDiscountSelectedList
  ) {
    return;
  }

  const selectedUsers = getSelectedDiscountUsers();
  const count = selectedUsers.length;
  elements.adminDiscountSelectedBtn.textContent = count ? `Selected (${count})` : 'Selected';
  elements.adminDiscountSelectedBtn.disabled = !count;
  elements.adminDiscountSelectedWindowCount.textContent = `${count} selected`;
  elements.adminDiscountSelectedWindow.hidden = !state.adminDiscountSelectedWindowOpen || !count;
  elements.adminDiscountSelectedList.innerHTML = '';

  if (!count) {
    state.adminDiscountSelectedWindowOpen = false;
    return;
  }

  selectedUsers.forEach((user) => {
    const row = document.createElement('div');
    row.className = 'admin-discount-selected-row';

    const main = document.createElement('div');
    main.className = 'admin-discount-selected-main';

    const left = document.createElement('div');
    left.className = 'admin-discount-selected-left';

    const info = document.createElement('div');
    info.className = 'admin-discount-selected-info';
    const membershipStatus = String(user.membershipStatus || 'inactive').toLowerCase();
    const isMember = membershipStatus === 'active';
    const statusLabel = isMember ? 'Member' : 'User';
    const email = user.email || 'no-email';
    const phone = user.mobile || 'no-phone';
    info.innerHTML = `
      <strong>${escapeHtml(user.name || 'User')}</strong>
      <span>${escapeHtml(email)}</span>
      <span>${escapeHtml(phone)}</span>
      <span>${escapeHtml(statusLabel)}</span>
    `;

    left.appendChild(info);

    const actions = document.createElement('div');
    actions.className = 'admin-discount-selected-actions';

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn btn-secondary';
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', () => {
      removeSelectedDiscountUser(user.id);
    });

    actions.appendChild(removeBtn);
    main.append(left, actions);
    row.appendChild(main);
    elements.adminDiscountSelectedList.appendChild(row);
  });
}

async function applyAdminUserDiscountRaw({ userId, email, phone, discountPercent }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPhone = String(phone || '').trim();
  const percent = Number(discountPercent || 0);

  if (!normalizedPhone) {
    throw new Error('Add a phone number to apply a discount.');
  }
  if (!Number.isFinite(percent) || percent <= 0 || percent > 100) {
    throw new Error('Enter a valid discount percentage between 1 and 100.');
  }

  if (normalizedEmail) {
    await api(`/api/admin/users/${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalizedEmail, mobile: normalizedPhone }),
    });
  }
  await api('/api/admin/discount-phones', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: normalizedPhone, discountPercent: percent }),
  });
}

async function applyAdminUserDiscount({ userId, email, phone, discountPercent }) {
  try {
    await applyAdminUserDiscountRaw({ userId, email, phone, discountPercent });
    await loadDashboardData();
    render();
  } catch (error) {
    alert(error.message || 'Unable to apply discount.');
  }
}

async function saveAdminDiscountPhone() {
  const phone = String(elements.adminDiscountPhone?.value || '').trim();
  const discountPercent = Number(elements.adminDiscountPercent?.value || 0);
  if (!phone || !Number.isFinite(discountPercent) || discountPercent <= 0) {
    alert('Enter a valid phone number and discount percentage.');
    return;
  }

  const originalLabel = elements.adminDiscountSubmitBtn?.textContent || 'Add Discount';
  if (elements.adminDiscountSubmitBtn) {
    elements.adminDiscountSubmitBtn.disabled = true;
    elements.adminDiscountSubmitBtn.textContent = 'Saving...';
  }
  try {
    await api('/api/admin/discount-phones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, discountPercent }),
    });
    if (elements.adminDiscountPhone) elements.adminDiscountPhone.value = '';
    if (elements.adminDiscountPercent) elements.adminDiscountPercent.value = '';
    await loadDashboardData();
    render();
  } finally {
    if (elements.adminDiscountSubmitBtn) {
      elements.adminDiscountSubmitBtn.disabled = false;
      elements.adminDiscountSubmitBtn.textContent = originalLabel;
    }
  }
  if (state.user?.role !== 'admin') {
    state.adminUsers = [];
  }
}

async function deleteAdminDiscountPhone(discountId) {
  const ok = confirm('Remove this discount phone number?');
  if (!ok) return;
  await api(`/api/admin/discount-phones/${encodeURIComponent(discountId)}`, { method: 'DELETE' });
  await loadDashboardData();
  render();
}

function generateAdminCouponCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const size = 8;
  let suffix = '';
  if (window.crypto?.getRandomValues) {
    const bytes = new Uint8Array(size);
    window.crypto.getRandomValues(bytes);
    suffix = Array.from(bytes)
      .map((value) => alphabet[value % alphabet.length])
      .join('');
  } else {
    for (let i = 0; i < size; i += 1) {
      suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
  }
  return `H2-${suffix}`;
}

function isLikelyEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function renderAdminCoupons() {
  if (!elements.adminCouponList || !elements.adminCouponEmptyState) return;

  elements.adminCouponList.innerHTML = '';
  const items = Array.isArray(state.adminCoupons) ? state.adminCoupons : [];
  if (!items.length) {
    elements.adminCouponEmptyState.hidden = false;
    return;
  }

  elements.adminCouponEmptyState.hidden = true;
  items.forEach((item) => {
    const row = document.createElement('article');
    row.className = 'admin-discount-card';
    const discountLabel =
      item.discountType === 'flat'
        ? `Rs. ${Number(item.discountValue || 0).toLocaleString('en-IN')} off`
        : `${Number(item.discountValue || 0)}% off`;
    const maxRedemptions = item.maxRedemptions == null ? '∞' : String(item.maxRedemptions);
    const expiresText = item.expiresAt ? formatDateOnly(item.expiresAt) : 'No expiry';
    const recipientLabel = item.recipientEmail
      ? `${item.recipientName ? `${item.recipientName} • ` : ''}${item.recipientEmail}`
      : 'No recipient';
    const emailStatus = item.emailStatus ? item.emailStatus.toUpperCase() : 'N/A';
    const emailedAtText = item.emailedAt ? formatDateOnly(item.emailedAt) : '-';
    row.innerHTML = `
      <div>
        <h3>${escapeHtml(item.code || '-')}</h3>
        <p>${escapeHtml(discountLabel)}</p>
        ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ''}
        <p>Recipient: ${escapeHtml(recipientLabel)}</p>
        <p>Email: ${escapeHtml(emailStatus)} • Last sent: ${escapeHtml(emailedAtText)}</p>
        ${item.emailStatus === 'failed' && item.emailError ? `<p>${escapeHtml(item.emailError)}</p>` : ''}
        <p>Uses: ${escapeHtml(String(item.totalRedemptions || 0))}/${escapeHtml(maxRedemptions)}</p>
        <p>Expires: ${escapeHtml(expiresText)}</p>
      </div>
    `;

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'btn btn-secondary';
    copyBtn.textContent = 'Copy';
    copyBtn.addEventListener('click', () => {
      copyTextToClipboard(item.code || '');
      alert('Coupon code copied.');
    });

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn btn-secondary';
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', async () => {
      await deleteAdminCoupon(item.id);
    });

    const resendBtn = document.createElement('button');
    resendBtn.type = 'button';
    resendBtn.className = 'btn btn-secondary';
    resendBtn.textContent = item.emailStatus === 'sent' ? 'Resend' : 'Send';
    resendBtn.disabled = !item.recipientEmail;
    resendBtn.addEventListener('click', async () => {
      await resendAdminCoupon(item.id);
    });

    row.appendChild(copyBtn);
    row.appendChild(resendBtn);
    row.appendChild(removeBtn);
    elements.adminCouponList.appendChild(row);
  });
}

async function saveAdminCoupon({ sendEmail = true } = {}) {
  const recipientEmail = String(elements.adminCouponRecipientEmail?.value || '').trim();
  let code = String(elements.adminCouponCode?.value || '').trim().toUpperCase();
  const description = String(elements.adminCouponDescription?.value || '').trim();
  const discountValue = Number(elements.adminCouponValue?.value || 0);
  const appliesTo = 'all';
  const expiresAt = String(elements.adminCouponExpiresAt?.value || '').trim();

  if (recipientEmail && !isLikelyEmail(recipientEmail)) {
    alert('Enter a valid recipient email.');
    return;
  }
  if (sendEmail && !recipientEmail) {
    alert('Recipient email is required to send a coupon.');
    return;
  }
  if (!Number.isFinite(discountValue) || discountValue <= 0 || discountValue > 100) {
    alert('Enter a valid discount percentage between 1 and 100.');
    return;
  }
  if (!code) {
    code = generateAdminCouponCode();
    if (elements.adminCouponCode) {
      elements.adminCouponCode.value = code;
    }
  }

  const originalLabel = elements.adminCouponSubmitBtn?.textContent || 'Generate & Send';
  const saveOnlyLabel = elements.adminCouponSaveOnlyBtn?.textContent || 'Save Only';
  if (elements.adminCouponSubmitBtn) {
    elements.adminCouponSubmitBtn.disabled = true;
    elements.adminCouponSubmitBtn.textContent = sendEmail ? 'Sending...' : originalLabel;
  }
  if (elements.adminCouponSaveOnlyBtn) {
    elements.adminCouponSaveOnlyBtn.disabled = true;
    elements.adminCouponSaveOnlyBtn.textContent = sendEmail ? saveOnlyLabel : 'Saving...';
  }

  try {
    const result = await api('/api/admin/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        description,
        discountType: 'percent',
        discountValue,
        appliesTo,
        maxRedemptions: 1,
        expiresAt,
        recipientEmail,
        singleUse: true,
        sendEmail,
      }),
    });

    if (elements.adminCouponCode) elements.adminCouponCode.value = '';
    if (elements.adminCouponDescription) elements.adminCouponDescription.value = '';
    if (elements.adminCouponValue) elements.adminCouponValue.value = '';
    if (elements.adminCouponExpiresAt) elements.adminCouponExpiresAt.value = '';
    if (elements.adminCouponRecipientEmail) elements.adminCouponRecipientEmail.value = '';

    await loadDashboardData();
    render();

    const sentCode = result.code || code;
    if (!sendEmail) {
      alert(`Coupon ${sentCode} saved.`);
    } else if (result.emailStatus === 'failed') {
      alert(`Coupon ${sentCode} was created, but the email could not be sent. ${result.emailMessage || ''}`.trim());
    } else {
      alert(`Coupon ${sentCode} sent to ${recipientEmail}.`);
    }
  } finally {
    if (elements.adminCouponSubmitBtn) {
      elements.adminCouponSubmitBtn.disabled = false;
      elements.adminCouponSubmitBtn.textContent = originalLabel;
    }
    if (elements.adminCouponSaveOnlyBtn) {
      elements.adminCouponSaveOnlyBtn.disabled = false;
      elements.adminCouponSaveOnlyBtn.textContent = saveOnlyLabel;
    }
  }
}

async function deleteAdminCoupon(couponId) {
  const ok = confirm('Remove this coupon?');
  if (!ok) return;
  await api(`/api/admin/coupons/${encodeURIComponent(couponId)}`, { method: 'DELETE' });
  await loadDashboardData();
  render();
}

async function resendAdminCoupon(couponId) {
  const ok = confirm('Resend this coupon email?');
  if (!ok) return;
  await api(`/api/admin/coupons/${encodeURIComponent(couponId)}/resend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  await loadDashboardData();
  render();
  alert('Coupon email sent.');
}

function cell(content) {
  const td = document.createElement('td');
  td.textContent = content;
  return td;
}

function multilineCell(content) {
  const td = cell(content);
  td.style.whiteSpace = 'pre-line';
  return td;
}

function userBookingServiceCell(row) {
  const td = document.createElement('td');
  const wrap = document.createElement('div');
  wrap.className = 'booking-service-block';

  const title = document.createElement('div');
  title.className = 'booking-service-title';
  title.textContent = row.serviceTitle || row.serviceText || '-';
  wrap.appendChild(title);

  const metaLines = Array.isArray(row.serviceMetaLines) ? row.serviceMetaLines : [];
  for (const line of metaLines) {
    const text = typeof line === 'object' && line !== null
      ? String(line.text || '').trim()
      : String(line || '').trim();
    if (!text) continue;
    const meta = document.createElement('div');
    meta.className = 'booking-service-meta';
    if (typeof line === 'object' && line !== null && line.tone) {
      meta.classList.add(`is-${String(line.tone).trim()}`);
    }
    meta.textContent = text;
    wrap.appendChild(meta);
  }

  if (Array.isArray(row.detailSections) && row.detailSections.length) {
    const details = document.createElement('details');
    details.className = 'booking-details-toggle';
    const summary = document.createElement('summary');
    summary.textContent = 'View Details';
    details.appendChild(summary);

    for (const section of row.detailSections) {
      const lines = Array.isArray(section?.lines) ? section.lines.filter(Boolean) : [];
      if (!lines.length) continue;
      const block = document.createElement('div');
      block.className = 'booking-details-section';

      const heading = document.createElement('div');
      heading.className = 'booking-details-heading';
      heading.textContent = section.title || 'Details';
      block.appendChild(heading);

      for (const line of lines) {
        const item = document.createElement('div');
        item.className = 'booking-details-line';
        item.textContent = String(line || '').trim();
        block.appendChild(item);
      }

      details.appendChild(block);
    }

    wrap.appendChild(details);
  }

  td.appendChild(wrap);
  return td;
}

function userBookingScheduleCell(row) {
  const td = document.createElement('td');
  const wrap = document.createElement('div');
  wrap.className = 'booking-schedule-block';

  const scheduleLines = Array.isArray(row.scheduleLines) ? row.scheduleLines : [row.dateTimeText || '-'];
  for (const line of scheduleLines) {
    const text = String(line || '').trim();
    if (!text) continue;
    const item = document.createElement('div');
    item.className = 'booking-schedule-line';
    item.textContent = text;
    wrap.appendChild(item);
  }

  td.appendChild(wrap);
  return td;
}

function getBookingCategory(serviceName) {
  const normalized = String(serviceName || '').trim().toLowerCase();
  const matched = state.services.find((service) => String(service.name || '').trim().toLowerCase() === normalized);
  const category = String(matched?.category || '').toUpperCase();
  if (category === 'HYDROGEN SESSION') return 'HYDROGEN SESSION';
  if (category === 'MEMBERSHIP SERVICES') return 'MEMBERSHIP SERVICES';
  if (category === 'IV THERAPIES' || category === 'IV SHOTS') return 'IV ADD-ON';
  if (normalized.includes('hydrogen') || normalized.startsWith('h2 ')) return 'HYDROGEN SESSION';
  return '';
}

function getBookingCategoryLabel(serviceName) {
  const category = getBookingCategory(serviceName);
  if (category === 'HYDROGEN SESSION') return 'Hydrogen Session';
  if (category === 'IV ADD-ON') return 'IV Therapy / IV Shot';
  if (category === 'MEMBERSHIP SERVICES') return 'Membership Service';
  return 'Service Booking';
}

function getServiceCatalogEntry(serviceName) {
  const normalized = String(serviceName || '').trim().toLowerCase();
  return state.services.find((service) => String(service.name || '').trim().toLowerCase() === normalized) || null;
}

function getDisplayedServicePriceInr(serviceName) {
  const service = getServiceCatalogEntry(serviceName);
  return Number(service?.effectivePriceInr ?? service?.priceInr ?? 0);
}

function normalizeDiscountPhoneKey(phone) {
  const digits = String(phone || '').replace(/\D+/g, '');
  if (digits.length < 7) return '';
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function getAdminDiscountRecordForPhone(phone) {
  const phoneKey = normalizeDiscountPhoneKey(phone);
  if (!phoneKey) return null;
  return (Array.isArray(state.adminDiscountPhones) ? state.adminDiscountPhones : []).find(
    (item) => item.phoneKey === phoneKey
  ) || null;
}

function getCurrentContextBookings() {
  if (state.user?.role === 'admin') {
    if (!state.adminResolvedCustomer?.id) return [];
    return state.bookings.filter((booking) => String(booking.userId) === String(state.adminResolvedCustomer.id));
  }
  return state.bookings;
}

function getIvCooldownAlertMessage(conflict) {
  return `An IV Therapy/IV Shot can be booked again only after 2 weeks. Existing IV booking found on ${conflict?.bookingDate}. Reach out to us to book if you still want this.`;
}

function findIvCooldownConflictClient(serviceName, bookingDate, excludeBookingId = '', excludeGroupId = '') {
  if (state.user?.role !== 'user') return null;
  if (getBookingCategory(serviceName) !== 'IV ADD-ON') return null;
  const targetDate = new Date(`${String(bookingDate || '').trim()}T00:00:00`).getTime();
  if (Number.isNaN(targetDate)) return null;

  return getCurrentContextBookings().find((booking) => {
    if (booking.status === 'cancelled') return false;
    if (booking.holdExpired) return false;
    if (excludeBookingId && String(booking.id) === String(excludeBookingId)) return false;
    if (excludeGroupId && String(booking.bookingGroupId || '') === String(excludeGroupId)) return false;
    if (getBookingCategory(booking.serviceName) !== 'IV ADD-ON') return false;
    const existingDate = new Date(`${booking.bookingDate}T00:00:00`).getTime();
    if (Number.isNaN(existingDate)) return false;
    const diffDays = Math.abs(Math.round((existingDate - targetDate) / 86400000));
    return diffDays < IV_REBOOK_COOLDOWN_DAYS;
  }) || null;
}

function findHydrogenDailyLimitConflictClient(slots = [], excludeGroupId = '') {
  if (state.user?.role !== 'user') return null;

  const existingByDate = new Map();
  getCurrentContextBookings().forEach((booking) => {
    if (booking.status === 'cancelled') return;
    if (booking.holdExpired) return;
    if (excludeGroupId && booking.bookingGroupId === excludeGroupId) return;
    if (getBookingCategory(booking.serviceName) !== 'HYDROGEN SESSION') return;
    existingByDate.set(booking.bookingDate, Number(existingByDate.get(booking.bookingDate) || 0) + 1);
  });

  const requestedByDate = new Map();
  (Array.isArray(slots) ? slots : []).forEach((slot) => {
    const bookingDate = String(slot?.bookingDate || '').trim();
    if (!bookingDate) return;
    requestedByDate.set(bookingDate, Number(requestedByDate.get(bookingDate) || 0) + 1);
  });

  for (const [bookingDate, requestedTotal] of requestedByDate.entries()) {
    const existingTotal = Number(existingByDate.get(bookingDate) || 0);
    if (existingTotal + requestedTotal > MAX_HYDROGEN_SESSIONS_PER_DAY_PER_USER) {
      return { bookingDate, existingTotal, requestedTotal };
    }
  }

  return null;
}

function hasHydrogenPackageAddOnOnDateClient(bookingDate, excludeGroupId = '') {
  const targetDate = String(bookingDate || '').trim();
  if (!targetDate) return false;

  return getCurrentContextBookings().some((booking) => {
    if (booking.bookingDate !== targetDate) return false;
    if (!booking.bookingGroupId) return false;
    if (excludeGroupId && booking.bookingGroupId === excludeGroupId) return false;
    if (booking.status === 'cancelled') return false;
    if (booking.holdExpired) return false;
    return getBookingCategory(booking.serviceName) === 'IV ADD-ON';
  });
}

function hasStandaloneIvOnDateClient(bookingDate, excludeGroupId = '') {
  const targetDate = String(bookingDate || '').trim();
  if (!targetDate) return false;

  return getCurrentContextBookings().some((booking) => {
    if (booking.bookingDate !== targetDate) return false;
    if (booking.status === 'cancelled') return false;
    if (booking.holdExpired) return false;
    if (excludeGroupId && booking.bookingGroupId === excludeGroupId) return false;
    if (booking.bookingGroupId) return false;
    return getBookingCategory(booking.serviceName) === 'IV ADD-ON';
  });
}

function getHydrogenGroupBreakdown(hydrogenEntries, addOnEntries) {
  const baseServiceName = hydrogenEntries[0]?.serviceName || '';
  const packageSessions = getHydrogenSessionCountFromServiceName(baseServiceName);
  const extraSessions = Math.max(0, hydrogenEntries.length - packageSessions);
  const singleSessionService =
    state.services.find(
      (service) =>
        String(service.category || '').toUpperCase() === 'HYDROGEN SESSION' &&
        getHydrogenSessionCountFromServiceName(service.name) === 1
    ) || null;
  const basePriceInr = getDisplayedServicePriceInr(baseServiceName);
  const extraSessionPriceInr = Number(singleSessionService?.effectivePriceInr ?? singleSessionService?.priceInr ?? 0);
  const addOnParts = addOnEntries.map((entry) => ({
    label: entry.serviceName,
    amountInr: getDisplayedServicePriceInr(entry.serviceName),
  }));
  const breakdownParts = [];
  if (basePriceInr > 0) {
    breakdownParts.push(`${baseServiceName} Rs. ${basePriceInr.toLocaleString('en-IN')}`);
  }
  if (extraSessions > 0 && extraSessionPriceInr > 0) {
    breakdownParts.push(`${extraSessions} extra session${extraSessions === 1 ? '' : 's'} Rs. ${(extraSessions * extraSessionPriceInr).toLocaleString('en-IN')}`);
  }
  addOnParts.forEach((item) => {
    if (item.amountInr > 0) {
      breakdownParts.push(`${item.label} Rs. ${item.amountInr.toLocaleString('en-IN')}`);
    }
  });

  const totalAmountInr =
    basePriceInr +
    extraSessions * extraSessionPriceInr +
    addOnParts.reduce((sum, item) => sum + Number(item.amountInr || 0), 0);

  return {
    breakdownText: breakdownParts.join(' + '),
    totalAmountInr,
  };
}

function summarizeGroupStatus(bookings) {
  const statuses = bookings.map((booking) => String(booking.status || '').toLowerCase());
  if (statuses.every((status) => status === 'cancelled')) return 'cancelled';
  if (statuses.some((status) => status === 'pending')) return 'pending';
  if (statuses.some((status) => status === 'booked')) return 'booked';
  if (statuses.some((status) => status === 'confirmed')) return 'confirmed';
  if (statuses.some((status) => status === 'completed')) return 'completed';
  return statuses[0] || 'pending';
}

function summarizeGroupPaymentStatus(bookings) {
  const paymentStatuses = bookings.map((booking) => String(booking.paymentStatus || 'unpaid').toLowerCase());
  if (paymentStatuses.every((status) => status === 'paid')) return 'paid';
  if (paymentStatuses.some((status) => status === 'payment_pending')) return 'payment_pending';
  return 'unpaid';
}

function statusCell(status) {
  const td = document.createElement('td');
  td.innerHTML = `<span class="status-chip status-${status}">${status}</span>`;
  return td;
}

function paymentCell(paymentStatus) {
  const td = document.createElement('td');
  td.innerHTML = `<span class="status-chip payment-${paymentStatus}">${paymentStatus}</span>`;
  return td;
}

function createActionButton(label, onClick) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'action-btn';
  button.textContent = label;
  button.addEventListener('click', async () => {
    try {
      await onClick();
    } catch (error) {
      alert(error.message || 'Action failed');
    }
  });
  return button;
}

function createDangerButton(label, onClick) {
  const button = createActionButton(label, onClick);
  button.classList.add('danger');
  return button;
}

function copyTextToClipboard(value) {
  const text = String(value || '').trim();
  if (!text) return;
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => {});
  }
}

function openPortalDocument(url) {
  const targetUrl = url.startsWith('http') ? url : `${API_URL}${url}`;
  const popup = window.open(targetUrl, '_blank', 'noopener');
  if (!popup) {
    window.location.href = targetUrl;
  }
}

async function openBookingInvoice(bookingId) {
  const id = Number(bookingId);
  if (!Number.isInteger(id)) return;
  const result = await api(`/api/bookings/${encodeURIComponent(id)}/invoice-link`);
  if (!result?.invoiceUrl) {
    throw new Error('Invoice link could not be generated. Please refresh the page and try again.');
  }
  openPortalDocument(result.invoiceUrl);
}

async function openMembershipInvoice(orderId) {
  const normalizedOrderId = String(orderId || '').trim();
  if (!normalizedOrderId) return;
  const result = await api(`/api/membership-orders/${encodeURIComponent(normalizedOrderId)}/invoice-link`);
  if (!result?.invoiceUrl) {
    throw new Error('Invoice link could not be generated. Please refresh the page and try again.');
  }
  openPortalDocument(result.invoiceUrl);
}

function getMembershipPlanDisplayName(planId) {
  const key = String(planId || '').trim();
  const labelMap = {
    h2_single: '1 Person Membership',
    h2_two: '2 Person Membership',
    h2_four: '4 Person Membership',
    h2_add_person: 'Add Person',
  };
  return labelMap[key] || key || 'Membership';
}

function formatDateOnly(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function formatBookingDateLabel(dateISO) {
  const match = String(dateISO || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return '-';
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, monthIndex, day, 12, 0, 0);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function formatBookingTimeLabel(time24) {
  const normalized = String(time24 || '').trim();
  if (!normalized) return '-';
  const slot = SLOT_OPTIONS.find((item) => item.value === normalized);
  if (slot?.label) return slot.label;
  const match = normalized.match(/^(\d{2}):(\d{2})$/);
  if (!match) return normalized;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const date = new Date(2000, 0, 1, hours, minutes, 0);
  if (Number.isNaN(date.getTime())) return normalized;
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function formatDateTime(dateISO, time24) {
  if (!dateISO || !time24) return '-';
  return `${formatBookingDateLabel(dateISO)}, ${formatBookingTimeLabel(time24)}`;
}

function formatAdminBookingDateTime(dateISO, time24) {
  if (!dateISO || !time24) return '-';
  return `${formatBookingDateLabel(dateISO)}\n${formatBookingTimeLabel(time24)}`;
}

function formatBookingCreatedAtIndia(value) {
  if (!value) return '-';
  const raw = String(value).trim();
  const normalized = raw.replace(' ', 'T');
  const hasExplicitTimezone = /(?:Z|[+\-]\d{2}:\d{2})$/i.test(normalized);
  const parsed = Date.parse(hasExplicitTimezone ? normalized : `${normalized}Z`);
  const date = new Date(parsed);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);
}

async function api(url, options = {}) {
  const targetUrl = url.startsWith('http') ? url : `${API_URL}${url}`;
  const response = await fetch(targetUrl, {
    ...options,
  });

  if (response.status === 204) {
    return null;
  }

  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const message = data?.message || 'Request failed';
    throw new Error(message);
  }

  return data;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

