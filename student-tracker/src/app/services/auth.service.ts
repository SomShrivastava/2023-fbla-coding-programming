import { Injectable } from '@angular/core';
import { GoogleAuthProvider, UserCredential } from 'firebase/auth';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { BehaviorSubject } from 'rxjs';
import { User } from '../interfaces/user.interface';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { Constants } from '../app.constants';
import { Timestamp } from "firebase/firestore";

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user = new BehaviorSubject<User>({} as User);

  quarter: string;

  constructor(
    private afAuth: AngularFireAuth,
    private db: AngularFirestore,
    private messageService: MessageService,
    private router: Router
  ) {
    let today = Timestamp.now().toMillis();

    if (today >= Constants.q1initial && today <= Constants.q1final) {
      this.quarter = "q1";
    } else if (today >= Constants.q2initial && today <= Constants.q2final) {
      this.quarter = "q2";
    } else if (today >= Constants.q3initial && today <= Constants.q3final) {
      this.quarter = "q3";
    } else if (today >= Constants.q4initial && today <= Constants.q4final) {
      this.quarter = "q4";
    }
  }

  // runs auth providers
  googleAuthLogin() {
    return this.afAuth
      .signInWithPopup(new GoogleAuthProvider())
      .then(result => {
        this.authorizeUser(result);
      })
      .catch((error) => {
        this.messageService.add({ severity: 'error', summary: 'Login', detail: 'There was an error in logging in, try again' });
      });
  }

  authorizeUser(result) {
    let user: User = {
      id: result.user.uid,
      name: result.user.displayName,
      email: result.user.email,
      pfp: result.user.photoURL,
      points: 0,
      quarter: this.quarter,
      events: Constants.EVENTS[this.quarter]
    };
    this.db.collection("users").doc(result.user.uid).ref.get()
      .then((doc) => {
        if (doc.exists) {
          user = doc.data() as User;
          if (user.quarter != this.quarter) {
            user.points = 0;
            user.quarter = this.quarter;
            user.events = Constants.EVENTS[this.quarter]
            this.db.collection("users").doc(user.id).set(user);
            this.user.next(user);
          };
          this.messageService.add({ severity: 'success', summary: 'Login', detail: 'You have successfully logged in' });
          this.router.navigateByUrl(`dashboard?userId=${user.id}`);
        } else {
          this.router.navigateByUrl("signup");
          this.user.next(user);
        }
      })
      .catch(() => {
        this.messageService.add({ severity: 'error', summary: 'Login', detail: 'There was an error in logging in, try again' });
      })
  }

  addNewUser(user: User) {
    this.db.collection("users").doc(user.id).set(user)
      .then(() => {
        this.user.next(user);
        this.router.navigateByUrl(`dashboard?userId=${user.id}`);
        this.messageService.add({ severity: 'success', summary: 'Sign Up', detail: 'You have successfully signed up' });
      })
      .catch(() => {
        this.router.navigateByUrl("signup");
        this.messageService.add({ severity: 'error', summary: 'Sign Up', detail: 'There was an error in signing up, try again' });
      })
  }

  updateUser(user: User) {
    user.points = 0;
    for (let event of user.events) {
      if (event.attended) {
        if (event.type == "Attended") {
          user.points += (event.timeLength * 10);
        } else if (event.type == "Volunteered") {
          user.points += (event.timeLength * 20);
        } else if (event.type == "Participated In") {
          user.points += (event.timeLength * 30);
        }
      }
    }
    this.db.collection("users").doc(user.id).update(user);
    this.user.next(user);
  }
}
