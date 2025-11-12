import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("\n" + "=".repeat(80));
    console.log("🔍 SYSTEM INTEGRITY CHECK - Duplicate IP Detection");
    console.log("=".repeat(80));

    const issues: any[] = [];
    let criticalCount = 0;

    // ONLY CHECK: Duplicate IP assignments (same IP on multiple DIFFERENT equipment)
    console.log("📊 Fetching all IP addresses with active assignments...");
    
    const allIPsWithAssignments = await prisma.iPAddress.findMany({
      include: {
        assignments: {
          where: { isActive: true },
          include: {
            equipment: {
              select: {
                id: true,
                name: true,
                type: true,
                location: true
              }
            },
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            assignedAt: 'asc'
          }
        }
      }
    });

    console.log(`📊 Total IPs in database: ${allIPsWithAssignments.length}`);
    console.log(`📊 IPs with active assignments: ${allIPsWithAssignments.filter(ip => ip.assignments.length > 0).length}`);

    // Filter to find IPs assigned to MORE THAN ONE DIFFERENT equipment
    const conflictingIPs = allIPsWithAssignments.filter(ip => {
      if (ip.assignments.length <= 1) return false;
      
      // Check if assignments are to DIFFERENT equipment
      const uniqueEquipmentIds = new Set(ip.assignments.map(a => a.equipmentId).filter(Boolean));
      return uniqueEquipmentIds.size > 1;
    });
    
    console.log(`🚨 IPs with MULTIPLE DIFFERENT equipment assignments (conflicts): ${conflictingIPs.length}`);
    
    if (conflictingIPs.length > 0) {
      console.log(`\n🚨 DUPLICATE IP CONFLICTS DETECTED:`);
      conflictingIPs.forEach((ip, index) => {
        const uniqueEquipment = Array.from(new Set(ip.assignments.map(a => a.equipmentId)))
          .map(eqId => ip.assignments.find(a => a.equipmentId === eqId))
          .filter((a): a is NonNullable<typeof a> => a !== null && a !== undefined);
        
        console.log(`\n  Conflict ${index + 1}: IP ${ip.address}`);
        console.log(`  - Assigned to ${uniqueEquipment.length} DIFFERENT equipment:`);
        uniqueEquipment.forEach((assignment, i) => {
          console.log(`    ${i + 1}. Equipment: ${assignment.equipment?.name || 'Unknown'} (ID: ${assignment.equipmentId})`);
          console.log(`       Assigned: ${assignment.assignedAt.toISOString()}`);
        });
      });
      
      // Create issues for each conflict
      conflictingIPs.forEach(ip => {
        const uniqueEquipment = Array.from(new Set(ip.assignments.map(a => a.equipmentId)))
          .map(eqId => ip.assignments.find(a => a.equipmentId === eqId))
          .filter((a): a is NonNullable<typeof a> => a !== null && a !== undefined);
        
        criticalCount++;
        issues.push({
          severity: "CRITICAL",
          category: "IP_DUPLICATION",
          title: `Duplicate IP Assignment: ${ip.address}`,
          description: `IP address ${ip.address} is assigned to ${uniqueEquipment.length} different equipment units. Each IP address must be unique to one equipment.`,
          affectedItems: uniqueEquipment.map(a => ({
            type: "equipment",
            id: a.equipment?.id,
            name: a.equipment?.name,
            location: a.equipment?.location,
            assignedAt: a.assignedAt,
            assignedBy: a.user ? `${a.user.firstName} ${a.user.lastName}` : "System"
          })),
          count: uniqueEquipment.length,
          action: "VIEW_IP_DETAILS",
          actionUrl: "/ip-management",
          detectedAt: new Date()
        });
      });
    } else {
      console.log("✅ No duplicate IP assignments detected");
    }

    // Calculate system health score based ONLY on duplicate IPs
    const maxPossibleScore = 100;
    const deductionPerConflict = 30; // Each conflict is serious
    const deductions = criticalCount * deductionPerConflict;
    const healthScore = Math.max(0, maxPossibleScore - deductions);

    // Determine system status
    let systemStatus = "HEALTHY";
    let statusMessage = "No duplicate IP addresses detected - All equipment have unique IPs";
    
    if (criticalCount > 0) {
      systemStatus = "CRITICAL";
      statusMessage = `${criticalCount} duplicate IP ${criticalCount === 1 ? 'address' : 'addresses'} detected - Same IP assigned to different equipment`;
    }

    console.log(`\n📊 FINAL STATUS: ${systemStatus}`);
    console.log(`📊 Health Score: ${healthScore}/100`);
    console.log("=".repeat(80) + "\n");

    return NextResponse.json({
      status: systemStatus,
      message: statusMessage,
      healthScore,
      summary: {
        totalIssues: issues.length,
        criticalIssues: criticalCount,
        warnings: 0, // No warnings, only duplicate IP checks
        lastChecked: new Date()
      },
      issues,
      recommendations: generateRecommendations(criticalCount, issues)
    });

  } catch (error) {
    console.error("Error checking system integrity:", error);
    return NextResponse.json(
      { error: "Failed to check system integrity" },
      { status: 500 }
    );
  }
}

function generateRecommendations(criticalCount: number, issues: any[]): string[] {
  const recommendations: string[] = [];

  if (criticalCount > 0) {
    recommendations.push("🚨 Critical: Same IP address cannot be assigned to multiple different equipment");
    recommendations.push("📍 Navigate to IP Management to view conflict details and remove duplicate assignments");
    recommendations.push("⚡ Resolve conflicts immediately to prevent network communication issues");
    
    if (criticalCount > 1) {
      recommendations.push(`📊 ${criticalCount} IP addresses are currently in conflict - prioritize resolution`);
    }
  }

  if (criticalCount === 0) {
    recommendations.push("✅ No duplicate IP assignments detected");
    recommendations.push("🎯 All equipment have unique IP addresses");
    recommendations.push("💡 System will continuously monitor for any duplicate IP assignments");
  }

  return recommendations;
}

