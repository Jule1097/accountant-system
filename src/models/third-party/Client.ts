import { ThirdParty } from "src/models/third-party/ThirdParty"
import { ThirdPartyData } from "src/types/third-party/third-party"
import { thirdPartyRoles } from "src/lib/constants/third-party"

export class Client extends ThirdParty {
  readonly role = thirdPartyRoles.client

  constructor(data: ThirdPartyData) {
    super(data)
  }
}
