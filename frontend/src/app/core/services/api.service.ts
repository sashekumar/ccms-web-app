import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * API Service - Base HTTP service for API communication
 */
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * GET request
   */
  get<T>(endpoint: string, params?: Record<string, string | number | boolean>, headers?: Record<string, string>): Observable<T> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.append(key, params[key]);
        }
      });
    }

    if (headers) {
      return this.http.get<T>(`${this.apiUrl}/${endpoint}`, {
        params: httpParams,
        headers: new HttpHeaders(headers),
        withCredentials: true
      });
    } else {
      return this.http.get<T>(`${this.apiUrl}/${endpoint}`, {
        params: httpParams,
        withCredentials: true
      });
    }
  }

  /**
   * POST request
   */
  post<T>(endpoint: string, body: unknown, headers?: Record<string, string>): Observable<T> {
    if (headers) {
      return this.http.post<T>(`${this.apiUrl}/${endpoint}`, body, {
        headers: new HttpHeaders(headers),
        withCredentials: true
      });
    } else {
      return this.http.post<T>(`${this.apiUrl}/${endpoint}`, body, {
        withCredentials: true
      });
    }
  }

  /**
   * PUT request
   */
  put<T>(endpoint: string, body: unknown): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}/${endpoint}`, body, {
      withCredentials: true
    });
  }

  /**
   * DELETE request
   */
  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}/${endpoint}`, {
      withCredentials: true
    });
  }

  /**
   * PATCH request
   */
  patch<T>(endpoint: string, body: unknown): Observable<T> {
    return this.http.patch<T>(`${this.apiUrl}/${endpoint}`, body, {
      withCredentials: true
    });
  }
}
