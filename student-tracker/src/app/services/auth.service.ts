import { Injectable } from '@angular/core';
import { GoogleAuthProvider, UserCredential } from 'firebase/auth';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { BehaviorSubject } from 'rxjs';
import { User } from '../interfaces/user.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user = new BehaviorSubject({} as User);

  constructor(
    public afAuth: AngularFireAuth
  ) { }

  // runs auth providers
  googleAuthLogin() {
    return this.afAuth
      .signInWithPopup(new GoogleAuthProvider())
      .then(result => {
        this.authorizeUser(result);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  authorizeUser(result) {
    
  }
}
