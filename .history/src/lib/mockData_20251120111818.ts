import { PTWStatus } from '../components/shared/StatusBadge';

export interface Site {
  id: string;
  name: string;
  location: string;
  area: string;
  status: 'active' | 'inactive';
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'supervisor' | 'worker';
  site?: string;
  avatar?: string;
}

export type PTWCategory = 'General' | 'Height' | 'Electrical' | 'Hot Work' | 'Confined Space';

export interface PTW {
  id: string;
  ptwNumber: string;
  category: PTWCategory;
  status: PTWStatus;
  site: string;
  location: string;
  workDescription: string;
  issuer: string;
  assignedWorkers: string[];
  startDate: string;
  endDate: string;
  createdDate: string;
  hazards: string[];
  controlMeasures: string[];
  ppe: string[];
  swmsFile?: string;
  signatures: {
    issuer?: string;
    areaInCharge?: string;
    safetyInCharge?: string;
    siteLeader?: string;
    worker?: string;
  };
}

export const mockSites: Site[] = [
  { id: '1', name: 'Mumbai Data Center', location: 'Bandra Kurla Complex, Mumbai', area: '5000 sqm', status: 'active' },
  { id: '2', name: 'Bangalore Tech Park', location: 'Whitefield, Bangalore', area: '3500 sqm', status: 'active' },
  { id: '3', name: 'Delhi Telecom Hub', location: 'Connaught Place, New Delhi', area: '4200 sqm', status: 'active' },
  { id: '4', name: 'Hyderabad IT Campus', location: 'HITEC City, Hyderabad', area: '6000 sqm', status: 'inactive' },
];

export const mockSupervisors: User[] = [
  { id: 's1', name: 'Priya Sharma', email: 'priya.sharma@telecom.in', phone: '+91-98765-43210', role: 'supervisor', site: 'Mumbai Data Center' },
  { id: 's2', name: 'Rajesh Kumar', email: 'rajesh.kumar@telecom.in', phone: '+91-98765-43211', role: 'supervisor', site: 'Bangalore Tech Park' },
  { id: 's3', name: 'Anita Desai', email: 'anita.desai@telecom.in', phone: '+91-98765-43212', role: 'supervisor', site: 'Delhi Telecom Hub' },
];

export const mockWorkers: User[] = [
  { id: 'w1', name: 'Amit Patel', email: 'amit.patel@telecom.in', phone: '+91-98765-43220', role: 'worker', site: 'Mumbai Data Center' },
  { id: 'w2', name: 'Vikram Singh', email: 'vikram.singh@telecom.in', phone: '+91-98765-43221', role: 'worker', site: 'Mumbai Data Center' },
  { id: 'w3', name: 'Suresh Reddy', email: 'suresh.reddy@telecom.in', phone: '+91-98765-43222', role: 'worker', site: 'Bangalore Tech Park' },
  { id: 'w4', name: 'Karthik Iyer', email: 'karthik.iyer@telecom.in', phone: '+91-98765-43223', role: 'worker', site: 'Bangalore Tech Park' },
  { id: 'w5', name: 'Ramesh Gupta', email: 'ramesh.gupta@telecom.in', phone: '+91-98765-43224', role: 'worker', site: 'Delhi Telecom Hub' },
  { id: 'w6', name: 'Arun Nair', email: 'arun.nair@telecom.in', phone: '+91-98765-43225', role: 'worker', site: 'Delhi Telecom Hub' },
];

