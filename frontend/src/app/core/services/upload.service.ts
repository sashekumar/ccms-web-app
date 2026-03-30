import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { HttpClient, HttpEvent, HttpEventType, HttpRequest } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs/operators';

export interface UploadResponse {
  fileName: string;
  originalName: string;
  url: string;
  relativePath: string;
}

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  private apiUrl = environment.apiUrl;

  constructor(
    private apiService: ApiService,
    private http: HttpClient
  ) {}

  /**
   * Upload file to backend
   * @param file File to upload
   * @param folder Target folder name on server
   */
  uploadFile(file: File, folder: string = 'general'): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    // Using HttpClient directly for progress if needed, but for now using apiService
    return this.apiService.post<any>('common/upload', formData);
  }

  /**
   * Universal method to upload with progress
   */
  uploadWithProgress(file: File, folder: string = 'general'): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const req = new HttpRequest('POST', `${this.apiUrl}/common/upload`, formData, {
      reportProgress: true,
      withCredentials: true
    });

    return this.http.request(req).pipe(
      map(event => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            // Return progress event with loaded and total for progress bar calculation
            return {
              type: 'progress',
              loaded: event.loaded || 0,
              total: event.total || 1
            };

          case HttpEventType.Response:
            // Return response event with the body data
            return {
              type: 'complete',
              response: event.body
            };
            
          default:
            return {
              type: 'other',
              event: event
            };
        }
      })
    );
  }
}
