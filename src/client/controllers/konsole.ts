import { Controller, OnStart } from "@flamework/core";
import Konsole from "@kyrorblx/konsole";

@Controller({})
export class KonsoleController implements OnStart {
  onStart(): void {
    Konsole.setEnabled(true);
  }
}
