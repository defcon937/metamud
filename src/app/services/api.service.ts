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
  hashtag?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  apiUrl = "/api";

  constructor(private http: HttpClient) { }

  getLogin(username: string, password: string) {
    return this.http.post<Token>(`${this.apiUrl}/token/`, {
      username, password
    });
  }

  postRegister(token: string, email: string, username: string, password: string) {
    return this.http.post<Token>(`${this.apiUrl}/api/register`, {
      first_name: token, email, username, password, password2: password
    });
  }

  getPosts(token: string, hashtags?: string[]) {
    const reqHeader = new HttpHeaders({ 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    if (hashtags) {
      return this.http.post<Post>(`${this.apiUrl}/api/posts`, {
        hashtags
      }, { headers: reqHeader });
    } else {
      return this.http.get<Post>(`${this.apiUrl}/api/posts`, { headers: reqHeader });
    }
  }

  getPost(token: string, postId: string) {
    const reqHeader = new HttpHeaders({ 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<Post>(`${this.apiUrl}/api/post/${postId}`, { headers: reqHeader });
  }

  postPost(token: string, hashtag: string, body: string) {
    const reqHeader = new HttpHeaders({ 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    return this.http.post<Post>(`${this.apiUrl}/api/post`, { hashtag, body }, { headers: reqHeader });
  }

  postEncounter(token: string, hashtag: string, action_name: string, action_type: string, action_level: number, body: string) {
    const reqHeader = new HttpHeaders({ 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    return this.http.post<Post>(`${this.apiUrl}/api/encounter`, {
      hashtag, body, action_name, action_type, action_level
    }, { headers: reqHeader });
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
  
  postEditPost(token: string, postId: string, key: string, value: string) {
    const reqHeader = new HttpHeaders({ 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.http.patch<Post>(`${this.apiUrl}/api/post/${postId}`, {
      key, value
    }, { headers: reqHeader });
  }

  postEditComment(token: string, commentId: string, key: string, value: string) {
    const reqHeader = new HttpHeaders({ 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.http.patch<Post>(`${this.apiUrl}/api/comment/${commentId}`, {
      key, value
    }, { headers: reqHeader });
  }

  postLikeComment(token: string, commentId: string) {
    const reqHeader = new HttpHeaders({ 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<Post>(`${this.apiUrl}/api/commentlike`, {
      comment: +commentId
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

  getFollow(token: string) {
    const reqHeader = new HttpHeaders({ 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<Post>(`${this.apiUrl}/api/follow`, { headers: reqHeader });
  }

  postFollow(token: string, hashtag: string) {
    const reqHeader = new HttpHeaders({ 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<Post>(`${this.apiUrl}/api/follow`, {
      hashtag
    }, { headers: reqHeader });
  }

  postSimpleAttack(token: string, postId: number, comment: string) {
    const reqHeader = new HttpHeaders({ 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<Post>(`${this.apiUrl}/api/simpleattack`, {
      post: postId,
      comment: comment
    }, { headers: reqHeader });
  }

  postCommentRoll(token: string, postId: number, dice_count: number, dice_size: number) {
    const reqHeader = new HttpHeaders({ 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<Post>(`${this.apiUrl}/api/postcommentroll`, {
      post: postId,
      dice_size,
      dice_count
    }, { headers: reqHeader });
  }
}
