import { Component, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UploadService } from '../../../../core/services/upload.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * File upload metadata
 */
export interface UploadFile {
  file: File;
  originalName: string;
  size: number;
  mimeType: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  preview?: string;
  error?: string;
  uploadResponse?: {
    fileName: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    relativePath: string;
  };
}

/**
 * FileUploadComponent
 *
 * Reusable drag-drop file upload component with progress tracking, validation,
 * and customizable file type support. Wraps the existing UploadService.
 *
 * @example – Basic usage
 * ```html
 * <app-file-upload
 *   folder="claim-documents"
 *   label="Upload Claim Documents"
 *   [allowedExtensions]="['pdf', 'doc', 'docx']"
 *   (uploadComplete)="onDocumentUploaded($event)"
 * ></app-file-upload>
 * ```
 *
 * @example – Image upload with preview
 * ```html
 * <app-file-upload
 *   folder="member-photos"
 *   label="Upload Profile Photo"
 *   [allowedExtensions]="['jpg', 'jpeg', 'png']"
 *   [maxFileSize]="5242880"
 *   [multiple]="false"
 *   [showPreview]="true"
 *   (uploadComplete)="onPhotoUploaded($event)"
 * ></app-file-upload>
 * ```
 *
 * @example – Multi-type upload
 * ```html
 * <app-file-upload
 *   folder="investigation-files"
 *   label="Investigation Documents"
 *   [allowedExtensions]="['pdf', 'doc', 'docx', 'jpg', 'png']"
 *   [multiple]="true"
 *   (uploadComplete)="onInvestigationFileUploaded($event)"
 * ></app-file-upload>
 * ```
 */
@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-upload.component.html',
})
export class FileUploadComponent implements OnDestroy {
  /**
   * Backend folder where files will be uploaded
   * e.g., 'claim-documents', 'member-photos', 'investigation-files'
   */
  @Input() folder: string = 'uploads';

  /**
   * Component label
   */
  @Input() label: string = 'Upload File';

  /**
   * Helper text below the component
   */
  @Input() hint: string = '';

  /**
   * Allowed file extensions (without dots)
   * e.g., ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png']
   */
  @Input() allowedExtensions: string[] = [
    'pdf',
    'doc',
    'docx',
    'jpg',
    'jpeg',
    'png',
  ];

  /**
   * Maximum file size in bytes (default 10MB = 10485760)
   */
  @Input() maxFileSize: number = 10485760;

  /**
   * Allow multiple file uploads
   */
  @Input() multiple: boolean = true;

  /**
   * Mark field as required
   */
  @Input() required: boolean = false;

  /**
   * Disable upload functionality
   */
  @Input() disabled: boolean = false;

  /**
   * Start upload immediately after file selection
   */
  @Input() autoUpload: boolean = true;

  /**
   * Show image previews/thumbnails
   */
  @Input() showPreview: boolean = true;

  // ────────────────────────────────────────────────────────────────

  /**
   * Emitted when user starts uploading a file
   */
  @Output() uploadStart = new EventEmitter<File>();

  /**
   * Emitted during upload with progress percentage
   */
  @Output() uploadProgress = new EventEmitter<{
    fileName: string;
    progress: number;
  }>();

  /**
   * Emitted when upload completes successfully
   */
  @Output() uploadComplete = new EventEmitter<{
    file: File;
    response: {
      fileName: string;
      originalName: string;
      mimeType: string;
      size: number;
      url: string;
      relativePath: string;
    };
  }>();

  /**
   * Emitted when upload fails
   */
  @Output() uploadError = new EventEmitter<{
    file: File;
    error: string;
  }>();

  /**
   * Emitted when file is selected (before upload, if autoUpload=false)
   */
  @Output() fileSelected = new EventEmitter<File | File[]>();

  // ────────────────────────────────────────────────────────────────

  files: UploadFile[] = [];
  isDraggingOver: boolean = false;
  private destroy$ = new Subject<void>();
  private uploadAbortControllers = new Map<UploadFile, AbortController>();

