import { Component, OnDestroy, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { Timestamp } from 'firebase/firestore';
import { Subject, takeUntil } from 'rxjs';
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

  constructor(
    private router: Router,
    private activeRoute: ActivatedRoute,
    private authService: AuthService,
    private db: AngularFirestore
  ) { }

  ngOnInit() {
    let today = Timestamp.now().toMillis();
    
    console.log(today);
    this.userId = this.activeRoute.snapshot.queryParamMap.get("userId");
    this.authService.user.pipe(takeUntil(this.destroy$)).subscribe(user => {
      if (user.id) {
        this.user = user;
      } else {
        this.db.collection("users").doc(this.userId).ref.get()
          .then(doc => {
            if (doc.exists) {
             this.user = doc.data() as User; 
             this.authService.user.next(this.user);
            }
          })
      }
    });
    this.db.collection("users").valueChanges().pipe(takeUntil(this.destroy$)).subscribe(users => {
      if (users.length > 0) {
        this.users = users as User[];
        this.users.sort((a, b) => a.points - b.points).reverse();
      };
    })
  }

  onAttendanceChange(index: number, event: any) {
    this.user.events[index].attended = event.value;
    this.authService.updateUser(this.user);
  }

  onAttendanceTypeChange(index: number, event: any) {
    this.user.events[index].type = event.value;
    this.authService.updateUser(this.user);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
