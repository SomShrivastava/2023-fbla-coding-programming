import { Injectable } from '@angular/core';
import { GoogleAuthProvider } from 'firebase/auth';
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
    this.getCurrentQuarter();
  }

  getCurrentQuarter() {
    // get current date in milliseconds
    let today = Timestamp.now().toMillis();

    // assign the quarter in which the date is in
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
    // initialize default user based on result given from auth provider
    let user: User = {
      id: result.user.uid,
      name: result.user.displayName,
      email: result.user.email,
      pfp: result.user.photoURL,
      points: 0,
      quarter: this.quarter,
      events: Constants.EVENTS[this.quarter]
    };
    // make a call to the database to get the user based on user id
    this.db.collection("users").doc(result.user.uid).ref.get()
      .then((doc) => {
        // check if doc exists
        if (doc.exists) {
          user = doc.data() as User;
          // check if the user is in the right quarter of the year
          if (user.quarter != this.quarter) {
            user.points = 0;
            user.quarter = this.quarter;
            user.events = Constants.EVENTS[this.quarter];
            this.db.collection("users").doc(user.id).set(user);
            this.user.next(user);
          };
          this.messageService.add({ severity: 'success', summary: 'Login', detail: 'You have successfully logged in' });
          // go to dashboard after the user has been authorized
          this.router.navigateByUrl(`dashboard?userId=${user.id}`);
        } else {
          // if the doc does not exist, the user is not in the database, make them sign up
          this.router.navigateByUrl("signup");
          this.user.next(user);
        }
      })
      .catch(() => {
        this.messageService.add({ severity: 'error', summary: 'Login', detail: 'There was an error in logging in, try again' });
      })
  }

  // add a new user to the database
  addNewUser(user: User) {
    // make a call to the database
    this.db.collection("users").doc(user.id).set(user)
      .then(() => {
        this.user.next(user);
        // take the user to the dashboard after the new user has been added to database
        this.router.navigateByUrl(`dashboard?userId=${user.id}`);
        this.messageService.add({ severity: 'success', summary: 'Sign Up', detail: 'You have successfully signed up' });
      })
      .catch(() => {
        // if there was an error, take user back to the sign up
        this.router.navigateByUrl("signup");
        this.messageService.add({ severity: 'error', summary: 'Sign Up', detail: 'There was an error in signing up, try again' });
      })
  }

  // update a user in the database
  updateUser(user: User) {
    // recalculate the number of points for the user
    user.points = 0;
    for (let event of user.events) {
      if (event.attended) {
        // points are calculated dependent on the what they did there and how long the event is
        if (event.type == "Attended") {
          user.points += (event.timeLength * 10);
        } else if (event.type == "Volunteered") {
          user.points += (event.timeLength * 20);
        } else if (event.type == "Participated In") {
          user.points += (event.timeLength * 30);
        }
      }
    }
    // make a call to the database
    this.db.collection("users").doc(user.id).update(user);
    this.user.next(user);
  }
}
