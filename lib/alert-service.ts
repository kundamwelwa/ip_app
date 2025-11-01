/**
 * Alert Service
 * Auto-generates alerts for system changes requiring admin approval
 */

import { prisma } from "@/lib/prisma";
import type { AlertType, AlertSeverity } from "@prisma/client";

interface CreateAlertParams {
  type: AlertType;
  title: string;
  message: string;
  severity: AlertSeverity;
  equipmentId?: string;
  ipAddressId?: string;
  entityType?: string;
  entityId?: string;
  details?: any;
}

/**
 * Create an alert in the system
 */
export async function createAlert(params: CreateAlertParams) {
  try {
    const alert = await prisma.alert.create({
      data: {
        type: params.type,
        title: params.title,
        message: params.message,
        severity: params.severity,
        equipmentId: params.equipmentId,
        ipAddressId: params.ipAddressId,
        entityType: params.entityType,
        entityId: params.entityId,
        details: params.details,
        status: "PENDING", // All new alerts start as PENDING
      },
    });

    console.log(`Alert created: ${alert.type} - ${alert.title}`);
    return alert;
  } catch (error) {
    console.error("Error creating alert:", error);
    throw error;
  }
}

/**
 * Alert for Equipment Added
 */
export async function alertEquipmentAdded(
  equipmentId: string,
  equipmentName: string,
  equipmentType: string,
  userId: string
) {
  return createAlert({
    type: "EQUIPMENT_ADDED",
    title: "New Equipment Added",
    message: `Equipment "${equipmentName}" (${equipmentType}) has been added to the system and requires admin approval.`,
    severity: "INFO",
    equipmentId,
    entityType: "EQUIPMENT",
    entityId: equipmentId,
    details: {
      equipmentName,
      equipmentType,
      addedBy: userId,
    },
  });
}

/**
 * Alert for Equipment Updated
 */
export async function alertEquipmentUpdated(
  equipmentId: string,
  equipmentName: string,
  changes: any,
  userId: string
) {
  return createAlert({
    type: "EQUIPMENT_UPDATED",
    title: "Equipment Modified",
    message: `Equipment "${equipmentName}" has been modified and requires admin approval.`,
    severity: "WARNING",
    equipmentId,
    entityType: "EQUIPMENT",
    entityId: equipmentId,
    details: {
      equipmentName,
      changes,
      modifiedBy: userId,
    },
  });
}

/**
 * Alert for Equipment Deleted
 */
export async function alertEquipmentDeleted(
  equipmentName: string,
  equipmentType: string,
  userId: string
) {
  return createAlert({
    type: "EQUIPMENT_DELETED",
    title: "Equipment Deleted",
    message: `Equipment "${equipmentName}" (${equipmentType}) has been deleted from the system.`,
    severity: "WARNING",
    entityType: "EQUIPMENT",
    details: {
      equipmentName,
      equipmentType,
      deletedBy: userId,
    },
  });
}

/**
 * Alert for Equipment Offline
 */
export async function alertEquipmentOffline(
  equipmentId: string,
  equipmentName: string,
  lastSeen?: Date
) {
  return createAlert({
    type: "EQUIPMENT_OFFLINE",
    title: "Equipment Offline",
    message: `Equipment "${equipmentName}" has been offline${
      lastSeen ? ` since ${lastSeen.toLocaleString()}` : ""
    }. Immediate attention required.`,
    severity: "ERROR",
    equipmentId,
    entityType: "EQUIPMENT",
    entityId: equipmentId,
    details: {
      equipmentName,
      lastSeen,
    },
  });
}

/**
 * Alert for IP Address Added
 */
export async function alertIPAddressAdded(
  ipAddressId: string,
  address: string,
  userId: string
) {
  return createAlert({
    type: "IP_ADDRESS_ADDED",
    title: "IP Address Added",
    message: `IP address ${address} has been added to the network pool and requires admin approval.`,
    severity: "INFO",
    ipAddressId,
    entityType: "IP_ADDRESS",
    entityId: ipAddressId,
    details: {
      address,
      addedBy: userId,
    },
  });
}

/**
 * Alert for IP Address Updated
 */
export async function alertIPAddressUpdated(
  ipAddressId: string,
  address: string,
  changes: any,
  userId: string
) {
  return createAlert({
    type: "IP_ADDRESS_UPDATED",
    title: "IP Address Modified",
    message: `IP address ${address} configuration has been modified and requires admin approval.`,
    severity: "WARNING",
    ipAddressId,
    entityType: "IP_ADDRESS",
    entityId: ipAddressId,
    details: {
      address,
      changes,
      modifiedBy: userId,
    },
  });
}

/**
 * Alert for IP Address Deleted
 */
export async function alertIPAddressDeleted(
  address: string,
  userId: string
) {
  return createAlert({
    type: "IP_ADDRESS_DELETED",
    title: "IP Address Deleted",
    message: `IP address ${address} has been deleted from the network pool.`,
    severity: "WARNING",
    entityType: "IP_ADDRESS",
    details: {
      address,
      deletedBy: userId,
    },
  });
}

/**
 * Alert for IP Assigned
 */
export async function alertIPAssigned(
  ipAddressId: string,
  address: string,
  equipmentId: string,
  equipmentName: string,
  userId: string
) {
  return createAlert({
    type: "IP_ASSIGNED",
    title: "IP Address Assigned",
    message: `IP address ${address} has been assigned to equipment "${equipmentName}".`,
    severity: "INFO",
    ipAddressId,
    equipmentId,
    entityType: "IP_ASSIGNMENT",
    details: {
      address,
      equipmentName,
      assignedBy: userId,
    },
  });
}

