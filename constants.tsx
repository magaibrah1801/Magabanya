
import { Equipment, EquipmentStatus, Category } from './types';

export const INITIAL_INVENTORY: Equipment[] = [
  {
    id: '1',
    name: '40" C-Stand w/ Grip Head & Arm',
    serialNumber: 'CS-40-001',
    category: Category.STANDS,
    status: EquipmentStatus.AVAILABLE,
    imageUrl: 'https://picsum.photos/seed/cstand1/400/300',
    notes: 'Standard Matthews spring-loaded',
    history: [
      { id: 'h1', equipmentId: '1', type: 'check-in', user: 'Sarah Miller', timestamp: '2024-05-19T14:20:00Z' },
      { id: 'h2', equipmentId: '1', type: 'check-out', user: 'James Wilson', timestamp: '2024-05-18T08:00:00Z' }
    ]
  },
  {
    id: '2',
    name: 'Combo Stand (3-Riser)',
    serialNumber: 'CM-002',
    category: Category.STANDS,
    status: EquipmentStatus.CHECKED_OUT,
    currentHolder: 'Sarah Miller',
    lastChecked: '2024-05-20T10:30:00Z',
    imageUrl: 'https://picsum.photos/seed/combo/400/300',
    history: [
      { id: 'h3', equipmentId: '2', type: 'check-out', user: 'Sarah Miller', timestamp: '2024-05-20T10:30:00Z' }
    ]
  },
  {
    id: '3',
    name: '12x12 Solid (Black)',
    serialNumber: 'TX-1212-01',
    category: Category.TEXTILES,
    status: EquipmentStatus.AVAILABLE,
    imageUrl: 'https://picsum.photos/seed/textile/400/300'
  },
  {
    id: '4',
    name: 'Aputure 600d Pro',
    serialNumber: 'LT-600D-05',
    category: Category.LIGHTING,
    status: EquipmentStatus.AVAILABLE,
    imageUrl: 'https://picsum.photos/seed/aputure/400/300',
    history: [
      { id: 'h4', equipmentId: '4', type: 'check-in', user: 'John Doe', timestamp: '2024-05-21T17:00:00Z', notes: 'Fans cleaned' }
    ]
  },
  {
    id: '5',
    name: 'Apple Box Set (Full, Half, Quarter, Pancake)',
    serialNumber: 'AB-SET-03',
    category: Category.GRIP_SUPPORT,
    status: EquipmentStatus.CHECKED_OUT,
    currentHolder: 'James Wilson',
    lastChecked: '2024-05-21T08:15:00Z',
    imageUrl: 'https://picsum.photos/seed/applebox/400/300'
  },
  {
    id: '6',
    name: 'Sandbag (20lb)',
    serialNumber: 'SB-20-112',
    category: Category.GRIP_SUPPORT,
    status: EquipmentStatus.AVAILABLE,
    imageUrl: 'https://picsum.photos/seed/sandbag/400/300'
  },
  {
    id: '7',
    name: '2k Variac Dimmer',
    serialNumber: 'EL-VAR-01',
    category: Category.ELECTRIC,
    status: EquipmentStatus.MAINTENANCE,
    notes: 'Needs fuse replacement',
    imageUrl: 'https://picsum.photos/seed/variac/400/300',
    history: [
      { id: 'h5', equipmentId: '7', type: 'maintenance', user: 'Studio Tech', timestamp: '2024-05-20T09:00:00Z', notes: 'Blown fuse reported' }
    ]
  }
];
