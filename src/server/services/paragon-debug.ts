import { type OnInit, Service } from "@flamework/core";
import Konsole from "@kyrorblx/konsole";
import { HttpService } from "@rbxts/services";
import { getParagonSession, isParagonEnabled, paragonEvent } from "server/states/paragon-state";

const COMMAND_RANK = 100;
const IMPLEMENTATION = "paragonSimulateBuyServer";
const DEFAULT_ROBUX = 99;
const DEFAULT_ITEM = "Item de teste";

/** Comandos de debug do Paragon no Konsole: `simbuy` simula uma compra para testar notificações no celular. */
@Service({})
export class ParagonDebugService implements OnInit {
  public onInit(): void {
    Konsole.define({
      name: "simbuy",
      rank: COMMAND_RANK,
      aliases: ["simulatebuy"],
      description: "Simula uma compra em Robux no painel Paragon (dispara a notificação; não conta na receita).",
      server: IMPLEMENTATION,
      args: [
        { name: "robux", type: "number", required: false, default: DEFAULT_ROBUX, suggestions: ["25", "99", "499"] },
        { name: "tipo", type: "string", required: false, default: "product", suggestions: ["product", "gamepass"] },
        { name: "item", type: "string", required: false, default: DEFAULT_ITEM },
      ],
    });
    Konsole.implement(IMPLEMENTATION, (context, robux, kind, item) => this.simulateBuy(context, robux, kind, item));
  }

  private simulateBuy(context: Konsole.Context, robux: unknown, kind: unknown, item: unknown): unknown {
    const player = context.entity;
    if (!player) return context.err("no-player", "Rode o comando dentro do jogo.");
    if (!isParagonEnabled()) return context.err("paragon-off", "Telemetria desligada: preencha PARAGON_API_KEY (no Studio, também PARAGON_ENABLED_IN_STUDIO).");

    const amount = math.floor(typeIs(robux, "number") ? robux : DEFAULT_ROBUX);
    if (amount < 1) return context.err("bad-robux", "Robux precisa ser ≥ 1.");

    const purchaseKind = kind === "gamepass" ? "gamepass" : "product";
    const itemName = typeIs(item, "string") && item !== "" ? item : DEFAULT_ITEM;

    // `test` faz o painel só notificar, sem gravar na receita.
    paragonEvent.Fire({
      type: "purchase",
      test: true,
      userId: player.UserId,
      sessionId: getParagonSession(player.UserId),
      purchaseId: `sim-${HttpService.GenerateGUID(false)}`,
      kind: purchaseKind,
      itemId: 0,
      itemName,
      robux: amount,
    });
    return context.reply(`Compra simulada enviada: ${amount} Robux (${purchaseKind}, "${itemName}"). Confira o celular.`);
  }
}