/**
 * Alert for IP Unassigned
 */
export async function alertIPUnassigned(
  ipAddressId: string,
  address: string,
  equipmentId: string,
  equipmentName: string,
  userId: string
) {
  return createAlert({
    type: "IP_UNASSIGNED",
    title: "IP Address Unassigned",
    message: `IP address ${address} has been unassigned from equipment "${equipmentName}".`,
    severity: "INFO",
    ipAddressId,
    equipmentId,
    entityType: "IP_ASSIGNMENT",
    details: {
      address,
      equipmentName,
      unassignedBy: userId,
    },
  });
}

/**
 * Alert for IP Conflict Detected
 */
export async function alertIPConflict(
  ipAddressId: string,
  address: string,
  equipmentIds: string[]
) {
  return createAlert({
    type: "IP_CONFLICT",
    title: "IP Address Conflict Detected",
    message: `IP address ${address} is assigned to multiple equipment. Immediate resolution required.`,
    severity: "CRITICAL",
    ipAddressId,
    entityType: "IP_ADDRESS",
    entityId: ipAddressId,
    details: {
      address,
      conflictingEquipmentIds: equipmentIds,
    },
  });
}

/**
 * Alert for User Created
 */
export async function alertUserCreated(
  userId: string,
  userName: string,
  userRole: string,
  createdBy: string
) {
  return createAlert({
    type: "USER_CREATED",
    title: "New User Created",
    message: `New user "${userName}" with role ${userRole} has been created and requires admin approval.`,
    severity: "WARNING",
    entityType: "USER",
    entityId: userId,
    details: {
      userName,
      userRole,
      createdBy,
    },
  });
}

/**
 * Alert for User Updated
 */
export async function alertUserUpdated(
  userId: string,
  userName: string,
  changes: any,
  updatedBy: string
) {
  return createAlert({
    type: "USER_UPDATED",
    title: "User Account Modified",
    message: `User account "${userName}" has been modified and requires admin approval.`,
    severity: "WARNING",
    entityType: "USER",
    entityId: userId,
    details: {
      userName,
      changes,
      updatedBy,
    },
  });
}

/**
 * Alert for User Deleted
 */
export async function alertUserDeleted(
  userName: string,
  userRole: string,
  deletedBy: string
) {
  return createAlert({
    type: "USER_DELETED",
    title: "User Account Deleted",
    message: `User account "${userName}" (${userRole}) has been deleted from the system.`,
    severity: "WARNING",
    entityType: "USER",
    details: {
      userName,
      userRole,
      deletedBy,
    },
  });
}

/**
 * Alert for Configuration Changed
 */
export async function alertConfigChanged(
  configType: string,
  configName: string,
  changes: any,
  changedBy: string
) {
  return createAlert({
    type: "CONFIG_CHANGED",
    title: "System Configuration Changed",
    message: `System configuration "${configName}" has been modified and requires admin approval.`,
    severity: "WARNING",
    entityType: "CONFIG",
    details: {
      configType,
      configName,
      changes,
      changedBy,
    },
  });
}

/**
 * Alert for Network Disconnection
 */
export async function alertNetworkDisconnection(
  equipmentId: string,
  equipmentName: string
) {
  return createAlert({
    type: "NETWORK_DISCONNECTION",
    title: "Network Disconnection",
    message: `Equipment "${equipmentName}" has lost network connectivity.`,
    severity: "CRITICAL",
    equipmentId,
    entityType: "EQUIPMENT",
    entityId: equipmentId,
    details: {
      equipmentName,
      timestamp: new Date(),
    },
  });
}

/**
 * Alert for Weak Mesh Signal
 */
export async function alertWeakMeshSignal(
  equipmentId: string,
  equipmentName: string,
  signalStrength: number
) {
  return createAlert({
    type: "MESH_WEAK_SIGNAL",
    title: "Weak Mesh Signal",
    message: `Equipment "${equipmentName}" has weak mesh signal strength (${signalStrength}%).`,
    severity: "WARNING",
    equipmentId,
    entityType: "EQUIPMENT",
    entityId: equipmentId,
    details: {
      equipmentName,
      signalStrength,
    },
  });
}

/**
 * Alert for Maintenance Required
 */
export async function alertMaintenanceRequired(
  equipmentId: string,
  equipmentName: string,
  maintenanceType: string
) {
  return createAlert({
    type: "MAINTENANCE_REQUIRED",
    title: "Maintenance Required",
    message: `Equipment "${equipmentName}" requires ${maintenanceType} maintenance.`,
    severity: "WARNING",
    equipmentId,
    entityType: "EQUIPMENT",
    entityId: equipmentId,
    details: {
      equipmentName,
      maintenanceType,
    },
  });
}

/**
 * Alert for Security Breach
 */
export async function alertSecurityBreach(
  description: string,
  details: any
) {
  return createAlert({
    type: "SECURITY_BREACH",
    title: "Security Breach Detected",
    message: description,
    severity: "CRITICAL",
    entityType: "SECURITY",
    details,
  });
}

/**
 * Alert for System Error
 */
export async function alertSystemError(
  errorMessage: string,
  errorDetails: any
) {
  return createAlert({
    type: "SYSTEM_ERROR",
    title: "System Error",
    message: errorMessage,
    severity: "ERROR",
    entityType: "SYSTEM",
    details: errorDetails,
  });
}

