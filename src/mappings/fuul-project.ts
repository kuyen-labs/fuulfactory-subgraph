import { BigInt } from "@graphprotocol/graph-ts";
import {
  FungibleBudgetDeposited as FungibleBudgetDepositedEvent,
  FungibleBudgetRemoved as FungibleBudgetRemovedEvent,
  Attributed as AttributedEvent,
  Claimed as ClaimedEvent,
} from "../../generated/templates/FuulProject/FuulProject";
import { getOrCreateUser } from "../entities/user";
import { getOrCreateUserBalance } from "../entities/userBalance";
import { getOrCreateBudget } from "../entities/budget";

export function handleFungibleBudgetDeposited(
  event: FungibleBudgetDepositedEvent
): void {
  let budget = getOrCreateBudget(event.address, event.params.currency);

  budget.amount = budget.amount
    ? budget.amount.plus(event.params.amount)
    : event.params.amount;
  budget.currency = event.params.currency;
  budget.remainingBudgetReferenceAmount = budget.remainingBudgetReferenceAmount
    ? budget.remainingBudgetReferenceAmount.plus(event.params.amount)
    : event.params.amount;

  budget.save();
}

export function handleFungibleBudgetRemoved(
  event: FungibleBudgetRemovedEvent
): void {
  let budget = getOrCreateBudget(event.address, event.params.currency);

  budget.amount = budget.amount
    ? budget.amount.minus(event.params.amount)
    : event.params.amount;
  budget.currency = event.params.currency;
  budget.remainingBudgetReferenceAmount = budget.remainingBudgetReferenceAmount
    ? budget.remainingBudgetReferenceAmount.minus(event.params.amount)
    : event.params.amount;

  budget.save();
}

export function handleAttributed(event: AttributedEvent): void {
  const receivers = event.params.receivers;
  const amounts = event.params.amounts;
  const currency = event.params.currency;

  for (let index = 0; index < receivers.length; index++) {
    const receiverAddress = receivers[index];

    let user = getOrCreateUser(receiverAddress);
    let userBalance = getOrCreateUserBalance(
      receiverAddress,
      currency,
      event.address
    );

    userBalance.owner = user.id;
    userBalance.project = event.address.toHexString();
    userBalance.availableToClaim = userBalance.availableToClaim
      ? userBalance.availableToClaim.plus(amounts[index])
      : amounts[index];
    userBalance.currency = currency;
    userBalance.claimed = userBalance.claimed
      ? userBalance.claimed
      : BigInt.fromI32(0);

    user.save();
    userBalance.save();
  }

  const projectBudget = getOrCreateBudget(event.address, currency);

  projectBudget.amount = projectBudget.amount.minus(event.params.totalAmount);

  projectBudget.save();
}

export function handleClaimed(event: ClaimedEvent): void {
  let user = getOrCreateUser(event.params.account);
  let userBalance = getOrCreateUserBalance(
    event.params.account,
    event.params.currency,
    event.address
  );

  userBalance.availableToClaim = userBalance.availableToClaim.minus(
    event.params.amount
  );
  userBalance.claimed = userBalance.claimed.plus(event.params.amount);

  user.save();
  userBalance.save();
}
