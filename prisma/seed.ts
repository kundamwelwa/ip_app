import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing data (optional - comment out if you want to preserve existing data)
  console.log('🧹 Cleaning existing data...');
  await prisma.auditLog.deleteMany({});
  await prisma.alert.deleteMany({});
  await prisma.iPAssignment.deleteMany({});
  await prisma.iPAddress.deleteMany({});
  await prisma.equipment.deleteMany({});
  await prisma.networkStats.deleteMany({});
  await prisma.networkConfig.deleteMany({});
  await prisma.user.deleteMany({});

  // Create Users
  console.log('👥 Creating users...');
  const hashedPassword = await bcrypt.hash('password123', 12);

  const adminUser = await prisma.user.create({
    data: {
      firstName: 'John',
      lastName: 'Admin',
      email: 'admin@mining.local',
      password: hashedPassword,
      department: 'IT',
      role: 'ADMIN',
      isActive: true,
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      firstName: 'Sarah',
      lastName: 'Manager',
      email: 'manager@mining.local',
      password: hashedPassword,
      department: 'Operations',
      role: 'MANAGER',
      isActive: true,
    },
  });

  const technicianUser = await prisma.user.create({
    data: {
      firstName: 'Mike',
      lastName: 'Technician',
      email: 'tech@mining.local',
      password: hashedPassword,
      department: 'Maintenance',
      role: 'TECHNICIAN',
      isActive: true,
    },
  });

  console.log(`✅ Created ${3} users`);

  // Create Network Configuration
  console.log('🌐 Creating network configuration...');
  const networkConfig = await prisma.networkConfig.create({
    data: {
      name: 'Main Mining Network',
      subnet: '192.168.1.0/24',
      gateway: '192.168.1.1',
      dnsPrimary: '8.8.8.8',
      dnsSecondary: '8.8.4.4',
      dhcpEnabled: false,
      isActive: true,
    },
  });

  console.log('✅ Created network configuration');

  // Create IP Addresses
  console.log('📍 Creating IP addresses...');
  const ipAddresses = [];
  
  // Create 100 IP addresses in the 192.168.1.0/24 range
  for (let i = 10; i <= 109; i++) {
    const ip = await prisma.iPAddress.create({
      data: {
        address: `192.168.1.${i}`,
        subnet: '192.168.1.0/24',
        gateway: '192.168.1.1',
        dns: '8.8.8.8,8.8.4.4',
        status: 'AVAILABLE',
        isReserved: i >= 100, // Reserve .100-.109 for special use
        notes: i >= 100 ? 'Reserved for critical infrastructure' : null,
      },
    });
    ipAddresses.push(ip);
  }

  console.log(`✅ Created ${ipAddresses.length} IP addresses`);

  // Create Mining Equipment
  console.log('🚜 Creating mining equipment...');
  const equipment = [];

  // Haul Trucks
  const trucks = [
    { name: 'Haul Truck 01', operator: 'Tom Wilson', location: 'Pit A - North', nodeId: 'BH-001' },
    { name: 'Haul Truck 02', operator: 'James Brown', location: 'Pit A - South', nodeId: 'BH-002' },
    { name: 'Haul Truck 03', operator: 'Robert Lee', location: 'Pit B - East', nodeId: 'BH-003' },
    { name: 'Haul Truck 04', operator: 'David Chen', location: 'Pit B - West', nodeId: 'BH-004' },
    { name: 'Haul Truck 05', operator: 'Michael Davis', location: 'Pit A - Central', nodeId: 'BH-005' },
  ];

  for (const truck of trucks) {
    const eq = await prisma.equipment.create({
      data: {
        name: truck.name,
        type: 'TRUCK',
        manufacturer: 'Caterpillar',
        model: '797F',
        serialNumber: `CAT797-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        location: truck.location,
        operator: truck.operator,
        description: 'Heavy-duty mining haul truck',
        status: 'ONLINE',
        meshStrength: Math.floor(Math.random() * 20) + 75, // 75-95%
        nodeId: truck.nodeId,
        lastSeen: new Date(),
      },
    });
    equipment.push(eq);
  }

  // Excavators
  const excavators = [
    { name: 'Excavator EX-01', location: 'Pit A - North', operator: 'Frank Martinez' },
    { name: 'Excavator EX-02', location: 'Pit B - East', operator: 'George White' },
    { name: 'Excavator EX-03', location: 'Pit A - South', operator: 'Henry Taylor' },
  ];

  for (const exc of excavators) {
    const eq = await prisma.equipment.create({
      data: {
        name: exc.name,
        type: 'EXCAVATOR',
        manufacturer: 'Komatsu',
        model: 'PC8000-6',
        serialNumber: `KOM-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        location: exc.location,
        operator: exc.operator,
        description: 'Electric rope shovel excavator',
        status: 'ONLINE',
        meshStrength: Math.floor(Math.random() * 15) + 80,
        lastSeen: new Date(),
      },
    });
    equipment.push(eq);
  }

  // Drills
  const drills = [
    { name: 'Drill Rig DR-01', location: 'Pit A - North', operator: 'Ivan Johnson' },
    { name: 'Drill Rig DR-02', location: 'Pit B - West', operator: 'Jack Anderson' },
  ];

  for (const drill of drills) {
    const eq = await prisma.equipment.create({
      data: {
        name: drill.name,
        type: 'DRILL',
        manufacturer: 'Atlas Copco',
        model: 'DM45',
        serialNumber: `AC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        location: drill.location,
        operator: drill.operator,
        description: 'Rotary blast hole drill',
        status: 'ONLINE',
        meshStrength: Math.floor(Math.random() * 20) + 70,
        lastSeen: new Date(),
      },
    });
    equipment.push(eq);
  }

  // Loaders
  const loaders = [
    { name: 'Loader LD-01', location: 'Pit A - Central', operator: 'Kevin Smith' },
    { name: 'Loader LD-02', location: 'Pit B - East', operator: 'Larry Jones' },
  ];

  for (const loader of loaders) {
    const eq = await prisma.equipment.create({
      data: {
        name: loader.name,
        type: 'LOADER',
        manufacturer: 'Liebherr',
        model: 'L586',
        serialNumber: `LIE-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        location: loader.location,
        operator: loader.operator,
        description: 'Wheel loader for material handling',
        status: 'ONLINE',
        meshStrength: Math.floor(Math.random() * 15) + 78,
        lastSeen: new Date(),
      },
    });
    equipment.push(eq);
  }

  // Dozers
  const dozers = [
    { name: 'Dozer DZ-01', location: 'Pit A - South', operator: 'Mark Williams' },
    { name: 'Dozer DZ-02', location: 'Pit B - West', operator: 'Nathan Brown' },
  ];

  for (const dozer of dozers) {
    const eq = await prisma.equipment.create({
      data: {
        name: dozer.name,
        type: 'DOZER',
        manufacturer: 'Caterpillar',
        model: 'D11T',
        serialNumber: `CAT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        location: dozer.location,
        operator: dozer.operator,
        description: 'Crawler dozer for material movement',
        status: 'ONLINE',
        meshStrength: Math.floor(Math.random() * 18) + 75,
        lastSeen: new Date(),
      },
    });
    equipment.push(eq);
  }

  // Rajant Mesh Nodes
  const rajantNodes = [
    { name: 'Rajant Node RN-01', location: 'Pit A - North Gateway', nodeId: 'ME4-A01' },
    { name: 'Rajant Node RN-02', location: 'Pit A - South Gateway', nodeId: 'ME4-A02' },
    { name: 'Rajant Node RN-03', location: 'Pit B - East Gateway', nodeId: 'ME4-B01' },
    { name: 'Rajant Node RN-04', location: 'Main Office', nodeId: 'ME4-M01' },
    { name: 'Rajant Node RN-05', location: 'Workshop Area', nodeId: 'ME4-W01' },
  ];

  for (const node of rajantNodes) {
    const eq = await prisma.equipment.create({
      data: {
        name: node.name,
        type: 'RAJANT_NODE',
        manufacturer: 'Rajant',
        model: 'ME4',
        serialNumber: `RJT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        macAddress: `00:13:21:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}`.toUpperCase(),
        location: node.location,
        description: 'Rajant BreadCrumb ME4 mesh node',
        status: 'ONLINE',
        meshStrength: Math.floor(Math.random() * 10) + 88, // 88-98%
        nodeId: node.nodeId,
        lastSeen: new Date(),
      },
    });
    equipment.push(eq);
  }

  // Add some offline equipment for realism
  const offlineEquipment = await prisma.equipment.create({
    data: {
      name: 'Haul Truck 06',
      type: 'TRUCK',
      manufacturer: 'Caterpillar',
      model: '797F',
      serialNumber: `CAT797-MAINT001`,
      location: 'Maintenance Bay',
      description: 'Under maintenance',
      notes: 'Scheduled maintenance - transmission service',
      status: 'MAINTENANCE',
      meshStrength: 0,
      lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
  });
  equipment.push(offlineEquipment);

  console.log(`✅ Created ${equipment.length} equipment items`);

  // Create IP Assignments
  console.log('🔗 Creating IP assignments...');
  const assignments = [];
  
  // Assign IPs to first 15 equipment items
  for (let i = 0; i < Math.min(15, equipment.length); i++) {
    if (equipment[i].status !== 'MAINTENANCE') {
      const assignment = await prisma.iPAssignment.create({
        data: {
          ipAddressId: ipAddresses[i].id,
          equipmentId: equipment[i].id,
          userId: adminUser.id,
          isActive: true,
          notes: `Initial assignment for ${equipment[i].name}`,
        },
      });
      
      // Update IP status to ASSIGNED
      await prisma.iPAddress.update({
        where: { id: ipAddresses[i].id },
        data: { status: 'ASSIGNED' },
      });
      
      assignments.push(assignment);
    }
  }

  console.log(`✅ Created ${assignments.length} IP assignments`);

  // Create Audit Logs
  console.log('📝 Creating audit logs...');
  const auditLogs = [];
  
  for (const assignment of assignments) {
    const log = await prisma.auditLog.create({
      data: {
        action: 'IP_ASSIGNED',
        entityType: 'IP_ADDRESS',
        entityId: assignment.ipAddressId,
        userId: adminUser.id,
        ipAddressId: assignment.ipAddressId,
        equipmentId: assignment.equipmentId,
        details: {
          action: 'Initial system setup',
          assignedBy: 'System Administrator',
        },
      },
    });
    auditLogs.push(log);
  }

  console.log(`✅ Created ${auditLogs.length} audit log entries`);

  // Create Alerts
  console.log('🚨 Creating sample alerts...');
  const alerts = [];

  // Weak signal alert
  const weakSignalAlert = await prisma.alert.create({
    data: {
      type: 'MESH_WEAK_SIGNAL',
      severity: 'WARNING',
      message: 'Weak mesh signal detected on Haul Truck 05',
      equipmentId: equipment[4]?.id,
      isResolved: false,
    },
  });
  alerts.push(weakSignalAlert);

  // Equipment offline alert
  const offlineAlert = await prisma.alert.create({
    data: {
      type: 'EQUIPMENT_OFFLINE',
      severity: 'ERROR',
      message: 'Haul Truck 06 is offline - scheduled maintenance',
      equipmentId: offlineEquipment.id,
      isResolved: false,
    },
  });
  alerts.push(offlineAlert);

  // Maintenance required alert
  const maintenanceAlert = await prisma.alert.create({
    data: {
      type: 'MAINTENANCE_REQUIRED',
      severity: 'INFO',
      message: 'Excavator EX-01 is due for routine maintenance',
      equipmentId: equipment[5]?.id,
      isResolved: false,
    },
  });
  alerts.push(maintenanceAlert);

  // Resolved alert example
  const resolvedAlert = await prisma.alert.create({
    data: {
      type: 'NETWORK_DISCONNECTION',
      severity: 'WARNING',
      message: 'Temporary network disconnection resolved',
      equipmentId: equipment[0]?.id,
      isResolved: true,
      resolvedAt: new Date(),
      resolvedBy: technicianUser.id,
    },
  });
  alerts.push(resolvedAlert);

  console.log(`✅ Created ${alerts.length} alerts`);

  // Create Network Stats
  console.log('📊 Creating network statistics...');
  const now = new Date();
  const networkStatsEntries = [];

  // Create historical data for the last 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const onlineCount = equipment.filter(eq => eq.status === 'ONLINE').length;
    const totalCount = equipment.length;
    
    const stats = await prisma.networkStats.create({
      data: {
        totalNodes: totalCount,
        activeNodes: onlineCount - Math.floor(Math.random() * 2), // Slight variation
        meshStrength: Math.floor(Math.random() * 10) + 80, // 80-90%
        bandwidth: `${(Math.random() * 0.5 + 2.2).toFixed(1)} Gbps`,
        latency: Math.floor(Math.random() * 15) + 8, // 8-23ms
        uptime: parseFloat((Math.random() * 1.5 + 98.5).toFixed(1)), // 98.5-100%
        recordedAt: date,
      },
    });
    networkStatsEntries.push(stats);
  }

  console.log(`✅ Created ${networkStatsEntries.length} network statistics entries`);

  // Summary
  console.log('\n✨ Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   👥 Users: 3`);
  console.log(`   🌐 Network Configs: 1`);
  console.log(`   📍 IP Addresses: ${ipAddresses.length}`);
  console.log(`   🚜 Equipment: ${equipment.length}`);
  console.log(`   🔗 IP Assignments: ${assignments.length}`);
  console.log(`   📝 Audit Logs: ${auditLogs.length}`);
  console.log(`   🚨 Alerts: ${alerts.length}`);
  console.log(`   📊 Network Stats: ${networkStatsEntries.length}`);
  console.log('\n🔑 Login Credentials:');
  console.log(`   Admin: admin@mining.local / password123`);
  console.log(`   Manager: manager@mining.local / password123`);
  console.log(`   Technician: tech@mining.local / password123`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

