import { StyleSheet, Platform, Dimensions, StatusBar } from 'react-native';

const { width } = Dimensions.get('window');

export const DARK = {
  bg: '#16181f',       // Deeper premium background
  card: '#22252a',     // Slate-grey card background
  cardAlt: '#1c1e22',  // Alternate darker slate-grey card
  border: 'rgba(255, 255, 255, 0.08)', // Soft thin borders
  text: '#f8fafc',     // Clean slate white
  text2: '#94a3b8',    // Soft slate blue/grey description text
  accent: '#6366f1',   // Indigo Accent matching website
  teal: '#0ea5e9',     // Cyan/Teal alert color
  cyan: '#06b6d4',     // Cyber cyan
  red: '#ef4444',      // Warning red
  amber: '#f97316',    // High-risk amber
  green: '#10b981',    // Safe green
};


export const LIGHT = {
  bg: '#f8fafc',
  card: '#ffffff',
  cardAlt: '#f1f5f9',
  border: 'rgba(99, 102, 241, 0.15)',
  text: '#0f172a',
  text2: '#64748b',
  accent: '#4f46e5',
  teal: '#0d9488',
  cyan: '#0284c7',
  red: '#e11d48',
  amber: '#ea580c',
  green: '#16a34a',
};

export const createStyles = (COLORS: any) => StyleSheet.create({
  // ─────────────────────────────────────────────────────────────────────────────
  // LOGIN STYLE
  // ─────────────────────────────────────────────────────────────────────────────
  loginContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  loginScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loginMesh: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: COLORS.accent,
    opacity: 0.15,
    borderBottomLeftRadius: 100,
    borderBottomRightRadius: 100,
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
  },
  logoImage: {
    width: 140,
    height: 36,
  },
  appName: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  appSubName: {
    color: COLORS.text2,
    fontSize: 9,
    letterSpacing: 2,
    marginTop: 4,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  settingsBtnText: {
    color: COLORS.text,
    fontSize: 10,
    fontFamily: 'monospace',
  },
  settingsPanel: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.accent + '55',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  panelTitle: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 6,
  },
  panelSubtitle: {
    color: COLORS.text2,
    fontSize: 9,
    marginBottom: 12,
    lineHeight: 14,
  },
  saveHostBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  loginCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 20,
  },
  authTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 20,
  },
  authTab: {
    flex: 1,
    paddingBottom: 10,
    alignItems: 'center',
  },
  authTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.accent,
  },
  authTabLabel: {
    color: COLORS.text2,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  authTabLabelActive: {
    color: COLORS.text,
  },
  inputLabel: {
    color: COLORS.text2,
    fontSize: 9,
    letterSpacing: 1,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0c0c0e',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  authInput: {
    flex: 1,
    color: COLORS.text,
    paddingVertical: 10,
    fontSize: 13,
  },
  roleSelectionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  roleSelectBtn: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  roleSelectBtnActive: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accent + '15',
  },
  roleSelectText: {
    color: COLORS.text2,
    fontSize: 12,
    fontWeight: 'bold',
  },
  roleSelectTextActive: {
    color: COLORS.accent,
  },
  input: {
    backgroundColor: COLORS.cardAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    color: COLORS.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    marginBottom: 20,
  },
  loginBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  loginBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    letterSpacing: 1.5,
    fontSize: 12,
  },
  credsHelper: {
    width: '100%',
    maxWidth: 360,
    marginTop: 20,
    padding: 12,
    backgroundColor: COLORS.cardAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  credsTitle: {
    color: COLORS.text2,
    fontSize: 9,
    letterSpacing: 1,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  credsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  credsLabel: {
    fontSize: 8.5,
    fontWeight: 'bold',
  },
  credsText: {
    color: COLORS.text,
    fontSize: 9,
    fontFamily: 'monospace',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // MAIN VIEW STYLE
  // ─────────────────────────────────────────────────────────────────────────────
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  streamStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    color: COLORS.text2,
    fontSize: 8.5,
    letterSpacing: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userRoleText: {
    color: COLORS.text2,
    fontSize: 10,
    fontFamily: 'monospace',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    backgroundColor: COLORS.cardAlt,
  },
  logoutIcon: {
    padding: 6,
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  pageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  pageTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  liveIndicator: {
    backgroundColor: COLORS.red + '15',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.red + '35',
  },
  liveIndicatorText: {
    color: COLORS.red,
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  fetchBtn: {
    backgroundColor: COLORS.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  fetchBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  kpiContainer: {
    marginBottom: 16,
  },
  kpiCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderTopWidth: 3,
    borderRadius: 8,
    padding: 12,
    width: 145,
    marginRight: 10,
  },
  kpiHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  kpiTitle: {
    color: COLORS.text2,
    fontSize: 8.5,
    fontWeight: 'bold',
  },
  kpiIconWrapper: {
    padding: 3,
    borderRadius: 6,
  },
  kpiValue: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    marginBottom: 6,
  },
  kpiFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiTrendBadge: {
    paddingVertical: 1.5,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  kpiTrendText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  kpiSparklineWrapper: {
    width: 75,
    height: 24,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    marginBottom: 10,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyText: {
    color: COLORS.text2,
    fontSize: 11,
    textAlign: 'center',
  },
  alertCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  alertEmpId: {
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  alertMeta: {
    color: COLORS.text2,
    fontSize: 9,
  },
  alertCbsi: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  alertAmount: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    marginBottom: 6,
  },
  complaintText: {
    color: COLORS.amber,
    fontSize: 10,
    backgroundColor: COLORS.amber + '10',
    padding: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.amber + '20',
    marginVertical: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: 6,
  },
  confirmBtn: {
    backgroundColor: COLORS.red,
  },
  dismissBtn: {
    backgroundColor: '#2e3035',
  },
  disabledBtn: {
    opacity: 0.35,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },

  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
  },
  txLeft: {
    flexDirection: 'column',
  },
  txEmpId: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 12,
  },
  txMeta: {
    color: COLORS.text2,
    fontSize: 9.5,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  txCbsi: {
    fontSize: 10,
    fontWeight: 'bold',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // ROSTER STYLE
  // ─────────────────────────────────────────────────────────────────────────────
  tabContainer: {
    flex: 1,
    padding: 16,
    paddingBottom: 80,
  },
  filterCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  searchInput: {
    color: COLORS.text,
    flex: 1,
    paddingLeft: 6,
    fontSize: 12,
  },
  filtersRow: {
    flexDirection: 'row',
  },
  filterTag: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    backgroundColor: COLORS.cardAlt,
  },
  activeFilterTag: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accent + '15',
  },
  filterTagText: {
    color: COLORS.text2,
    fontSize: 8.5,
    fontWeight: 'bold',
  },
  rosterList: {
    paddingBottom: 16,
  },
  rosterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
  },
  rosterLeft: {
    flex: 1,
  },
  rosterEmpId: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  rosterMeta: {
    color: COLORS.text2,
    fontSize: 10,
    marginTop: 2,
  },
  rosterRight: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  rosterBadge: {
    borderWidth: 1,
    paddingVertical: 1.5,
    paddingHorizontal: 5,
    borderRadius: 4,
    marginBottom: 2,
  },
  rosterBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  rosterPeakText: {
    color: COLORS.text2,
    fontSize: 9,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // PROFILE STYLE
  // ─────────────────────────────────────────────────────────────────────────────
  profileSearchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  profileSearchInput: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    color: COLORS.text,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 12,
  },
  profileSearchBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    width: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileHeaderCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  profileHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileTitleText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  profileMetaText: {
    color: COLORS.text2,
    fontSize: 10,
    marginTop: 1,
  },
  profileRiskBadge: {
    borderWidth: 1,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  profileRiskBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  profileHistoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 10,
    paddingTop: 8,
  },
  profileHistoryLabel: {
    color: COLORS.text2,
    fontSize: 8.5,
    fontWeight: 'bold',
  },
  profileHistoryValue: {
    color: COLORS.teal,
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  gnnWarningBanner: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    backgroundColor: COLORS.red + '15',
    borderWidth: 1,
    borderColor: COLORS.red + '40',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  gnnWarningTitle: {
    color: COLORS.red,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  gnnWarningText: {
    color: COLORS.text2,
    fontSize: 9,
    lineHeight: 12,
    marginTop: 2,
  },
  profileTabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 12,
  },
  profileTabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  activeProfileTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.accent,
  },
  profileTabButtonText: {
    color: COLORS.text,
    fontSize: 10.5,
    fontWeight: 'bold',
  },
  subtabContent: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
  },
  subtabHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  subtabTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: 'bold',
  },
  playbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  playbackBtnText: {
    color: '#fff',
    fontSize: 8.5,
    fontWeight: 'bold',
  },
  subtabSubtitle: {
    color: COLORS.text2,
    fontSize: 10.5,
    marginBottom: 12,
    lineHeight: 14,
  },
  emptySubText: {
    color: COLORS.text2,
    fontSize: 11,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  timelineItem: {
    borderLeftWidth: 2,
    paddingLeft: 12,
    paddingBottom: 12,
    position: 'relative',
  },
  timelinePoint: {
    position: 'absolute',
    left: -5,
    top: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timelineTime: {
    color: COLORS.text2,
    fontSize: 8.5,
    fontFamily: 'monospace',
  },
  timelineDesc: {
    color: COLORS.text,
    fontSize: 11,
    marginTop: 1,
  },
  timelineDetails: {
    color: COLORS.text2,
    fontSize: 10,
    marginTop: 1,
  },
  explainerCard: {
    borderWidth: 1,
    backgroundColor: COLORS.cardAlt,
    borderRadius: 8,
    padding: 10,
    marginVertical: 6,
  },
  loadingWrapper: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  loadingText: {
    color: COLORS.text2,
    fontSize: 10,
    marginTop: 6,
  },
  errorText: {
    color: COLORS.red,
    fontSize: 10.5,
  },
  explainerText: {
    color: COLORS.text,
    fontSize: 11,
    lineHeight: 15,
  },
  factorCard: {
    backgroundColor: COLORS.cardAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  factorName: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  progressBarWrapper: {
    height: 5,
    backgroundColor: '#222',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  factorStatus: {
    color: COLORS.text2,
    fontSize: 9,
    lineHeight: 12,
  },
  simulatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
    backgroundColor: COLORS.cardAlt,
    padding: 6,
    borderRadius: 6,
  },
  simLabel: {
    color: COLORS.text,
    fontSize: 10.5,
    fontWeight: 'bold',
  },
  simButtonsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  simBtn: {
    backgroundColor: COLORS.card,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  simBtnText: {
    color: '#fff',
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  simOptionBtn: {
    backgroundColor: COLORS.cardAlt,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  activeSimOptionBtn: {
    backgroundColor: COLORS.accent,
  },
  simOptionBtnText: {
    color: '#fff',
    fontSize: 8.5,
    fontWeight: 'bold',
  },
  simResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.cyan + '10',
    borderColor: COLORS.cyan + '35',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
  },
  simResultRight: {
    flex: 1,
  },
  simResultTitle: {
    color: COLORS.text2,
    fontSize: 9.5,
  },
  simResultValue: {
    fontSize: 12.5,
    fontWeight: 'bold',
    marginTop: 1,
  },
  simRuleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 2,
  },
  simRuleText: {
    color: COLORS.text2,
    fontSize: 10,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // DECEPTION STYLE
  // ─────────────────────────────────────────────────────────────────────────────
  sectionDescText: {
    color: COLORS.text2,
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 16,
  },
  deceptionCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.teal + '25',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIcon: {
    marginBottom: 8,
  },
  deceptionCardTitle: {
    color: COLORS.text2,
    fontSize: 10,
  },
  deceptionCardValue: {
    color: COLORS.teal,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  mirageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  mirageId: {
    color: COLORS.text,
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: 'bold',
  },
  mirageClass: {
    color: COLORS.text2,
    fontSize: 9,
  },
  mirageStatus: {
    color: COLORS.green,
    fontWeight: 'bold',
    fontSize: 9,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // EVIDENCE STYLE
  // ─────────────────────────────────────────────────────────────────────────────
  evidenceGenCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  evidenceGenTitle: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  evidenceGenInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  evidenceGenInput: {
    flex: 1,
    backgroundColor: COLORS.cardAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    color: COLORS.text,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
  },
  evidenceGenBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  evidenceGenBtnText: {
    color: '#fff',
    fontSize: 11.5,
    fontWeight: 'bold',
  },
  evidenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 6,
  },
  evidenceLeft: {
    flex: 1,
  },
  evidenceEmpId: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  evidenceFilename: {
    color: COLORS.text2,
    fontSize: 10,
    marginTop: 1,
  },
  evidenceHash: {
    color: COLORS.text2,
    fontSize: 8.5,
    marginTop: 1,
    fontFamily: 'monospace',
  },
  downloadIcon: {
    padding: 6,
  },

  radarCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  graphSelectorContainer: {
    marginBottom: 12,
  },
  graphSelectorTitle: {
    color: COLORS.text2,
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 6,
  },
  graphSelectorScroll: {
    flexDirection: 'row',
  },
  graphSelectorTag: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    backgroundColor: COLORS.cardAlt,
  },
  graphSelectorTagActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  graphSelectorTagText: {
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  graphSelectorTagTextActive: {
    textShadowColor: 'rgba(99, 102, 241, 0.5)',
    textShadowRadius: 4,
  },
  graphCanvasContainer: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 10,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  graphInspectorCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  graphInspectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  graphInspectorEmpId: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  graphInspectorCbsi: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  graphInspectorText: {
    color: COLORS.text2,
    fontSize: 11,
    lineHeight: 14,
    marginBottom: 10,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalAlertCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.red,
    borderRadius: 16,
    padding: 16,
    shadowColor: COLORS.red,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  modalAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 10,
    marginBottom: 14,
  },
  modalAlertTitle: {
    color: COLORS.red,
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  modalAlertSubtitle: {
    color: '#888',
    fontSize: 8.5,
    fontFamily: 'monospace',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  modalAlertBody: {
    marginBottom: 16,
  },
  modalAlertRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalAlertLabel: {
    color: COLORS.text2,
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  modalAlertValue: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  modalAlertActions: {
    flexDirection: 'column',
    gap: 8,
  },
  modalAlertActionBtnConfirm: {
    backgroundColor: COLORS.red,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalAlertActionBtnDismiss: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalAlertActionBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // BOTTOM TAB BAR STYLE
  // ─────────────────────────────────────────────────────────────────────────────
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 62 : 72,
    paddingBottom: Platform.OS === 'ios' ? 12 : 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  activeTabItem: {
    // Subtle active accent indication
  },
  tabLabel: {
    fontSize: 8.5,
    marginTop: 3,
    fontWeight: 'bold',
  },
});
