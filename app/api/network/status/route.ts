import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { checkAllEquipmentStatus } from "@/lib/equipment-communication";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Perform real-time equipment status check
    console.log("Performing real-time equipment status check for network status...");
    const realTimeStatuses = await checkAllEquipmentStatus();

    // Get all equipment with their network status
    const equipment = await prisma.equipment.findMany({
      include: {
        ipAssignments: {
          where: { isActive: true },
          include: {
            ipAddress: true
          }
        },
        alerts: {
          where: {
            type: {
              in: ["NETWORK_DISCONNECTION", "EQUIPMENT_OFFLINE", "MESH_WEAK_SIGNAL"]
            }
          },
          orderBy: {
            createdAt: "desc"
          },
          take: 1
        }
      }
    });

    // Get network statistics
    const networkStats = await prisma.networkStats.findFirst({
      orderBy: {
        recordedAt: "desc"
      }
    });

    // Calculate network metrics using real-time data
    const totalNodes = equipment.length;
    
    // Use real-time statuses to determine online/offline counts
    const onlineNodes = realTimeStatuses.filter(status => status.isOnline).length;
    const offlineNodes = realTimeStatuses.filter(status => !status.isOnline).length;
    const maintenanceNodes = equipment.filter(eq => eq.status === "MAINTENANCE").length;

    // Calculate average signal strength using real-time data
    const onlineEquipment = equipment.filter(eq => {
      const realTimeStatus = realTimeStatuses.find(status => status.equipmentId === eq.id);
      return realTimeStatus ? realTimeStatus.isOnline : eq.status === "ONLINE";
    });
    
    const averageSignalStrength = onlineEquipment.length > 0 
      ? Math.round(onlineEquipment.reduce((sum, eq) => {
          const realTimeStatus = realTimeStatuses.find(status => status.equipmentId === eq.id);
          return sum + (realTimeStatus ? Math.max(0, 100 - (realTimeStatus.responseTime || 0) / 10) : (eq.meshStrength || 0));
        }, 0) / onlineEquipment.length)
      : 0;

    // Calculate total data rate based on real network performance
    const totalDataRate = realTimeStatuses.reduce((sum, status) => {
      if (status.isOnline) {
        // Base data rate on response time - better response time = higher data rate
        const baseRate = 25; // Minimum rate
        const performanceFactor = status.responseTime ? Math.max(0, 1 - (status.responseTime / 100)) : 1;
        return sum + Math.round(baseRate + (performanceFactor * 35)); // 25-60 Mbps range
      }
      return sum;
    }, 0);

    // Calculate average latency using real ping results
    const responseTimes = realTimeStatuses
      .filter(status => status.isOnline && status.responseTime)
      .map(status => status.responseTime!);
    
    const averageLatency = responseTimes.length > 0 
      ? Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length)
      : 0;

    // Determine network health
    let networkHealth: "excellent" | "good" | "fair" | "poor" = "good";
    const uptimePercentage = totalNodes > 0 ? (onlineNodes / totalNodes) * 100 : 0;
    
    if (uptimePercentage >= 95 && averageSignalStrength >= 80) {
      networkHealth = "excellent";
    } else if (uptimePercentage >= 85 && averageSignalStrength >= 60) {
      networkHealth = "good";
    } else if (uptimePercentage >= 70 && averageSignalStrength >= 40) {
      networkHealth = "fair";
    } else {
      networkHealth = "poor";
    }

    // Transform equipment data to network nodes format using real-time data
    const networkNodes = equipment.map(eq => {
      // Get the assigned IP address
      const assignedIP = eq.ipAssignments.find(assignment => assignment.isActive)?.ipAddress;
      
      // Find real-time status for this equipment
      const realTimeStatus = realTimeStatuses.find(status => status.equipmentId === eq.id);
      
      // Calculate real mesh connections based on online equipment in same location
      const sameLocationEquipment = equipment.filter(otherEq => 
        otherEq.id !== eq.id && 
        otherEq.location === eq.location && 
        realTimeStatuses.find(status => status.equipmentId === otherEq.id)?.isOnline
      );
      const meshConnections = Math.min(sameLocationEquipment.length, 5); // Cap at 5 connections
      
      // Calculate real data rate based on performance
      const dataRate = realTimeStatus && realTimeStatus.isOnline ? (() => {
        const baseRate = 25;
        const performanceFactor = realTimeStatus.responseTime ? Math.max(0, 1 - (realTimeStatus.responseTime / 100)) : 1;
        return Math.round(baseRate + (performanceFactor * 35));
      })() : 0;
      
      // Use real latency from ping results
      const latency = realTimeStatus && realTimeStatus.isOnline && realTimeStatus.responseTime 
        ? realTimeStatus.responseTime 
        : 0;
      
      // Calculate signal strength from real-time data
      const signalStrength = realTimeStatus 
        ? Math.max(0, 100 - (realTimeStatus.responseTime || 0) / 10)
        : (eq.meshStrength || 0);
      
      return {
        id: eq.nodeId || eq.id,
        name: eq.name,
        ip: assignedIP?.address || "N/A",
        macAddress: eq.macAddress || "N/A",
        status: realTimeStatus ? 
          (realTimeStatus.isOnline ? "online" : "offline") : 
          eq.status.toLowerCase() as "online" | "offline" | "maintenance" | "unknown",
        signalStrength: Math.min(100, Math.max(0, signalStrength)),
        lastSeen: realTimeStatus ? realTimeStatus.lastSeen : (eq.lastSeen || new Date()),
        location: eq.location || "Unknown",
        equipmentType: eq.type,
        meshConnections,
        dataRate,
        latency
      };
    });

    const response = {
      networkStats: {
        totalNodes,
        onlineNodes,
        offlineNodes,
        maintenanceNodes,
        averageSignalStrength,
        totalDataRate,
        averageLatency,
        networkHealth
      },
      networkNodes,
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching network status:", error);
    return NextResponse.json(
      { error: "Failed to fetch network status" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
