import { OnStart, Service } from "@flamework/core";
import Konsole from "@kyrorblx/konsole";

@Service({})
export class KonsoleService implements OnStart {
  onStart(): void {
    Konsole.host();
  }
}