export const mockPTWs: PTW[] = [
  {
    id: 'ptw1',
    ptwNumber: 'PTW-2024-001',
    category: 'Height',
    status: 'approved',
    site: 'Mumbai Data Center',
    location: 'Tower A - Rooftop',
    workDescription: 'Antenna installation and maintenance work',
    issuer: 'Priya Sharma',
    assignedWorkers: ['Amit Patel', 'Vikram Singh'],
    startDate: '2024-11-18',
    endDate: '2024-11-18',
    createdDate: '2024-11-17',
    hazards: ['Fall from height', 'Slippery surface'],
    controlMeasures: ['Use safety harness', 'Install guard rails', 'Weather check'],
    ppe: ['helmet', 'harness', 'boots', 'gloves'],
    swmsFile: 'antenna-installation-swms.pdf',
    signatures: {
      issuer: 'data:image/signature1',
      areaInCharge: 'data:image/signature2',
      safetyInCharge: 'data:image/signature3',
      siteLeader: 'data:image/signature4',
    },
  },
  {
    id: 'ptw2',
    ptwNumber: 'PTW-2024-002',
    category: 'Electrical',
    status: 'in-progress',
    site: 'Bangalore Tech Park',
    location: 'Server Room - UPS Area',
    workDescription: 'UPS battery replacement and testing',
    issuer: 'Rajesh Kumar',
    assignedWorkers: ['Suresh Reddy'],
    startDate: '2024-11-18',
    endDate: '2024-11-19',
    createdDate: '2024-11-17',
    hazards: ['Electric shock', 'Arc flash'],
    controlMeasures: ['Lockout/tagout', 'Use insulated tools', 'Voltage testing'],
    ppe: ['helmet', 'gloves', 'glasses', 'vest'],
    swmsFile: 'electrical-work-swms.pdf',
    signatures: {
      issuer: 'data:image/signature1',
      worker: 'data:image/signature5',
    },
  },
  {
    id: 'ptw3',
    ptwNumber: 'PTW-2024-003',
    category: 'Hot Work',
    status: 'pending',
    site: 'Mumbai Data Center',
    location: 'Generator Room',
    workDescription: 'Welding and pipe fitting operations',
    issuer: 'Priya Sharma',
    assignedWorkers: ['Amit Patel'],
    startDate: '2024-11-19',
    endDate: '2024-11-19',
    createdDate: '2024-11-18',
    hazards: ['Fire hazard', 'Burns', 'Fumes'],
    controlMeasures: ['Fire watch', 'Fire extinguisher ready', 'Ventilation'],
    ppe: ['helmet', 'gloves', 'mask', 'vest'],
    signatures: {
      issuer: 'data:image/signature1',
    },
  },
  {
    id: 'ptw4',
    ptwNumber: 'PTW-2024-004',
    category: 'Confined Space',
    status: 'approved',
    site: 'Delhi Telecom Hub',
    location: 'Underground Cable Duct',
    workDescription: 'Cable duct inspection and cleaning',
    issuer: 'Anita Desai',
    assignedWorkers: ['Ramesh Gupta', 'Arun Nair'],
    startDate: '2024-11-20',
    endDate: '2024-11-20',
    createdDate: '2024-11-18',
    hazards: ['Oxygen deficiency', 'Toxic gases', 'Engulfment'],
    controlMeasures: ['Gas testing', 'Continuous monitoring', 'Rescue plan'],
    ppe: ['helmet', 'harness', 'mask', 'boots', 'gloves'],
    swmsFile: 'confined-space-swms.pdf',
    signatures: {
      issuer: 'data:image/signature1',
      safetyInCharge: 'data:image/signature3',
    },
  },
  {
    id: 'ptw5',
    ptwNumber: 'PTW-2024-005',
    category: 'General',
    status: 'completed',
    site: 'Bangalore Tech Park',
    location: 'Main Entrance - Security Gate',
    workDescription: 'General maintenance and painting',
    issuer: 'Rajesh Kumar',
    assignedWorkers: ['Suresh Reddy', 'Karthik Iyer'],
    startDate: '2024-11-15',
    endDate: '2024-11-16',
    createdDate: '2024-11-14',
    hazards: ['Slips and trips', 'Paint fumes'],
    controlMeasures: ['Barrier tape', 'Ventilation', 'Warning signs'],
    ppe: ['helmet', 'vest', 'gloves', 'mask'],
    signatures: {
      issuer: 'data:image/signature1',
      worker: 'data:image/signature5',
      areaInCharge: 'data:image/signature2',
    },
  },
  {
    id: 'ptw6',
    ptwNumber: 'PTW-2024-006',
    category: 'Electrical',
    status: 'initiated',
    site: 'Mumbai Data Center',
    location: 'Cooling Plant - Chiller Area',
    workDescription: 'Electrical motor maintenance',
    issuer: 'Priya Sharma',
    assignedWorkers: ['Vikram Singh'],
    startDate: '2024-11-21',
    endDate: '2024-11-21',
    createdDate: '2024-11-19',
    hazards: ['Electric shock', 'Moving parts'],
    controlMeasures: ['Lockout/tagout', 'Machine isolation', 'PPE compliance'],
    ppe: ['helmet', 'gloves', 'glasses', 'boots'],
    swmsFile: 'motor-maintenance-swms.pdf',
    signatures: {
      issuer: 'data:image/signature1',
    },
  },
  {
    id: 'ptw7',
    ptwNumber: 'PTW-2024-007',
    category: 'Height',
    status: 'closed',
    site: 'Delhi Telecom Hub',
    location: 'Communication Tower - Level 5',
    workDescription: 'Tower maintenance and inspection',
    issuer: 'Anita Desai',
    assignedWorkers: ['Ramesh Gupta'],
    startDate: '2024-11-10',
    endDate: '2024-11-11',
    createdDate: '2024-11-09',
    hazards: ['Fall from height', 'Weather exposure'],
    controlMeasures: ['Safety harness', 'Weather monitoring', 'Buddy system'],
    ppe: ['helmet', 'harness', 'boots', 'gloves', 'vest'],
    swmsFile: 'tower-maintenance-swms.pdf',
    signatures: {
      issuer: 'data:image/signature1',
      worker: 'data:image/signature5',
      areaInCharge: 'data:image/signature2',
      safetyInCharge: 'data:image/signature3',
      siteLeader: 'data:image/signature4',
    },
  },
  {
    id: 'ptw8',
    ptwNumber: 'PTW-2024-008',
    category: 'Hot Work',
    status: 'in-progress',
    site: 'Mumbai Data Center',
    location: 'Equipment Room - Floor 3',
    workDescription: 'Metal fabrication and welding for cable trays',
    issuer: 'Priya Sharma',
    assignedWorkers: ['Amit Patel', 'Vikram Singh'],
    startDate: '2024-11-20',
    endDate: '2024-11-20',
    createdDate: '2024-11-19',
    hazards: ['Fire hazard', 'Burns', 'Hot surfaces', 'Fumes'],
    controlMeasures: ['Fire watch', 'Fire extinguisher ready', 'Ventilation', 'Hot work permit'],
    ppe: ['helmet', 'gloves', 'mask', 'vest', 'boots'],
    swmsFile: 'hot-work-swms.pdf',
    signatures: {
      issuer: 'data:image/signature1',
      areaInCharge: 'data:image/signature2',
      safetyInCharge: 'data:image/signature3',
    },
  },
  {
    id: 'ptw9',
    ptwNumber: 'PTW-2024-009',
    category: 'General',
    status: 'rejected',
    site: 'Mumbai Data Center',
    location: 'Parking Area',
    workDescription: 'Parking lot resurfacing',
    issuer: 'Priya Sharma',
    assignedWorkers: ['Amit Patel'],
    startDate: '2024-11-22',
    endDate: '2024-11-23',
    createdDate: '2024-11-20',
    hazards: ['Slips and trips', 'Chemical exposure'],
    controlMeasures: ['Warning signs', 'Barrier tape', 'Ventilation'],
    ppe: ['helmet', 'gloves', 'mask', 'boots'],
    signatures: {
      issuer: 'data:image/signature1',
    },
  },
  {
    id: 'ptw10',
    ptwNumber: 'PTW-2024-010',
    category: 'Electrical',
    status: 'expired',
    site: 'Mumbai Data Center',
    location: 'Distribution Board - Basement',
    workDescription: 'Circuit breaker replacement',
    issuer: 'Priya Sharma',
    assignedWorkers: ['Vikram Singh'],
    startDate: '2024-11-05',
    endDate: '2024-11-05',
    createdDate: '2024-11-04',
    hazards: ['Electric shock', 'Arc flash'],
    controlMeasures: ['Lockout/tagout', 'Use insulated tools', 'Voltage testing'],
    ppe: ['helmet', 'gloves', 'glasses', 'vest'],
    swmsFile: 'electrical-work-swms.pdf',
    signatures: {
      issuer: 'data:image/signature1',
      areaInCharge: 'data:image/signature2',
    },
  },
  {
    id: 'ptw11',
    ptwNumber: 'PTW-2024-011',
    category: 'Confined Space',
    status: 'approved',
    site: 'Mumbai Data Center',
    location: 'Water Tank - Rooftop',
    workDescription: 'Water tank cleaning and inspection',
    issuer: 'Priya Sharma',
    assignedWorkers: ['Amit Patel', 'Vikram Singh'],
    startDate: '2024-11-25',
    endDate: '2024-11-25',
    createdDate: '2024-11-20',
    hazards: ['Oxygen deficiency', 'Drowning risk', 'Slippery surface'],
    controlMeasures: ['Gas testing', 'Continuous monitoring', 'Rescue equipment', 'Safety harness'],
    ppe: ['helmet', 'harness', 'mask', 'boots', 'gloves', 'vest'],
    swmsFile: 'confined-space-swms.pdf',
    signatures: {
      issuer: 'data:image/signature1',
      safetyInCharge: 'data:image/signature3',
      siteLeader: 'data:image/signature4',
    },
  },
  {
    id: 'ptw12',
    ptwNumber: 'PTW-2024-012',
    category: 'Height',
    status: 'initiated',
    site: 'Mumbai Data Center',
    location: 'External Wall - North Side',
    workDescription: 'Facade cleaning and maintenance',
    issuer: 'Priya Sharma',
    assignedWorkers: ['Vikram Singh'],
    startDate: '2024-11-26',
    endDate: '2024-11-26',
    createdDate: '2024-11-20',
    hazards: ['Fall from height', 'Swinging loads'],
    controlMeasures: ['Safety harness', 'Secure anchor points', 'Weather check', 'Barricade area below'],
    ppe: ['helmet', 'harness', 'boots', 'gloves', 'vest'],
    signatures: {
      issuer: 'data:image/signature1',
    },
  },
  {
    id: 'ptw13',
    ptwNumber: 'PTW-2024-013',
    category: 'General',
    status: 'pending',
    site: 'Mumbai Data Center',
    location: 'Lobby Area',
    workDescription: 'Interior renovation and painting',
    issuer: 'Priya Sharma',
    assignedWorkers: ['Amit Patel'],
    startDate: '2024-11-27',
    endDate: '2024-11-28',
    createdDate: '2024-11-20',
    hazards: ['Paint fumes', 'Slips and trips', 'Dust'],
    controlMeasures: ['Ventilation', 'Barrier tape', 'Warning signs', 'Dust control'],
    ppe: ['helmet', 'mask', 'gloves', 'vest'],
    signatures: {
      issuer: 'data:image/signature1',
    },
  },
  {
    id: 'ptw14',
    ptwNumber: 'PTW-2024-014',
    category: 'Hot Work',
    status: 'closed',
    site: 'Mumbai Data Center',
    location: 'Loading Bay',
    workDescription: 'Steel gate repair and welding',
    issuer: 'Priya Sharma',
    assignedWorkers: ['Amit Patel'],
    startDate: '2024-11-12',
    endDate: '2024-11-12',
    createdDate: '2024-11-11',
    hazards: ['Fire hazard', 'Burns', 'Fumes', 'Hot surfaces'],
    controlMeasures: ['Fire watch', 'Fire extinguisher ready', 'Ventilation', 'Clear combustibles'],
    ppe: ['helmet', 'gloves', 'mask', 'vest', 'boots'],
    swmsFile: 'hot-work-swms.pdf',
    signatures: {
      issuer: 'data:image/signature1',
      worker: 'data:image/signature5',
      areaInCharge: 'data:image/signature2',
      safetyInCharge: 'data:image/signature3',
      siteLeader: 'data:image/signature4',
    },
  },
  {
    id: 'ptw15',
    ptwNumber: 'PTW-2024-015',
    category: 'Electrical',
    status: 'completed',
    site: 'Mumbai Data Center',
    location: 'Backup Generator Room',
    workDescription: 'Generator maintenance and load testing',
    issuer: 'Priya Sharma',
    assignedWorkers: ['Vikram Singh'],
    startDate: '2024-11-16',
    endDate: '2024-11-17',
    createdDate: '2024-11-15',
    hazards: ['Electric shock', 'Moving parts', 'Noise', 'Exhaust fumes'],
    controlMeasures: ['Lockout/tagout', 'PPE compliance', 'Ear protection', 'Ventilation'],
    ppe: ['helmet', 'gloves', 'glasses', 'boots', 'vest'],
    swmsFile: 'generator-maintenance-swms.pdf',
    signatures: {
      issuer: 'data:image/signature1',
      worker: 'data:image/signature5',
      areaInCharge: 'data:image/signature2',
    },
  },
];

export function getPTWsByCategory() {
  const categories: Record<PTWCategory, number> = {
    'General': 0,
    'Height': 0,
    'Electrical': 0,
    'Hot Work': 0,
    'Confined Space': 0,
  };

  mockPTWs.forEach(ptw => {
    categories[ptw.category]++;
  });

  return Object.entries(categories).map(([name, value]) => ({ name, value }));
}