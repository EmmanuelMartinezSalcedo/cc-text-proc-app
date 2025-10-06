import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface HistoryResponse {
  user_id: number;
  history: HistoryItem[];
}

export interface HistoryItem {
  request_id: number;
  service_type: string;
  input_text: string;
  request_created_at: string;
  response: any;
  response_created_at: string;
}

export interface ServiceRequest {
  type: 'translation' | 'summary' | 'keywords' | 'editing' | 'analytics';
  user_id: number;
  text: string;
  style?: string;
  count?: number;
  targetLang?: string;
}

@Injectable({
  providedIn: 'root',
})
export class TextProcessorService {
  private baseUrl = 'http://localhost:4000';

  constructor(private http: HttpClient) {}

  getUserHistory(userId: number): Observable<HistoryResponse> {
    return this.http.get<HistoryResponse>(
      `${this.baseUrl}/users/history?user_id=${userId}`
    );
  }

  processText(request: ServiceRequest): Observable<any> {
    const { type, ...payload } = request;
    return this.http.post<any>(
      `${this.baseUrl}/microservices/${type}`,
      payload
    );
  }
}
