/**
 * Feature Flags Configuration
 * 
 * This file controls which features are visible/enabled in the application.
 * To enable a feature in the future, simply change its value from false to true.
 * 
 * Note: This does NOT delete any code - it only hides features from the UI.
 */

// Dashboard Feature Flags
export const dashboardFeatures = {
  // IP Address Checker - ALWAYS VISIBLE
  ipChecker: true,
  
  // Metric Cards
  showTotalEquipmentsCard: true,
  showTotalIPAddressesCard: true,
  showAssignedIPAddressesCard: true,
  showUnassignedIPAddressesCard: true,
  showMeshNodesCard: false,          // Hidden for now
  showNetworkUptimeCard: false,      // Hidden for now
  showMeshStrengthCard: false,       // Hidden for now
  
  // Dashboard Sections
  showEquipmentSection: true,
  showAlertsSection: true,
  showNetworkTopologySection: false, // Hidden for now
  showQuickActionsSection: false,    // Hidden for now
  showOverviewTab: false,            // Hidden for now
  showNetworkTab: false,             // Hidden for now
  showMonitoringControls: false,     // Hidden for now (Start/Stop monitor buttons)
  showRealTimeCheckButton: false,    // Hidden for now
} as const;

// Sidebar Feature Flags
export const sidebarFeatures = {
  // Overview Section
  dashboard: true,
  networkStatus: false,              // Hidden for now
  
  // Equipment Management Section
  miningEquipment: true,
  rajantNodes: false,                // Hidden for now
  meshNetwork: false,                // Hidden for now
  
  // IP Management Section
  ipManagement: true,
  ipAssignment: false,               // Hidden for now
  ipMonitoring: false,               // Hidden for now
  
  // Monitoring Section
  equipmentStatus: false,            // Hidden for now
  alerts: true,
  reports: true,
  
  // Administration Section
  users: true,
  settings: true,
  logs: true,
  backup: false,                     // Hidden for now
  maintenance: false,                // Hidden for now
  
  // Tools Section
  networkScanner: false,             // Hidden for now
  pingTool: false,                   // Hidden for now
  traceroute: false,                 // Hidden for now
  bandwidthTest: false,             // Hidden for now
} as const;

/**
 * Check if a dashboard feature is enabled
 */
export function isDashboardFeatureEnabled(feature: keyof typeof dashboardFeatures): boolean {
  return dashboardFeatures[feature] === true;
}

/**
 * Check if a sidebar feature is enabled
 */
export function isSidebarFeatureEnabled(feature: keyof typeof sidebarFeatures): boolean {
  return sidebarFeatures[feature] === true;
}

/**
 * Get all enabled dashboard features
 */
export function getEnabledDashboardFeatures(): Record<string, boolean> {
  return { ...dashboardFeatures };
}

/**
 * Get all enabled sidebar features
 */
export function getEnabledSidebarFeatures(): Record<string, boolean> {
  return { ...sidebarFeatures };
}

// Equipment Management Feature Flags
export const equipmentFeatures = {
  // Metric Cards
  showTotalEquipmentCard: true,
  showOnlineCard: false,              // Hidden for now
  showOfflineCard: false,             // Hidden for now
  showMaintenanceCard: false,         // Hidden for now
  showMonitoringCard: false,          // Hidden for now
  showHealthCard: false,              // Hidden for now
  showAssignedEquipmentCard: true,    // New: Equipment with IPs assigned
  showUnassignedEquipmentCard: true,  // New: Equipment without IPs
  
  // Table Columns
  showRealTimeStatusColumn: false,    // Hidden for now
  showResponseTimeColumn: false,      // Hidden for now
  showSignalStrengthColumn: false,    // Hidden for now
  showLastSeenColumn: false,          // Hidden for now
  
  // Monitoring Controls
  showStartStopButtons: false,        // Hidden for now (Start/Stop monitoring)
  showRefreshButton: true,
  showImportExportButtons: true,
} as const;

/**
 * Check if an equipment feature is enabled
 */
export function isEquipmentFeatureEnabled(feature: keyof typeof equipmentFeatures): boolean {
  return equipmentFeatures[feature] === true;
}

// User Management Feature Flags
export const userFeatures = {
  // User List Features
  showUserStats: true,
  showActivityAnalytics: false,        // Hidden for now
  showLastLoginColumn: false,          // Hidden for now
  
  // Actions
  allowUserCreation: true,
  allowUserEditing: true,
  allowUserDeletion: true,
  allowPasswordReset: true,
  allowBulkActions: false,             // Hidden for now
  allowUserImportExport: false,        // Hidden for now
  
  // Role Management
  showRolePermissions: false,          // Hidden for now
  allowCustomRoles: false,             // Hidden for now
  
  // Security Features
  show2FASettings: false,              // Hidden for now
  showSessionManagement: false,        // Hidden for now
  showLoginHistory: false,             // Hidden for now
  
  // Profile Features
  allowProfilePictureUpload: false,    // Hidden for now (future use)
  showProfileActivity: true,
  allowProfileEditing: true,
} as const;

/**
 * Check if a user management feature is enabled
 */
export function isUserFeatureEnabled(feature: keyof typeof userFeatures): boolean {
  return userFeatures[feature] === true;
}

