import { type OnInit, Service } from "@flamework/core";
import { HttpService } from "@rbxts/services";
import { PARAGON_API_KEY, PARAGON_ENDPOINT, PARAGON_FLUSH_INTERVAL, PARAGON_MAX_BATCH, PARAGON_MAX_QUEUE } from "server/constants/paragon";
import { isParagonEnabled, type ParagonEvent, paragonEvent } from "server/states/paragon-state";
import type { OnPostSimulation } from "shared/hooks";

const SHUTDOWN_DEADLINE = 20;
const SHUTDOWN_RETRY_DELAY = 0.25;
const UNAUTHORIZED = 401;

/** Transporte da telemetria Paragon: enfileira eventos, envia em lote e manda compras na hora. */
@Service({})
export class ParagonService implements OnInit, OnPostSimulation {
  private readonly serverId = game.JobId !== "" ? game.JobId : `studio-${HttpService.GenerateGUID(false)}`;
  private readonly enabled = isParagonEnabled();
  private queue: ParagonEvent[] = [];
  private flushing = false;
  private urgentPending = false;
  private elapsed = 0;

  public onInit(): void {
    if (!this.enabled) return;

    // onInit roda antes de qualquer onStart/onPlayerJoin, então nenhum evento de entrada se perde.
    paragonEvent.Connect((event) => this.enqueue(event));
    game.BindToClose(() => this.drain());
  }

  public onPostSimulation(dt: number): void {
    if (!this.enabled) return;

    this.elapsed += dt;
    if (this.elapsed < PARAGON_FLUSH_INTERVAL) return;

    this.elapsed = 0;
    task.spawn(() => this.flush());
  }

  private enqueue(event: ParagonEvent): void {
    event.t ??= DateTime.now().UnixTimestampMillis;
    this.queue.push(event);
    if (this.queue.size() > PARAGON_MAX_QUEUE) this.queue.remove(0);

    if (event.type === "purchase") task.spawn(() => this.flush());
  }

  private flush(): void {
    if (this.queue.isEmpty()) return;
    if (this.flushing) {
      this.urgentPending = true;
      return;
    }

    this.flushing = true;
    const batchSize = math.min(this.queue.size(), PARAGON_MAX_BATCH);
    const batch = this.queue.filter((_, index) => index < batchSize);
    const [success, response] = pcall(() => this.send(batch));

    if (success && response.Success) {
      this.queue = this.queue.filter((_, index) => index >= batchSize);
    } else if (success && response.StatusCode === UNAUTHORIZED) {
      warn("[paragon] chave inválida — confira PARAGON_API_KEY (aba Integração do painel)");
      this.queue = [];
    }

    this.flushing = false;
    if (!this.urgentPending) return;

    this.urgentPending = false;
    task.spawn(() => this.flush());
  }

  private send(events: ParagonEvent[]): RequestAsyncResponse {
    return HttpService.RequestAsync({
      Url: PARAGON_ENDPOINT,
      Method: "POST",
      Headers: { "Content-Type": "application/json", "X-Game-Key": PARAGON_API_KEY },
      Body: HttpService.JSONEncode({ serverId: this.serverId, placeId: game.PlaceId, sentAt: DateTime.now().UnixTimestampMillis, events }),
    });
  }

  private drain(): void {
    // Cede um frame para os outros BindToClose (ex.: ParagonSessionService) enfileirarem as saídas antes do envio final.
    task.wait();

    const deadline = os.clock() + SHUTDOWN_DEADLINE;
    while (!this.queue.isEmpty() && os.clock() < deadline) {
      if (this.flushing) task.wait(SHUTDOWN_RETRY_DELAY);
      else this.flush();
    }
  }
}
