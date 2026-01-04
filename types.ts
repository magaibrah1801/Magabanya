
export enum EquipmentStatus {
  AVAILABLE = 'Available',
  CHECKED_OUT = 'Checked Out',
  MAINTENANCE = 'Maintenance',
  LOST = 'Lost',
  DAMAGED = 'Damaged',
  ON_HOLD = 'On Hold'
}

export enum Category {
  STANDS = 'Stands',
  LIGHTING = 'Lighting',
  GRIP_SUPPORT = 'Grip Support',
  ELECTRIC = 'Electric',
  TEXTILES = 'Textiles & Flags',
  HARDWARE = 'Hardware',
  CAMERA_SUPPORT = 'Camera Support'
}

export enum Department {
  GRIP = 'Grip',
  ELECTRIC = 'Electric',
  CAMERA = 'Camera',
  PRODUCTION = 'Production',
  ART = 'Art'
}

export interface CompanyMember {
  id: string;
  name: string;
  position: string;
  department: Department;
  email?: string;
  phone?: string;
  joinedDate: string;
}

export interface Transaction {
  id: string;
  equipmentId: string;
  type: 'check-in' | 'check-out' | 'maintenance' | 'recovered' | 'damage-report' | 'project-assign' | 'status-change';
  timestamp: string;
  user: string;
  userPosition?: string; // Track position at time of transaction
  notes?: string;
  project?: string;
}

export interface Equipment {
  id: string;
  name: string;
  serialNumber: string;
  category: Category;
  subCategory?: string;
  status: EquipmentStatus;
  currentHolder?: string;
  currentHolderPosition?: string;
  lastChecked?: string;
  notes?: string;
  imageUrl?: string;
  history?: Transaction[];
  currentProject?: string;
  location?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface CompanyConfig {
  name: string;
  level: 'Indie' | 'Commercial' | 'Studio' | 'Union';
  foundedDate: string;
}