  constructor(private uploadService: UploadService) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.uploadAbortControllers.forEach((controller) =>
      controller.abort()
    );
  }

  /**
   * Generate accepted file types string for input[accept]
   */
  get acceptedFileTypes(): string {
    return this.allowedExtensions.map((ext) => '.' + ext).join(',');
  }

  /**
   * File selected via file picker
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const fileList = input.files;

    if (fileList && fileList.length > 0) {
      const selectedFiles = Array.from(fileList);

      if (!this.multiple && selectedFiles.length > 1) {
        const error = 'Only one file can be uploaded at a time';
        this.uploadError.emit({
          file: selectedFiles[0],
          error,
        });
        return;
      }

      if (!this.multiple) {
        // Clear previous files if single upload mode
        this.files = [];
      }

      this.fileSelected.emit(
        this.multiple ? selectedFiles : selectedFiles[0]
      );
      this.processFiles(selectedFiles);

      // Reset input so same file can be selected again
      input.value = '';
    }
  }

  /**
   * Drag over – visual feedback
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOver = true;
  }

  /**
   * Drag leave
   */
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOver = false;
  }

  /**
   * Drop handler
   */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOver = false;

    const droppedFiles = event.dataTransfer?.files;
    if (droppedFiles && droppedFiles.length > 0) {
      const filesArray = Array.from(droppedFiles);

      if (!this.multiple && filesArray.length > 1) {
        const error = 'Only one file can be uploaded at a time';
        this.uploadError.emit({
          file: filesArray[0],
          error,
        });
        return;
      }

      if (!this.multiple) {
        // Clear previous files if single upload mode
        this.files = [];
      }

      this.fileSelected.emit(
        this.multiple ? filesArray : filesArray[0]
      );
      this.processFiles(filesArray);
    }
  }

  /**
   * Process selected files: validate and upload
   */
  private processFiles(selectedFiles: File[]): void {
    for (const file of selectedFiles) {
      const uploadFile: UploadFile = {
        file,
        originalName: file.name,
        size: file.size,
        mimeType: file.type,
        status: 'pending',
        progress: 0,
      };

      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        uploadFile.status = 'error';
        uploadFile.error = validation.error;
        this.files.push(uploadFile);
        this.uploadError.emit({
          file,
          error: validation.error || 'Validation failed',
        });
        continue;
      }

      // Generate preview for images
      if (this.showPreview && this.isImageFile(file)) {
        this.generatePreview(file).then((preview) => {
          uploadFile.preview = preview;
        });
      }

      this.files.push(uploadFile);

      // Auto-upload if enabled
      if (this.autoUpload) {
        this.uploadFile(uploadFile);
      }
    }
  }

  /**
   * Validate file size and extension
   */
  private validateFile(
    file: File
  ): { valid: boolean; error?: string } {
    // Check size
    if (file.size > this.maxFileSize) {
      const maxMB = (this.maxFileSize / 1024 / 1024).toFixed(1);
      return {
        valid: false,
        error: `File size exceeds ${maxMB}MB limit`,
      };
    }

    // Check extension
    const fileName = file.name.toLowerCase();
    const hasValidExtension = this.allowedExtensions.some((ext) =>
      fileName.endsWith('.' + ext.toLowerCase())
    );

    if (!hasValidExtension) {
      return {
        valid: false,
        error: `File type not allowed. Supported: ${this.allowedExtensions
          .join(', ')
          .toUpperCase()}`,
      };
    }

    return { valid: true };
  }

  /**
   * Upload a file
   */
  uploadFile(uploadFile: UploadFile): void {
    if (uploadFile.status === 'uploading') {
      return; // Already uploading
    }

    uploadFile.status = 'uploading';
    uploadFile.progress = 0;
    this.uploadStart.emit(uploadFile.file);

    this.uploadService
      .uploadWithProgress(uploadFile.file, this.folder)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (event: any) => {
          if (event.type === 'progress') {
            uploadFile.progress = Math.round(
              (event.loaded / event.total) * 100
            );
            this.uploadProgress.emit({
              fileName: uploadFile.originalName,
              progress: uploadFile.progress,
            });
          } else if (event.type === 'complete') {
            uploadFile.status = 'success';
            uploadFile.progress = 100;
            uploadFile.uploadResponse = event.response;
            this.uploadComplete.emit({
              file: uploadFile.file,
              response: event.response,
            });
          }
        },
        error: (error: any) => {
          uploadFile.status = 'error';
          uploadFile.error =
            error.error?.message || error.message || 'Upload failed';
          this.uploadError.emit({
            file: uploadFile.file,
            error: uploadFile.error || 'Unknown error',
          });
        },
      });
  }

  /**
   * Cancel upload
   */
  cancelUpload(uploadFile: UploadFile): void {
    const controller = this.uploadAbortControllers.get(uploadFile);
    if (controller) {
      controller.abort();
      this.uploadAbortControllers.delete(uploadFile);
    }
    uploadFile.status = 'pending';
    uploadFile.progress = 0;
  }

  /**
   * Retry failed upload
   */
  retryUpload(uploadFile: UploadFile): void {
    uploadFile.error = undefined;
    this.uploadFile(uploadFile);
  }

  /**
   * Remove file from list
   */
  removeFile(uploadFile: UploadFile): void {
    const index = this.files.indexOf(uploadFile);
    if (index > -1) {
      this.cancelUpload(uploadFile);
      this.files.splice(index, 1);
    }
  }

  /**
   * Download file
   */
  downloadFile(uploadFile: UploadFile): void {
    if (uploadFile.uploadResponse?.url) {
      const link = document.createElement('a');
      link.href = uploadFile.uploadResponse.url;
      link.download = uploadFile.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  /**
   * Check if file is an image
   */
  isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  }

  /**
   * Generate preview for image files
   */
  private generatePreview(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        resolve(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Format bytes to human readable
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
  }

  /**
   * Get status icon
   */
  getStatusIcon(status: string): string {
    switch (status) {
      case 'uploading':
        return '⏳';
      case 'success':
        return '✓';
      case 'error':
        return '❌';
      default:
        return '📄';
    }
  }
}
