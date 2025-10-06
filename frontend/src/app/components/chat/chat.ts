import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  TextProcessorService,
  HistoryItem,
  ServiceRequest,
} from '../../services/text-processor-service';
import { UserService } from '../../services/user-service';

type ActionType =
  | 'Analizar'
  | 'Editar'
  | 'Palabras clave'
  | 'Resumir'
  | 'Traducir';

@Component({
  selector: 'app-chat',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class Chat implements OnInit, AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  form!: FormGroup;
  actions: ActionType[] = [
    'Analizar',
    'Editar',
    'Palabras clave',
    'Resumir',
    'Traducir',
  ];
  history: HistoryItem[] = [];
  isLoading = true;

  constructor(
    private fb: FormBuilder,
    private textProcessorService: TextProcessorService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadHistory();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop =
        this.scrollContainer.nativeElement.scrollHeight;
    } catch (err) {
      console.error('Scroll error:', err);
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      text: ['', Validators.required],
      selectedAction: ['Analizar', Validators.required],
      style: [''],
      count: [5],
      language: [''],
    });

    this.form.get('selectedAction')?.valueChanges.subscribe(() => {
      this.form.patchValue({
        style: '',
        count: 5,
        language: '',
      });
    });
  }

  private loadHistory(): void {
    const userId = this.getUserIdFromSession();

    this.textProcessorService.getUserHistory(userId).subscribe({
      next: (response) => {
        this.history = response.history.reverse();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading history:', error);
        this.isLoading = false;
      },
    });
  }

  get selectedAction(): ActionType {
    return this.form.get('selectedAction')?.value;
  }

  showExtraInput(): 'style' | 'count' | 'language' | null {
    switch (this.selectedAction) {
      case 'Editar':
        return 'style';
      case 'Palabras clave':
        return 'count';
      case 'Traducir':
        return 'language';
      default:
        return null;
    }
  }

  getServiceTypeLabel(serviceType: string): string {
    const labels: { [key: string]: string } = {
      analytics: 'Analizar',
      editing: 'Editar',
      keywords: 'Palabras clave',
      summary: 'Resumir',
      translation: 'Traducir',
    };
    return labels[serviceType] || serviceType;
  }

  hasError(response: any): boolean {
    return response && response.error !== undefined;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  process(): void {
    if (!this.form.get('text')?.value.trim()) {
      console.warn('El texto no puede estar vacío');
      return;
    }

    const userId = this.getUserIdFromSession();
    const formValue = this.form.value;
    let request: ServiceRequest;

    switch (this.selectedAction) {
      case 'Traducir':
        request = {
          type: 'translation',
          user_id: userId,
          text: formValue.text,
          targetLang: formValue.language,
        };
        break;
      case 'Resumir':
        request = {
          type: 'summary',
          user_id: userId,
          text: formValue.text,
        };
        break;
      case 'Palabras clave':
        request = {
          type: 'keywords',
          user_id: userId,
          text: formValue.text,
          count: formValue.count,
        };
        break;
      case 'Editar':
        request = {
          type: 'editing',
          user_id: userId,
          text: formValue.text,
          style: formValue.style,
        };
        break;
      case 'Analizar':
        request = {
          type: 'analytics',
          user_id: userId,
          text: formValue.text,
        };
        break;
    }

    this.isLoading = true;

    this.textProcessorService.processText(request).subscribe({
      next: (res) => {
        const formattedItem = this.formatImmediateResponse(
          res,
          request.type,
          request.text
        );
        this.history.push(formattedItem);
        this.isLoading = false;
        this.form.patchValue({ text: '' });
      },
      error: (err) => {
        const formattedItem = this.formatImmediateResponse(
          err,
          request.type,
          request.text
        );
        this.history.push(formattedItem);
        this.isLoading = false;
      },
    });
  }

  private getUserIdFromSession(): number {
    const userId = sessionStorage.getItem('user_id');
    return userId ? parseInt(userId, 10) : 1;
  }

  private formatImmediateResponse(
    response: any,
    type: string,
    inputText: string
  ): HistoryItem {
    const now = new Date().toISOString();
    let formattedResponse: any = {};

    if (response?.error || response?.status >= 400) {
      formattedResponse = {
        error:
          response?.error?.error ||
          `Request failed with status code ${response.status || 'unknown'}`,
      };
    } else {
      switch (type) {
        case 'translation':
          formattedResponse = { translated: response.translated || '' };
          break;
        case 'summary':
          formattedResponse = { summary: response.summary || '' };
          break;
        case 'editing':
          formattedResponse = { edited: response.edited || '' };
          break;
        case 'keywords':
          formattedResponse = { keywords: response.keywords || [] };
          break;
        case 'analytics':
          formattedResponse = {
            sentiment: response.sentiment || '',
            wordCount: response.wordCount || 0,
            sentenceCount: response.sentenceCount || 0,
            mainTopics: response.mainTopics || [],
          };
          break;
        default:
          formattedResponse = response;
      }
    }

    return {
      request_id: 0,
      service_type: type,
      input_text: inputText,
      request_created_at: now,
      response: formattedResponse,
      response_created_at: now,
    };
  }

  onDeleteHistory() {
    const userId = Number(sessionStorage.getItem('user_id'));
    if (!userId) {
      console.error('No se encontró user_id en sessionStorage');
      return;
    }

    this.userService.deleteHistory(userId).subscribe({
      next: () => {
        this.history = [];
      },
      error: (err) => {
        console.error('Error eliminando historial:', err);
      },
    });
  }
}
