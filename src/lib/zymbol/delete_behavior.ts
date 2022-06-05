export enum DeleteBehaviorType {
  /* Absorbs the cursor into this zymbol, handles delete from inside */
  ABSORB = "absorb",
  /* Can't delete the zymbol from the current cursor position */
  FORBIDDEN = "forbidden",
  /* We can simply delete this zymbol like any character */
  ALLOWED = "allowed",
  /* Indicates that a delete can be allowed with confirmation */
  UNPRIMED = "unprimed",
  /* Indicates that confirmation has been granted, we're ready to proceed with the delete
  (prime gets cleared on render by default) */
  PRIMED = "primed",
  /* Allows the child to perform a deflect delete, but the cursor position remains unchanged */
  DEFLECT = "deflect",
}

type NormalBehavior =
  | DeleteBehaviorType.ABSORB
  | DeleteBehaviorType.FORBIDDEN
  | DeleteBehaviorType.ALLOWED
  | DeleteBehaviorType.UNPRIMED
  | DeleteBehaviorType.PRIMED;

export function normalDeleteBehavior(behavior: NormalBehavior): DeleteBehavior {
  return {
    type: behavior,
  };
}

type NormalDeleteBehavior = {
  type: NormalBehavior;
};

type DeflectDeleteBehavior = {
  type: DeleteBehaviorType.DEFLECT;
  deflectedZymbolBehavior: DeleteBehavior;
};

export function deflectDeleteBehavior(
  deflectedZymbolBehavior: DeleteBehavior
): DeleteBehavior {
  return {
    type: DeleteBehaviorType.DEFLECT,
    deflectedZymbolBehavior,
  };
}

export type DeleteBehavior = NormalDeleteBehavior | DeflectDeleteBehavior;
