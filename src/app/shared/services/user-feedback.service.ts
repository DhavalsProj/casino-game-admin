import { Injectable } from '@angular/core';
import { ManagedUser } from './user.service';

export interface UserCreationFeedback {
  user: ManagedUser;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class UserFeedbackService {
  private creationFeedback: UserCreationFeedback | null = null;

  setCreationFeedback(feedback: UserCreationFeedback): void {
    this.creationFeedback = feedback;
  }

  consumeCreationFeedback(): UserCreationFeedback | null {
    const feedback = this.creationFeedback;
    this.creationFeedback = null;
    return feedback;
  }
}
