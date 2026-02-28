import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface StatCard {
  icon: string;
  iconColor: string;
  iconBg: string;
  count: number;
  label: string;
}

interface ReimbStat {
  label: string;
  count: number;
  color: string;
  borderColor: string;
  desc: string;
}

interface CashlessCase {
  id: string;
  patientName: string;
  refId: string;
  hospital: string;
  time: string;
  status: string;
}

interface ReimbursementCase {
  id: string;
  claimant: string;
  policy: string;
  amount: string;
  status: string;
  date: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: [],
  standalone: true,
  imports: [CommonModule]
})
export class DashboardComponent implements OnInit {
  activeTab: 'cashless' | 'reimb' | 'members' = 'cashless';

  cashlessStats: StatCard[] = [
    { icon: 'folder-open', iconColor: 'text-blue-600', iconBg: 'bg-blue-100', count: 24, label: 'Active Cases' },
    { icon: 'clock', iconColor: 'text-yellow-600', iconBg: 'bg-yellow-100', count: 8, label: 'Pending Approval' },
    { icon: 'check-circle', iconColor: 'text-green-600', iconBg: 'bg-green-100', count: 15, label: 'GL Issued Today' },
    { icon: 'times-circle', iconColor: 'text-red-600', iconBg: 'bg-red-100', count: 2, label: 'Declined / KIV' }
  ];

  reimbStats: ReimbStat[] = [
    { label: 'NEW CLAIMS', count: 42, color: 'info', borderColor: 'border-blue-500', desc: 'Awaiting Data Entry' },
    { label: 'PENDING APPROVAL', count: 12, color: 'warning', borderColor: 'border-yellow-500', desc: 'Medical Review In Progress' },
    { label: 'APPROVED', count: 128, color: 'success', borderColor: 'border-green-500', desc: 'Payment Scheduled' }
  ];

  cashlessCases: CashlessCase[] = [
    { id: '1', patientName: 'Ahmad bin Abdullah', refId: 'GL-2024-0245', hospital: 'Hospital Pantai KL', time: '2 hrs ago', status: 'Pending MO' },
    { id: '2', patientName: 'Wong Mei Ling', refId: 'GL-2024-0246', hospital: 'Gleneagles Kuala Lumpur', time: '4 hrs ago', status: 'Approved' },
    { id: '3', patientName: 'Raj Kumar', refId: 'GL-2024-0247', hospital: 'Prince Court Medical Centre', time: '5 hrs ago', status: 'Sent MQ' },
    { id: '4', patientName: 'Tan Siew Leng', refId: 'GL-2024-0248', hospital: 'Sunway Medical Centre', time: '1 day ago', status: 'Decline' }
  ];

  reimbCases: ReimbursementCase[] = [
    { id: '1', claimant: 'Sarah Abdullah', policy: 'POL-2024-1234', amount: 'RM 5,200', status: 'PENDING REGISTRATION', date: '2024-02-10' },
    { id: '2', claimant: 'David Lee', policy: 'POL-2024-1235', amount: 'RM 3,800', status: 'REGISTERED', date: '2024-02-09' },
    { id: '3', claimant: 'Kumar Patel', policy: 'POL-2024-1236', amount: 'RM 12,500', status: 'FIRST REMINDER', date: '2024-02-08' },
    { id: '4', claimant: 'Fatimah Binti Hassan', policy: 'POL-2024-1237', amount: 'RM 6,750', status: 'CLOSED', date: '2024-02-07' }
  ];

  constructor() { }

  ngOnInit(): void {
    // Initialize dashboard
  }

  setActiveTab(tab: 'cashless' | 'reimb' | 'members'): void {
    this.activeTab = tab;
  }

  getStatusClass(status: string): string {
    const statusMap: Record<string, string> = {
      'Pending MO': 'bg-yellow-100 text-yellow-800',
      'Approved': 'bg-green-100 text-green-800',
      'Sent MQ': 'bg-blue-100 text-blue-800',
      'Decline': 'bg-red-100 text-red-800',
      'Withdrawn': 'bg-gray-100 text-gray-800',
      'PENDING REGISTRATION': 'bg-yellow-100 text-yellow-800',
      'REGISTERED': 'bg-blue-100 text-blue-800',
      'FIRST REMINDER': 'bg-orange-100 text-orange-800',
      'CLOSED': 'bg-gray-100 text-gray-800'
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * TrackBy functions for performance optimization
   */
  trackByStatLabel(index: number, stat: StatCard | ReimbStat): string {
    return stat.label;
  }

  trackByCaseId(index: number, item: CashlessCase | ReimbursementCase): string {
    return item.id;
  }
}
