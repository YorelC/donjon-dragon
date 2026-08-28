const MAX_SEEN_MESSAGES = 256;

export class RealtimeMessageCache {
  private readonly ids = new Set<string>();

  accept(messageId: string): boolean {
    if (this.ids.has(messageId)) return false;
    this.ids.add(messageId);
    this.evictOldest();
    return true;
  }

  private evictOldest(): void {
    if (this.ids.size <= MAX_SEEN_MESSAGES) return;
    const oldest = this.ids.values().next().value;
    if (oldest) this.ids.delete(oldest);
  }
}
