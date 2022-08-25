import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

class Token {
  access?: string;
  refresh?: string;
}

class Sword {
  sword_name?: string;
  timestamp?: Date;
  updated?: Date;
  user?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  apiUrl = "http://localhost:8000";

  constructor(private http: HttpClient) { }

  getLogin(username: string, password: string) {
    return this.http.post<Token>(`${this.apiUrl}/token/`, {
      username, password
    });
  }

  getSwords(token: string) {
    const reqHeader = new HttpHeaders({ 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<Sword>(`${this.apiUrl}/api/sword`, { headers: reqHeader });
  }

}
