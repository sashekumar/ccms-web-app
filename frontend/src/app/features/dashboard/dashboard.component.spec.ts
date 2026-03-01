import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should be a standalone component', () => {
      const componentMetadata = (DashboardComponent as any).ɵcmp;
      expect(componentMetadata.standalone).toBe(true);
    });
  });

  describe('Component Initialization', () => {
    it('should initialize with cashless as active tab', () => {
      expect(component.activeTab).toBe('cashless');
    });

    it('should call ngOnInit', () => {
      const ngOnInitSpy = vi.spyOn(component, 'ngOnInit');
      component.ngOnInit();

      expect(ngOnInitSpy).toHaveBeenCalled();
    });
  });

  describe('Cashless Stats Data', () => {
    it('should have 4 cashless stat cards', () => {
      expect(component.cashlessStats).toBeDefined();
      expect(component.cashlessStats.length).toBe(4);
    });

    it('should have Active Cases stat', () => {
      const activeCasesStat = component.cashlessStats.find(s => s.label === 'Active Cases');
      
      expect(activeCasesStat).toBeDefined();
      expect(activeCasesStat?.count).toBe(24);
      expect(activeCasesStat?.icon).toBe('folder-open');
    });

    it('should have Pending Approval stat', () => {
      const pendingStat = component.cashlessStats.find(s => s.label === 'Pending Approval');
      
      expect(pendingStat).toBeDefined();
      expect(pendingStat?.count).toBe(8);
    });

    it('should have GL Issued Today stat', () => {
      const glIssuedStat = component.cashlessStats.find(s => s.label === 'GL Issued Today');
      
      expect(glIssuedStat).toBeDefined();
      expect(glIssuedStat?.count).toBe(15);
    });

    it('should have Declined / KIV stat', () => {
      const declinedStat = component.cashlessStats.find(s => s.label === 'Declined / KIV');
      
      expect(declinedStat).toBeDefined();
      expect(declinedStat?.count).toBe(2);
    });

    it('should have correct icon colors', () => {
      expect(component.cashlessStats[0].iconColor).toBe('text-blue-600');
      expect(component.cashlessStats[1].iconColor).toBe('text-yellow-600');
      expect(component.cashlessStats[2].iconColor).toBe('text-green-600');
      expect(component.cashlessStats[3].iconColor).toBe('text-red-600');
    });
  });

  describe('Reimbursement Stats Data', () => {
    it('should have 3 reimbursement stats', () => {
      expect(component.reimbStats).toBeDefined();
      expect(component.reimbStats.length).toBe(3);
    });

    it('should have NEW CLAIMS stat', () => {
      const newClaimsStat = component.reimbStats.find(s => s.label === 'NEW CLAIMS');
      
      expect(newClaimsStat).toBeDefined();
      expect(newClaimsStat?.count).toBe(42);
      expect(newClaimsStat?.desc).toBe('Awaiting Data Entry');
    });

    it('should have PENDING APPROVAL stat', () => {
      const pendingStat = component.reimbStats.find(s => s.label === 'PENDING APPROVAL');
      
      expect(pendingStat).toBeDefined();
      expect(pendingStat?.count).toBe(12);
      expect(pendingStat?.desc).toBe('Medical Review In Progress');
    });

    it('should have APPROVED stat', () => {
      const approvedStat = component.reimbStats.find(s => s.label === 'APPROVED');
      
      expect(approvedStat).toBeDefined();
      expect(approvedStat?.count).toBe(128);
      expect(approvedStat?.desc).toBe('Payment Scheduled');
    });
  });

  describe('Cashless Cases Data', () => {
    it('should have 4 cashless cases', () => {
      expect(component.cashlessCases).toBeDefined();
      expect(component.cashlessCases.length).toBe(4);
    });

    it('should have correct patient names', () => {
      const patientNames = component.cashlessCases.map(c => c.patientName);
      
      expect(patientNames).toContain('Ahmad bin Abdullah');
      expect(patientNames).toContain('Wong Mei Ling');
      expect(patientNames).toContain('Raj Kumar');
      expect(patientNames).toContain('Tan Siew Leng');
    });

    it('should have reference IDs', () => {
      component.cashlessCases.forEach(cashlessCase => {
        expect(cashlessCase.refId).toMatch(/^GL-2024-\d{4}$/);
      });
    });

    it('should have various statuses', () => {
      const statuses = component.cashlessCases.map(c => c.status);
      
      expect(statuses).toContain('Pending MO');
      expect(statuses).toContain('Approved');
      expect(statuses).toContain('Sent MQ');
      expect(statuses).toContain('Decline');
    });
  });

  describe('Reimbursement Cases Data', () => {
    it('should have 4 reimbursement cases', () => {
      expect(component.reimbCases).toBeDefined();
      expect(component.reimbCases.length).toBe(4);
    });

    it('should have correct claimant names', () => {
      const claimants = component.reimbCases.map(c => c.claimant);
      
      expect(claimants).toContain('Sarah Abdullah');
      expect(claimants).toContain('David Lee');
      expect(claimants).toContain('Kumar Patel');
      expect(claimants).toContain('Fatimah Binti Hassan');
    });

    it('should have policy numbers', () => {
      component.reimbCases.forEach(reimbCase => {
        expect(reimbCase.policy).toMatch(/^POL-2024-\d{4}$/);
      });
    });

    it('should have amount in RM format', () => {
      component.reimbCases.forEach(reimbCase => {
        expect(reimbCase.amount).toMatch(/^RM \d{1,3}(,\d{3})*$/);
      });
    });

    it('should have various statuses', () => {
      const statuses = component.reimbCases.map(c => c.status);
      
      expect(statuses).toContain('PENDING REGISTRATION');
      expect(statuses).toContain('REGISTERED');
      expect(statuses).toContain('FIRST REMINDER');
      expect(statuses).toContain('CLOSED');
    });
  });

  describe('setActiveTab()', () => {
    it('should set active tab to cashless', () => {
      component.setActiveTab('cashless');
      
      expect(component.activeTab).toBe('cashless');
    });

    it('should set active tab to reimb', () => {
      component.setActiveTab('reimb');
      
      expect(component.activeTab).toBe('reimb');
    });

    it('should set active tab to members', () => {
      component.setActiveTab('members');
      
      expect(component.activeTab).toBe('members');
    });

    it('should change tab from cashless to reimb', () => {
      expect(component.activeTab).toBe('cashless');
      
      component.setActiveTab('reimb');
      
      expect(component.activeTab).toBe('reimb');
    });
  });

  describe('getStatusClass()', () => {
    it('should return correct class for Pending MO', () => {
      const result = component.getStatusClass('Pending MO');
      
      expect(result).toBe('bg-yellow-100 text-yellow-800');
    });

    it('should return correct class for Approved', () => {
      const result = component.getStatusClass('Approved');
      
      expect(result).toBe('bg-green-100 text-green-800');
    });

    it('should return correct class for Sent MQ', () => {
      const result = component.getStatusClass('Sent MQ');
      
      expect(result).toBe('bg-blue-100 text-blue-800');
    });

    it('should return correct class for Decline', () => {
      const result = component.getStatusClass('Decline');
      
      expect(result).toBe('bg-red-100 text-red-800');
    });

    it('should return correct class for Withdrawn', () => {
      const result = component.getStatusClass('Withdrawn');
      
      expect(result).toBe('bg-gray-100 text-gray-800');
    });

    it('should return correct class for PENDING REGISTRATION', () => {
      const result = component.getStatusClass('PENDING REGISTRATION');
      
      expect(result).toBe('bg-yellow-100 text-yellow-800');
    });

    it('should return correct class for REGISTERED', () => {
      const result = component.getStatusClass('REGISTERED');
      
      expect(result).toBe('bg-blue-100 text-blue-800');
    });

    it('should return correct class for FIRST REMINDER', () => {
      const result = component.getStatusClass('FIRST REMINDER');
      
      expect(result).toBe('bg-orange-100 text-orange-800');
    });

    it('should return correct class for CLOSED', () => {
      const result = component.getStatusClass('CLOSED');
      
      expect(result).toBe('bg-gray-100 text-gray-800');
    });

    it('should return default class for unknown status', () => {
      const result = component.getStatusClass('UNKNOWN_STATUS');
      
      expect(result).toBe('bg-gray-100 text-gray-800');
    });

    it('should return default class for empty string', () => {
      const result = component.getStatusClass('');
      
      expect(result).toBe('bg-gray-100 text-gray-800');
    });
  });

  describe('TrackBy Functions', () => {
    describe('trackByStatLabel()', () => {
      it('should return stat label for cashless stat', () => {
        const stat = component.cashlessStats[0];
        const result = component.trackByStatLabel(0, stat);
        
        expect(result).toBe('Active Cases');
      });

      it('should return stat label for reimb stat', () => {
        const stat = component.reimbStats[0];
        const result = component.trackByStatLabel(0, stat);
        
        expect(result).toBe('NEW CLAIMS');
      });

      it('should work with different indices', () => {
        const stat1 = component.cashlessStats[0];
        const stat2 = component.cashlessStats[1];
        
        expect(component.trackByStatLabel(0, stat1)).not.toBe(component.trackByStatLabel(1, stat2));
      });
    });

    describe('trackByCaseId()', () => {
      it('should return case id for cashless case', () => {
        const cashlessCase = component.cashlessCases[0];
        const result = component.trackByCaseId(0, cashlessCase);
        
        expect(result).toBe('1');
      });

      it('should return case id for reimb case', () => {
        const reimbCase = component.reimbCases[0];
        const result = component.trackByCaseId(0, reimbCase);
        
        expect(result).toBe('1');
      });

      it('should return unique ids', () => {
        const ids = component.cashlessCases.map((c, i) => component.trackByCaseId(i, c));
        const uniqueIds = new Set(ids);
        
        expect(uniqueIds.size).toBe(component.cashlessCases.length);
      });
    });
  });
});
