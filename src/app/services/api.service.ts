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

class Post {
  body?: string;
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

  getPosts(token: string) {
    const reqHeader = new HttpHeaders({ 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<Post>(`${this.apiUrl}/api/post`, { headers: reqHeader });
  }

  getPost(token: string, postId: string) {
    const reqHeader = new HttpHeaders({ 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<Post>(`${this.apiUrl}/api/post/${postId}`, { headers: reqHeader });
  }

  postPost(token: string, body: string) {
    const reqHeader = new HttpHeaders({ 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    return this.http.post<Post>(`${this.apiUrl}/api/post`, { body }, { headers: reqHeader });
  }

  postLike(token: string, postId: string) {
    const reqHeader = new HttpHeaders({ 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<Post>(`${this.apiUrl}/api/postlike`, {
      post: +postId
    }, { headers: reqHeader });
  }

  postComment(token: string, postId: number, comment: string) {
    const reqHeader = new HttpHeaders({ 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<Post>(`${this.apiUrl}/api/postcomment`, {
      post: postId,
      comment: comment
    }, { headers: reqHeader });
  }

  getSwords(token: string) {
    const reqHeader = new HttpHeaders({ 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<Sword>(`${this.apiUrl}/api/sword`, { headers: reqHeader });
  }

}
