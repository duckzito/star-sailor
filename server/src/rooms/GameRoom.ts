import { Room, Client } from 'colyseus';

export class GameRoom extends Room {
  onCreate(): void {
    console.log('GameRoom created:', this.roomId);
  }

  onJoin(client: Client): void {
    console.log('Player joined:', client.sessionId);
  }

  onLeave(client: Client): void {
    console.log('Player left:', client.sessionId);
  }

  onDispose(): void {
    console.log('GameRoom disposed:', this.roomId);
  }
}
