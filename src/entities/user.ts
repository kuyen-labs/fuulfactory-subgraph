import { Bytes, log } from "@graphprotocol/graph-ts";
import { User } from "../../generated/schema";

export function getOrCreateUser(address: Bytes): User {
  let user = User.load(address.toHexString());

  if (user == null) {
    user = new User(address.toHexString());

    user.address = address;
  }

  log.info("Updated user with id: {}", [user.address.toHexString()]);

  user.save();
  return user as User;
}
