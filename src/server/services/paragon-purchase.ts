import { type OnInit, Service } from "@flamework/core";
import { MarketplaceService } from "@rbxts/services";
import { getParagonSession, paragonEvent, paragonReceipt } from "server/states/paragon-state";

interface ProductSummary {
  readonly name: string | undefined;
  readonly price: number;
}

/** Compras para o Paragon: game passes automáticos e developer products via `trackReceipt`. Cada compra dispara na hora. */
@Service({})
export class ParagonPurchaseService implements OnInit {
  private readonly productCache = new Map<string, ProductSummary>();

  public onInit(): void {
    paragonReceipt.Connect((receipt) => task.spawn(() => this.onReceipt(receipt)));
    MarketplaceService.PromptGamePassPurchaseFinished.Connect((player, gamePassId, purchased) => {
      if (purchased) this.onGamePass(player, gamePassId);
    });
  }

  private onReceipt(receipt: ReceiptInfo): void {
    const product = this.getProduct(receipt.ProductId, Enum.InfoType.Product);
    paragonEvent.Fire({
      type: "purchase",
      userId: receipt.PlayerId,
      sessionId: getParagonSession(receipt.PlayerId),
      purchaseId: receipt.PurchaseId,
      kind: "product",
      itemId: receipt.ProductId,
      itemName: product.name,
      robux: receipt.CurrencySpent ?? product.price,
    });
  }

  private onGamePass(player: Player, gamePassId: number): void {
    const product = this.getProduct(gamePassId, Enum.InfoType.GamePass);
    paragonEvent.Fire({
      type: "purchase",
      userId: player.UserId,
      sessionId: getParagonSession(player.UserId),
      kind: "gamepass",
      itemId: gamePassId,
      itemName: product.name,
      robux: product.price,
    });
  }

  private getProduct(id: number, infoType: Enum.InfoType): ProductSummary {
    const key = `${infoType.Name}:${id}`;
    const cached = this.productCache.get(key);
    if (cached) return cached;

    const [success, info] = pcall(() => MarketplaceService.GetProductInfo(id, infoType));
    if (!success) return { name: undefined, price: 0 };

    // Só pedimos Product/GamePass, que sempre trazem PriceInRobux (undefined quando fora de venda).
    const summary: ProductSummary = { name: info.Name, price: (info as DeveloperProductInfo | GamePassProductInfo).PriceInRobux ?? 0 };
    this.productCache.set(key, summary);
    return summary;
  }
}
