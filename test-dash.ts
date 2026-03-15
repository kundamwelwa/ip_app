import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const equipmentData = await prisma.equipment.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        location: true,
        operator: true,
        lastSeen: true,
        meshStrength: true,
        nodeId: true,
        ipAssignments: {
          where: { isActive: true },
          include: {
            ipAddress: {
              select: {
                id: true,
                address: true,
                status: true,
              },
            },
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { lastSeen: "desc" },
      take: 20,
    });
    console.log("equipmentData works");

    const stats = await Promise.all([
      prisma.equipment.count(),
      prisma.equipment.count({ where: { status: "ONLINE" } }),
      prisma.iPAddress.count(),
      prisma.iPAddress.count({ where: { status: "ASSIGNED" } }),
      prisma.equipment.count({ where: { type: "RAJANT_NODE" } }),
    ]);
    console.log("stats works", stats);

    const onlineEquipmentWithMesh = await prisma.equipment.findMany({
          where: {
            status: "ONLINE",
            meshStrength: { not: null },
          },
          select: { meshStrength: true },
        });

    console.log("mesh works");

    const recentAlerts = await prisma.alert.findMany({
        where: { isResolved: false },
        include: {
          equipment: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          ipAddress: {
            select: {
              address: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      });
    
    console.log("alerts works");

    const recentActivity = await prisma.auditLog.findMany({
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          equipment: {
            select: {
              name: true,
            },
          },
          ipAddress: {
            select: {
              address: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      });
    
      console.log("activities works");

      const ipStatusSummary = await prisma.iPAddress.groupBy({
        by: ["status"],
        _count: {
          id: true,
        },
      });

    const formattedEquipment = equipmentData.map((equipment: any) => {
      const activeAssignment = equipment.ipAssignments[0];
      return {
        id: equipment.id,
        name: equipment.name,
        type: equipment.type,
        status: equipment.status,
        location: equipment.location || "Unknown",
        lastSeen: equipment.lastSeen
          ? new Date(equipment.lastSeen).toLocaleString()
          : "Never",
        meshStrength: equipment.meshStrength || 0,
        nodeId: equipment.nodeId,
        ip: activeAssignment?.ipAddress?.address || "Not assigned",
        ipStatus: activeAssignment?.ipAddress?.status || "AVAILABLE",
        operator: equipment.operator || null,
        assignedBy: activeAssignment?.user
          ? `${activeAssignment.user.firstName} ${activeAssignment.user.lastName}`
          : null,
      };
    });

    const formattedAlerts = recentAlerts.map((alert: any) => ({
      id: alert.id,
      type: alert.severity.toLowerCase(),
      message: alert.message,
      time: new Date(alert.createdAt).toLocaleString(),
      equipment: alert.equipment?.name || alert.ipAddress?.address || "System",
    }));

    const formattedActivity = recentActivity.map((log: any) => ({
      id: log.id,
      action: log.action,
      user: `${log.user.firstName} ${log.user.lastName}`,
      entity: log.equipment?.name || log.ipAddress?.address || "Unknown",
      time: new Date(log.createdAt).toLocaleString(),
    }));
    
    console.log("FORMATTING PASS");
  } catch(e) {
    console.error("FAILED!!!", e);
  }
}

main().finally(() => prisma.$disconnect());
