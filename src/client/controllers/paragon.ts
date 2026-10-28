import { Controller, type OnStart } from "@flamework/core";
import { GuiService, UserInputService, Workspace } from "@rbxts/services";
import type { ParagonPlatform } from "shared/constants/paragon";
import { Message, messaging } from "shared/messaging";

const REPORT_DELAY = 2;
const TABLET_MIN_VIEWPORT = 700;

/** Informa ao server a plataforma do jogador (PC/Mobile/Tablet/Console/VR) para o painel Paragon. */
@Controller({})
export class ParagonController implements OnStart {
  public onStart(): void {
    // Espera o viewport estabilizar (no mobile o tamanho real chega alguns frames depois).
    task.delay(REPORT_DELAY, () => messaging.server.emit(Message.ParagonDevice, this.detectPlatform()));
  }

  private detectPlatform(): ParagonPlatform {
    if (UserInputService.VREnabled) return "VR";
    if (GuiService.IsTenFootInterface()) return "Console";
    if (!UserInputService.TouchEnabled || UserInputService.KeyboardEnabled) return "PC";

    const viewport = Workspace.CurrentCamera!.ViewportSize;
    return math.min(viewport.X, viewport.Y) >= TABLET_MIN_VIEWPORT ? "Tablet" : "Mobile";
  }
}
