import { Component, OnDestroy, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { Timestamp } from 'firebase/firestore';
import { Subject, takeUntil } from 'rxjs';
import { Constants } from 'src/app/app.constants';
import { History } from 'src/app/interfaces/history.interface';
import { User } from 'src/app/interfaces/user.interface';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  destroy$: Subject<void> = new Subject();

  userId: string;

  user: User;

  users: User[];

  currentTab: string = "Dashboard";

  history: History[];

  constructor(
    private activeRoute: ActivatedRoute,
    private authService: AuthService,
    private db: AngularFirestore
  ) { }

  ngOnInit() {
    this.userId = this.activeRoute.snapshot.queryParamMap.get("userId");
    this.loadUser();
    this.loadUsers();
    this.loadHistory();
    this.updateQuarterHistoryPrizes();
  }

  loadUser() {
    // get the user from the auth service
    this.authService.user.pipe(takeUntil(this.destroy$)).subscribe(user => {
      if (user.id) {
        this.user = user;
      } else {
        // if the user is not in auth service, but the user id exists, load the user from the database
        this.db.collection("users").doc(this.userId).ref.get()
          .then(doc => {
            if (doc.exists) {
              this.user = doc.data() as User;
              this.authService.user.next(this.user);
            }
          })
      }
    });
  }

  loadUsers() {
    // get the list of users from the database
    this.db.collection("users").valueChanges().pipe(takeUntil(this.destroy$)).subscribe(users => {
      if (users.length > 0) {
        this.users = users as User[];
        // filter the users such that only users in the correct quarter exist
        this.users = this.users.filter(user => user.quarter == this.authService.quarter);
        // sort the users based on points
        this.users.sort((a, b) => a.points - b.points).reverse();
      };
    });
  }

  loadHistory() {
    // get the list of past winners
    this.db.collection("history").valueChanges().pipe(takeUntil(this.destroy$)).subscribe(history => {
      if (history.length > 0) {
        this.history = history as History[];
      };
    });
  }

  updateQuarterHistoryPrizes() {
    // get the current date
    let today = Timestamp.now().toMillis();
    // check if today is the first day of the quarter
    if (today == Constants.q1initial || today == Constants.q2initial || today == Constants.q3initial || today == Constants.q4initial) {
      let date = `${this.authService.quarter}-${new Date().getFullYear()}`;
      // if the past quarter prizes were not put in, add them
      if (!this.history[date]) {
        // calculate the prize for top winner based on their margin of points with the second place winner
        let differential = this.users[0].points - this.users[1].points;
        let topWinnerPrize = "";
        if (differential >= 50) {
          // greater than 50 point differential
          topWinnerPrize = Constants.prizes[2];
        } else if (differential >= 25) {
          // greater than 25 point differential
          topWinnerPrize = Constants.prizes[1];
        } else if (differential >= 0) {
          // greater than 0 point differential
          topWinnerPrize = Constants.prizes[0];
        }
        // create a new quarter prize object
        const newHistory: History = {
          date: date,
          topWinner: {
            id: this.users[0].id,
            prize: topWinnerPrize
          },
          randomWinner: {
            id: this.users[Math.random() * this.users.length].id,
            prize: Constants.prizes[Math.random() * 3]
          }
        };
        // make a call to the database to add the object
        this.db.collection("history").doc(date).set(newHistory);
      }
    }
  }

  // update the attendance when the user changes the value in dropdown
  onAttendanceChange(index: number, event: any) {
    this.user.events[index].attended = event.value;
    this.authService.updateUser(this.user);
  }

  // update how they attended when the user changes the value in dropdown
  onAttendanceTypeChange(index: number, event: any) {
    this.user.events[index].type = event.value;
    this.authService.updateUser(this.user);
  }

  // get the name of the user based on user id
  getUserName(userId: string) {
    return this.users.filter(user => user.id == userId)[0].name;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
