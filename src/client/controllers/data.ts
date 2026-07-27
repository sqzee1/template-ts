import { Controller } from "@flamework/core";
import { getProfileData } from "client/utility/data-state";

@Controller({})
export class DataController {
  public getData(): PlayerTemplate | undefined {
    return getProfileData();
  }
}
