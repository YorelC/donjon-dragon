# Prompt Package 3: Socket.IO Security

Contexte: donjon-dragon, NestJS 10 + Socket.IO. Le module auth (JwtAuthGuard, @Public(), @CurrentUser()) est déjà en place. Architecture hexagonale.

1. Crée back/src/chat/domain/:
   - chat-message.entity.ts: types pour les messages (senderId, roomId, content, timestamp, type)
   - chat.repository.port.ts: interface pour stocker/messages

2. Crée back/src/chat/infrastructure/:
   - ws-auth.guard.ts: Guard pour WebSocket qui vérifie le JWT dans le handshake (auth.token)
   - ws-rooms.guard.ts: Vérifie que le socket peut rejoindre une room (ownership check)

3. Crée back/src/chat/interface/:
   - chat.gateway.ts: Socket.IO gateway avec:
     - @WebSocketGateway({ namespace: /game, cors: { origin: process.env.FRONTEND_URL } })
     - handleConnection: vérifie JWT, extrait tenantId, assigne le socket au user
     - handleDisconnect: nettoie les rooms, log
     - @SubscribeMessage('join:room'): vérifie les permissions, rejoindre room
     - @SubscribeMessage('leave:room'): quitter room
     - @SubscribeMessage('message:send'): valide avec Zod, broadcast
   - chat.module.ts: importe et configure tout

4. Crée shared/src/chat-schema.ts:
   - JoinRoomDto: { roomId: string }
   - SendMessageDto: { roomId: string, content: string (min 1, max 2000) }
   - ChatMessage: { id, senderId, senderName, roomId, content, timestamp }
   - Exporte depuis shared/src/index.ts

5. Sécurités:
   - Rate limiting: max 10 messages/minute par socket
   - Message validation: Zod schema avant broadcast
   - Room isolation: un socket ne peut rejoindre que les rooms dont il est membre
   - Timeout déconnexion: 30s si pas d'auth
   - Max rooms par socket: 5

6. Tests:
   - chat.gateway.test.ts: connexion avec/sans JWT, join room, send message, rate limit

Contraintes:
- Fichiers ≤ 150 lignes, fonctions ≤ 20 lignes, any interdit
- Kebab-case + role suffixes
- pnpm typecheck && pnpm test verts