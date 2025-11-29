import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/ip-addresses/check-duplicates
 * Checks if IP addresses already exist in the system
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { ipAddresses } = body;

    if (!Array.isArray(ipAddresses)) {
      return NextResponse.json(
        { error: 'Invalid request: ipAddresses must be an array' },
        { status: 400 }
      );
    }

    // Check each IP address in the database
    const duplicates = await Promise.all(
      ipAddresses.map(async (ipAddress) => {
        // Check in IPAddress table
        const existingIP = await prisma.iPAddress.findUnique({
          where: { address: ipAddress },
          include: {
            assignments: {
              where: { isActive: true },
              include: {
                equipment: {
                  select: {
                    id: true,
                    name: true,
                    type: true,
                  },
                },
              },
            },
          },
        });

        if (existingIP) {
          const activeAssignment = existingIP.assignments.find(
            (assignment) => assignment.equipment !== null
          );

          return {
            ipAddress,
            existsInSystem: true,
            existingEquipment: activeAssignment?.equipment || undefined,
          };
        }

        return {
          ipAddress,
          existsInSystem: false,
        };
      })
    );

    return NextResponse.json({
      duplicates,
      totalChecked: ipAddresses.length,
      totalDuplicates: duplicates.filter((d) => d.existsInSystem).length,
    });
  } catch (error) {
    console.error('Error checking duplicates:', error);
    return NextResponse.json(
      { error: 'Failed to check duplicates' },
      { status: 500 }
    );
  }
}

