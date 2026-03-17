import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MqTemplateService } from '../../../core/services/mq-template.service';
import { ToastService } from '../../../core/services/toast.service';
import { MqBuilderData, MqBuilderCategory, MqBuilderTemplateItem } from '../../models/mq-template.model';

interface SelectedQuestion {
  question_id?: number;
  text: string;
  source: 'template' | 'custom';
  template_code?: string;
  lines: number;
}

@Component({
  selector: 'app-mq-builder-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mq-builder-modal.component.html',
  styleUrls: ['./mq-builder-modal.component.css']
})
export class MqBuilderModalComponent implements OnInit, OnDestroy {
  @Input() show = false;
  @Input() recipientType: 'HOSP' | 'PH' = 'HOSP';
  @Input() refNo = '';
  @Input() admissionId?: number;
  
  @Output() close = new EventEmitter<void>();
  @Output() generate = new EventEmitter<SelectedQuestion[]>();
  @Output() email = new EventEmitter<SelectedQuestion[]>();
  @Output() preview = new EventEmitter<SelectedQuestion[]>();

  loading = false;
  searchQuery = '';
  rawData: MqBuilderData | null = null;
  builderData: MqBuilderCategory[] = [];
  selectedQuestions: SelectedQuestion[] = [];
  showPreview = false;
  today = new Date();

  private destroy$ = new Subject<void>();

  constructor(
    private mqService: MqTemplateService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    if (this.show) {
      this.loadBuilderData();
    }
  }

  ngOnChanges(): void {
    if (this.show && !this.rawData) {
      this.loadBuilderData();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadBuilderData(): void {
    this.loading = true;
    this.mqService.getBuilderData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.rawData = data;
          this.updateBuilderData();
          this.loading = false;
        },
        error: () => {
          this.toast.error('Failed to load MQ templates');
          this.loading = false;
        }
      });
  }

  selectRecipient(type: 'HOSP' | 'PH'): void {
    this.recipientType = type;
    this.updateBuilderData();
  }

  updateBuilderData(): void {
    if (!this.rawData) return;
    this.builderData = this.recipientType === 'HOSP' ? this.rawData.hospital : this.rawData.policyholder;
    // expand the first one if not already
    if (this.builderData.length > 0 && this.builderData.every(c => !c.expanded)) {
      this.builderData[0].expanded = true;
    }
  }

  get filteredData(): MqBuilderCategory[] {
    if (!this.rawData) return [];
    let baseData = this.recipientType === 'HOSP' ? this.rawData.hospital : this.rawData.policyholder;
    
    // Group categories with same name to prevent duplicates in sidebar
    const grouped: Record<string, MqBuilderCategory> = {};
    baseData.forEach(cat => {
      if (!grouped[cat.category]) {
        grouped[cat.category] = { ...cat, items: [...cat.items], expanded: !!cat.expanded };
      } else {
        grouped[cat.category].items.push(...cat.items);
        if (cat.expanded) grouped[cat.category].expanded = true;
      }
    });
    const finalData = Object.values(grouped);

    if (!this.searchQuery) return finalData;
    const query = this.searchQuery.toLowerCase();
    return finalData.map(cat => ({
      ...cat,
      items: cat.items.filter(item => item.text.toLowerCase().includes(query))
    })).filter(cat => cat.items.length > 0);
  }

  toggleCategory(cat: MqBuilderCategory): void {
    cat.expanded = !cat.expanded;
  }

  isQuestionSelected(id: number): boolean {
    return this.selectedQuestions.some(q => q.question_id === id);
  }

  addQuestion(item: MqBuilderTemplateItem, cat: MqBuilderCategory): void {
    if (this.isQuestionSelected(item.question_id)) {
      this.removeQuestionById(item.question_id);
      return;
    }
    this.selectedQuestions.push({
      question_id: item.question_id,
      text: item.text,
      source: 'template',
      template_code: cat.template_code,
      lines: item.lines || 3
    });
  }

  removeQuestion(index: number): void {
    this.selectedQuestions.splice(index, 1);
  }

  removeQuestionById(id: number): void {
    const idx = this.selectedQuestions.findIndex(q => q.question_id === id);
    if (idx !== -1) this.selectedQuestions.splice(idx, 1);
  }

  addNewCustomQuestion(): void {
    this.selectedQuestions.push({
      text: '',
      source: 'custom',
      lines: 3
    });
  }

  reset(): void {
    this.selectedQuestions = [];
  }

  onCancel(): void {
    this.close.emit();
  }

  onGenerate(): void {
    if (this.selectedQuestions.length === 0) {
      this.toast.error('Please add at least one question');
      return;
    }
    this.generate.emit(this.selectedQuestions);
  }

  onEmail(): void {
    if (this.selectedQuestions.length === 0) {
      this.toast.error('Please add at least one question');
      return;
    }
    this.email.emit(this.selectedQuestions);
  }

  onPreview(): void {
    if (this.selectedQuestions.length === 0) {
      this.toast.error('Please add at least one question');
      return;
    }
    this.preview.emit(this.selectedQuestions);
    this.showPreview = true;
  }

  getLineArray(count: number): number[] {
    return Array(count).fill(0);
  }
}
