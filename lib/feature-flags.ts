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

